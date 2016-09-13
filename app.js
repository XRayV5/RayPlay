var express = require('express');
var app = express();
app.use(express.static('public')); // make the dircectory public
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 2333;

var lobbyUsers = {};
var users = {};
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
            users[userId] = {userId: socket.userId, games:{}};
        } else {
            console.log('user found!');
            Object.keys(users[userId].games).forEach(function(gameId) {
              //where gameId gets value??
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

        //write function to start the logic
        //var logic = logicModule({gamesetting})
        //var newBoard = initBoard

        //then send back board broadcasting/tageted



        //game id, side etc. generated here
        var game = {
            id: Math.floor((Math.random() * 100) + 1),
            board: null,//store the board
            users: {x: socket.userId, o: opponentId}
        };

        socket.gameId = game.id;

        //register a active game
        activeGames[game.id] = game;

        users[game.users.x].games[game.id] = game.id;
        users[game.users.o].games[game.id] = game.id;

        console.log('starting game: ' + game.id);

        //Starting games on both sides
        lobbyUsers[game.users.x].emit('joingame', {game: game, color: 'x'});

        lobbyUsers[game.users.o].emit('joingame', {game: game, color: 'o'});

        //remove from lobby 'registration'
        delete lobbyUsers[game.users.white];
        delete lobbyUsers[game.users.black];

        //notify all users a new game started...not implemented
        socket.broadcast.emit('gameadd', {gameId: game.id, gameState:game});
    });
//
//      socket.on('resumegame', function(gameId) {
//         console.log('ready to resume game: ' + gameId);
//
//         socket.gameId = gameId;
//         var game = activeGames[gameId];
//
//         //put the game back - for both
//         users[game.users.white].games[game.id] = game.id;
//         users[game.users.black].games[game.id] = game.id;
//
//         console.log('resuming game: ' + game.id);
//         if (lobbyUsers[game.users.white]) {
//             lobbyUsers[game.users.white].emit('joingame', {game: game, color: 'white'});
//             delete lobbyUsers[game.users.white];
//         }
//
//         if (lobbyUsers[game.users.black]) {
//             lobbyUsers[game.users.black] &&
//             lobbyUsers[game.users.black].emit('joingame', {game: game, color: 'black'});
//             delete lobbyUsers[game.users.black];
//         }
//     });
//
//     socket.on('move', function(msg) {
//       //why do I have to broadcast the move??
//       //because the user info has been removed from lobby user
//         socket.broadcast.emit('move', msg);
//       //stores and updates the board, for resume
//         activeGames[msg.gameId].board = msg.board;
//         console.log(msg);
//     });
//
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



    socket.on('tic_move', function(msg){console.log(msg.side +  " " + msg.move)});

});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});
