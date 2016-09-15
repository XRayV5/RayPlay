var express = require('express');
var app = express();
app.use(express.static('public')); // make the dircectory public
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 2333;

var mongoose = require( 'mongoose' );

//univesal unique id generator
var UUID = require('uuid');

//Import gaming logic
var logic = require('./ttt_logic');

//helper functions

var helpers = require('./helpers');

//make the board 3x3 for now
var size = 3;


var lobbyUsers = {}; //userId : user_socket
var users = {}; //userId: userId, games: {gameId : opponent user id}
var activeGames = {};//gameId : game


// database connection
mongoose.connect('mongodb://localhost/tictactoe', function(err) {
  if(err){
    console.log(err);
  }else{
    console.log("Connected to mongodb!");
  }
});

//define schema

var playerSchema = mongoose.Schema({
  username : String,
  gamekey : {type : String, default : UUID.v1()},
  w :{type : Number, default : 0},
  l :{type : Number, default : 0},
  d :{type : Number, default : 0},
  lastgame : {lastgameId : {type : String, default : ''}, board : {type : Array, default : []}}
});

var Player = mongoose.model('Detail', playerSchema);
// this will auto create a collection called Details?


app.get('/', function(req, res) {
  //send back the main page
 res.sendFile(__dirname + '/public/default.html');

});

