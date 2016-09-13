
(function () {



      var socket, serverGame;
      var username, playerColor;
      var game, board;
      var usersOnline = [];
      var myGames = [];
      socket = io();

      //////////////////////////////
      // Socket.io handlers
      //////////////////////////////

      socket.on('login', function(msg) {

            //add all online users to the page
            usersOnline = msg.users;
            updateUserList();

            //add the availble games(buttons) to the page
            myGames = msg.games;
            updateGamesList();

      });

      socket.on('joinlobby', function (msg) {
        //display the new user on the lobby page
        addUser(msg);
      });

      socket.on('leavelobby', function (msg) {
         //when a user disconnected, remove from screen
        removeUser(msg);
      });

      socket.on('gameadd', function(msg) {

      });

      socket.on('gameremove', function(msg) {

      });

//-------- this one starts the game!
      socket.on('joingame', function(msg) {
        console.log("joined as game id: " + msg.game.id );
        playerColor = msg.color;
        //start the game
        initGame(msg.game);
        $('#page-lobby').hide();
        $('#page-game').show();

      });


      //receive move from the other user
      //serverGame got the value from init()
      socket.on('move', function (msg) {
        if (serverGame && msg.gameId === serverGame.id) {
          //update the move in the logic board
           game.move(msg.move);
         //if the move is leagal, update the actual board
           board.position(game.fen());
        }
      });

      //remove the user from the screen if disconnected
      socket.on('logout', function (msg) {
        console.log(msg.userId + "!");
        removeUser(msg.userId);
      });



      //////////////////////////////
      // Menus
      //////////////////////////////
      $('#login').on('click', function() {
        username = $('#username').val();

        if (username.length > 0) {
            $('#userLabel').text(username);
            //send the login message(username) to server
            socket.emit('login', username);

            $('#page-login').hide();
            $('#page-lobby').show();
        }
      });

      $('#game-back').on('click', function() {
        socket.emit('login', username);
        $('#page-game').hide();
        $('#page-lobby').show();
      });

      // $('#game-resign').on('click', function() {
      //   socket.emit('resign', {userId: username, gameId: serverGame.id});
      //
      //   $('#page-game').hide();
      //   $('#page-lobby').show();
      // });

      var addUser = function(userId) {
        usersOnline.push(userId);
        updateUserList();
      };

     var removeUser = function(userId) {
          for (var i=0; i<usersOnline.length; i++) {
            if (usersOnline[i] === userId) {
                usersOnline.splice(i, 1);
            }
         }

         updateUserList();
      };

      var updateGamesList = function() {
        document.getElementById('gamesList').innerHTML = '';
        myGames.forEach(function(game) {
          $('#gamesList').append($('<button>')
                        .text('#'+ game)
                        .on('click', function() {
                          socket.emit('resumegame',  game);
                        }));
        });
      };

      var updateUserList = function() {
        document.getElementById('userList').innerHTML = '';
        usersOnline.forEach(function(user) {
          $('#userList').append($('<button>')
                        .text(user)
                        .on('click', function() {
                          socket.emit('invite',  user);
                        }));
        });
      };

      //////////////////////////////
      // Chess Game
      //////////////////////////////

      // var initGame = function (serverGameState) {
      //   serverGame = serverGameState;
      //
      //     var cfg = {
      //       draggable: true,
      //       showNotation: false,
      //       orientation: playerColor,
      //       position: serverGame.board ? serverGame.board : 'start',
      //       onDragStart: onDragStart,
      //       onDrop: onDrop,
      //       onSnapEnd: onSnapEnd
      //     };
      //
      //     game = serverGame.board ? new Chess(serverGame.board) : new Chess();
      //
      //     board = new ChessBoard('game-board', cfg);
      // }
      //
      // // do not pick up pieces if the game is over
      // // only pick up pieces for the side to move
      // var onDragStart = function(source, piece, position, orientation) {
      //   if (game.game_over() === true ||
      //       (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      //       (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
      //       (game.turn() !== playerColor[0])) {
      //     return false;
      //   }
      // };
      //
      //
      //
      // var onDrop = function(source, target) {
      //   // see if the move is legal
      //   var move = game.move({
      //     from: source,
      //     to: target,
      //     promotion: 'q' // : always promote to a queen for example simplicity
      //   });
      //
      //   // illegal move
      //   if (move === null) {
      //     return 'snapback';
      //   } else {
      //      socket.emit('move', {move: move, gameId: serverGame.id, board: game.fen()});
      //   }
      //
      // };
      //
      // // update the board position after the piece snap
      // // for castling, en passant, pawn promotion
      // var onSnapEnd = function() {
      //   board.position(game.fen());
      // };


      //tictactoe drawing area:

      // var render = ticBoard({
      //   div : 'grdgrp',
      //   position : 'new',
      //   rule : function(id){return id;},
      //   gameMode : 'HvH',
      //   goFirst : 'H',
      //   socket: socket,
      //   side : 'X',
      //   size : 3
      // });
      // render.initGrids();

      var initGame = function (serverGameState) {
        serverGame = serverGameState;//update local current game info

          var cfg = {
            div : 'grdgrp',
            position : serverGame.board,
            rule : function(id){return id;},
            gameMode : 'HvH',
            goFirst : 'H',
            socket: socket,
            side : 'X',
            size : 3
          };

          var render = ticBoard(cfg);
          render.initGrids();
      }



})();
