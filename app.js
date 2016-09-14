var express = require('express');
var app = express();
app.use(express.static('public')); // make the dircectory public
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 2333;


//Import gaming logic
var logic = require('./ttt_logic');
//make the board 3x3 for now
var size = 3;


var lobbyUsers = {}; //userId : user_socket
var users = {}; //userId: userId, games: {gameId : opponent user id}
var activeGames = {};

app.get('/', function(req, res) {
  //send back the main page
 res.sendFile(__dirname + '/public/default.html');

});

io.on('connection', function(socket) {
    console.log('new connection ' + socket);

    socket.on('login', function(userId) {
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
                              games: Object.keys(users[userId].games)});
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
        var theBoard =   logic.initBoard(size);//size = 3



        var first = 'X'; //random later

        //game id, side etc. generated here
        var game = {
            id: Math.floor((Math.random() * 100) + 1),
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
        socket.broadcast.emit('gameadd', {gameId: game.id, gameState:game});
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


    //  socket.on('resumegame', function(gameId) {
    //     console.log('ready to resume game: ' + gameId);
    //
    //     socket.gameId = gameId;
    //     var game = activeGames[gameId];
    //
    //     //put the game back - for both
    //     users[game.users.o].games[game.id] = game.id;
    //     users[game.users.x].games[game.id] = game.id;
    //
    //     console.log('resuming game: ' + game.id);
    //     if (lobbyUsers[game.users.o]) {
    //         lobbyUsers[game.users.o].emit('joingame', {game: game, color: 'O'});
    //         delete lobbyUsers[game.users.o];
    //     }
    //
    //     if (lobbyUsers[game.users.x]) {
    //         lobbyUsers[game.users.x] &&
    //         lobbyUsers[game.users.x].emit('joingame', {game: game, color: 'X'});
    //         delete lobbyUsers[game.users.x];
    //     }
    // });

    socket.on('tic_move', function(msg) {

      console.log(msg.side +  " " + msg.move);

      //get the current game board before plot

      var crt_game = activeGames[msg.gameId];

      if(!crt_game.over){
        //invoke logic here to validate the move
        var move = logic.validateMove(msg.side, msg.move, crt_game);

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

      delete lobbyUsers[socket.userId];

      socket.broadcast.emit('logout', {
        userId: socket.userId,
        gameId: socket.gameId
      });
    });



    // socket.on('tic_move', function(msg){console.log(msg.side +  " " + msg.move)});

});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});