io.on('connection', function(socket) {
    console.log('new connection ' + socket);

    socket.on('login', function(userId) {


      //username check function here to tell new user or not
      Player.find({username : userId}, function(err, rcds) {
        if(err) throw err;
        console.log(rcds);
        if(rcds.length === 0){
          var newUser = new Player({username : userId});
          newUser.save(function (err) {
            if (err) throw err;
            console.log(' New User Added to DB ');
            console.log(newUser);
              //send back user info for display
            socket.emit('getUser',[newUser]);
          });
        } else {
          console.log( 'User retrieved from DB' );
          console.log(rcds);
          //send back user info for display
          socket.emit('getUser',rcds);
        }
      });





      //display the user id received
        console.log(userId + ' joining lobby');
      //store the userId in the session 'socket'
        socket.userId = userId;

        if (!users[userId]) {
          //if user does not exist, create new
            console.log('creating new user');
            users[userId] = {userId: socket.userId, userSocket: socket , games:{}};
        } else {
            console.log('user found!');
            Object.keys(users[userId].games).forEach(function(gameId) {
                console.log('gameid - ' + gameId);
            });
        }

        socket.emit('login', {users: Object.keys(lobbyUsers),
                              games: helpers.getValues(activeGames)});
//store all user info in the lobbyUsers
        lobbyUsers[userId] = socket;
//notify all online users a new user joins the lobby
        socket.broadcast.emit('joinlobby', socket.userId);
    });
//
// //msg sent in is the text of the button clicked
    socket.on('invite', function(opponentId) {
        console.log('got an invite from: ' + socket.userId + ' --> ' + opponentId);

        //notify all users these two are gone for a game
        socket.broadcast.emit('leavelobby', socket.userId);
        socket.broadcast.emit('leavelobby', opponentId);

        //init the logic boar for the game
        //and store the board within the new game obj
        var theBoard = logic.initBoard(size);//size = 3

        var first = 'X'; //random later

        //game id, side etc. generated here
        var game = {
            id: UUID.v1(),
            over:false,
            status: 'start',
            turn : first, //can random
            board: theBoard,//store the board
            //piece color not decided here!
            users: {x: socket.userId, o: opponentId}
        };

        socket.gameId = game.id;

        //register this new game as an active game
        activeGames[game.id] = game;

        //save the game in the users' prof
        // users[game.users.x].games[game.id] = game.users.o;
        // users[game.users.o].games[game.id] = game.users.x;

        console.log('starting game: ' + game.id);

        //Starting games on both sides
        users[game.users.x].userSocket.emit('joingame', {game: game, color: 'X'});

        users[game.users.o].userSocket.emit('joingame', {game: game, color: 'O'});

        //remove from lobby 'registration'
        delete lobbyUsers[game.users.x];
        delete lobbyUsers[game.users.o];

        //notify all users a new game started...not implemented
        console.log(helpers.getValues(activeGames));
        socket.broadcast.emit('gameupdate', helpers.getValues(activeGames));
    });


    socket.on('restart', function(game){
      //find the game, find the opponent

      //send restart request - no choice for now
      game_to_reset = activeGames[game.id]
      game_to_reset.over = false;
      game_to_reset.board = logic.initBoard(size)

      io.sockets.emit('restart', game_to_reset);
    });

    socket.on('quitgame', function(msg) {
      // game_to_quit = activeGames[msg.id];
      // delete users[msg.users.x].games[msg.id];
      // delete users[msg.users.o].games[msg.id];
      // io.sockets.emit('quitgame', game_to_quit);
      delete activeGames[msg.id];

      Player.find({username : msg.users.x}, function(err, rcds) {
        if(err) throw err;
        socket.emit('getUser', rcds);
      });


      Player.find({username : msg.users.o}, function(err, rcds) {
        if(err) throw err;
        users[msg.users.o].userSocket.emit('getUser', rcds);
      });

      io.sockets.emit('gameupdate', helpers.getValues(activeGames));
      //send back online users and this user's game
      io.sockets.emit('quitgame', { id : msg.id, users : Object.keys(lobbyUsers),
                            games: Object.keys(users[socket.userId].games)});

      //add the users back to lobby list

      lobbyUsers[msg.users.x] = users[msg.users.x].userSocket;
      lobbyUsers[msg.users.o] = users[msg.users.o].userSocket;

      // notify all online users an user joins the lobby
      socket.broadcast.emit('joinlobby', socket.userId);

      //notify all that the othe user back to lobby
      if(socket.userId !== msg.users.x){
        lobbyUsers[msg.users.x].broadcast.emit('joinlobby', msg.users.x);
      }else{
        lobbyUsers[msg.users.o].broadcast.emit('joinlobby', msg.users.o);
      }


    });



    socket.on('tic_move', function(msg) {

      console.log(msg.side +  " " + msg.move);

      //get the current game board before plot

      var crt_game = activeGames[msg.gameId];

      if(!crt_game.over){
        //invoke logic here to validate the move
        var move = logic.validateMove(msg.side, msg.move, crt_game);


        //update database for new game record
        if(move.win === 'X'){
          Player.update({username : crt_game.users.x},{$inc : {w : 1} }, function (err) { if(err) throw err; });

          Player.update({username : crt_game.users.o},{$inc : {l : 1} }, function (err) { if(err) throw err; });

        }else if(move.win === 'O'){
          Player.update({username : crt_game.users.o},{$inc : {w : 1} }, function (err) { if(err) throw err; });

          Player.update({username : crt_game.users.x},{$inc : {l : 1} }, function (err) { if(err) throw err; });
        }else if(move.win === 'D'){
          Player.update({username : crt_game.users.o},{$inc : {d : 1} }, function (err) { if(err) throw err; });

          Player.update({username : crt_game.users.x},{$inc : {d : 1} }, function (err) { if(err) throw err; });
        }

//         db.products.update(
//    { sku: "abc123" },
//    { $inc: { quantity: -2, "metrics.orders": 1 } }
// )
        var newboard = {gameId: msg.gameId, status: move}

        //broadcast updated board to all users
        io.sockets.emit('tic_move', newboard);

        console.log(move);
      }
    });

    socket.on('disconnect', function(msg) {

      console.log(msg);

      if (socket && socket.userId && socket.gameId) {
        console.log(socket.userId + ' disconnected');
        console.log(socket.gameId + ' disconnected');
      }

      delete users[socket.userId];
      delete lobbyUsers[socket.userId];
      delete activeGames[socket.gameId];
      socket.broadcast.emit('gameupdate', helpers.getValues(activeGames));

      socket.broadcast.emit('logout', {
        userId: socket.userId,
        gameId: socket.gameId
      });
    });


    //-------chat handlers
    //whisper
    socket.on('whisper', function(msg) {
        users[msg.to].userSocket.emit('whisper', { from : socket.userId, message : msg.message });
    });

    socket.on('broadcast', function(msg){
        socket.broadcast.emit('broadcast', {from : socket.userId , message : msg});
    });




});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});
