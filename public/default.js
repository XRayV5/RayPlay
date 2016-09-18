
(function () {



      var socket, serverGame;
      var username, playerColor;
      var game, board;

      var usersOnline = [];

      var myGames = [];
      socket = io();

      var render;

      //chat
      var whisperTo;


      //////////////////////////////
      // Socket.io handlers
      //////////////////////////////

      socket.on('login', function(msg) {

            //add all online users to the page
            console.log(msg.users);
            usersOnline = msg.users;
            reloadUserList();
            reloadGameList(msg.games);

      });

      socket.on('getUser', function(user){
        showUser(user);
      });

      //remove the user from the screen if disconnected
      socket.on('logout', function (msg) {
        console.log(msg.userId + "!");
        removeUser(msg.userId);
      });


      socket.on('joinlobby', function (msg) {
        //display the new user on the lobby page
        console.log('joinlobby');
        addUser(msg);
      });

      socket.on('leavelobby', function (msg) {
         //when a user start a game, remove from screen
        removeUser(msg);
      });

      socket.on('gameupdate', function(msg) {
        console.log(msg);
        reloadGameList(msg);
      });




//-------- this one starts the game!
      socket.on('joingame', function(msg) {
        console.log("joined as game id: " + msg.game.id );
        playerColor = msg.color;

        var checkEmpty = function() {
          var mtx = msg.game.board;
          for(var i = 0; i < mtx.length; i++){
            for(var j = 0; j < mtx.length; j++){
              if(mtx[i][j] !== ''){return false}
            }
          }
          return true
        }

        console.log(msg.game.board);

        if(checkEmpty()){
          initGame(msg.game);
          render.showturn(msg.game.users.x);
        }else{
          //switch between different game boards
          serverGame = msg.game;
          render.renderBrd(msg.game.board);
        }
        //start the game
        $('#page-lobby').hide();
        $('.main').show();

      });


//receive move from the other user
//serverGame got the value from init()
      socket.on('tic_move', function (msg) {
        if (serverGame && msg.gameId === serverGame.id) {//if this msg is for local current game
            console.log(msg.status.board);
            if(msg.status !== false){
              render.renderBrd(msg.status.board);
              if(msg.status.win === playerColor){
                //win
                render.promptWin("Congratulations! You are the winner");
                console.log(playerColor);
                  render.showWinCombo(msg.status.run, 'yellow');
              }else if(msg.status.win !== false && msg.status.win !== 'D'){
                //lose
                render.promptWin("You suck...");
                  render.showWinCombo(msg.status.run, 'blue');
              }else if(msg.status.win == 'D'){
                render.promptWin("Draw...");
              }
            }

        }
      });

//game_to_reset
      socket.on('restart', function(msg){
          if(serverGame && serverGame.id === msg.id){
            initGame(msg);
            render.showturn(msg.users.o);
          }
      });

//leave_game
      socket.on('quitgame', function(msg) {
        if(serverGame && serverGame.id === msg.id){
          console.log('quit');
          if($("#myModal").css("display") !== "none"){
            $("#myModal").css("display","none");
            $(".modal-header h4").remove();
          }

          $('#page-lobby').show();
          $('.main').hide();


          console.log(msg);
          usersOnline = msg.users;
          reloadUserList();
        }
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


      //click to restart the game
      $("#prpReset").on("click",function(){
        $("#myModal").css("display","none");
        $(".modal-header h2").remove();
        return socket.emit('restart', serverGame);
      });

      //click to quit prpQuit
      $("#prpQuit").on("click",function(){
        return socket.emit('quitgame', serverGame);
      });
      //game-quit
      $("#game-quit").on("click",function(){
        return socket.emit('quitgame', serverGame);
      });

      //-----lobby list editting-----

      function showUser(user) {
        $('#w').text('');
        $('#l').text('');
        $('#d').text('');
        $('#w').text(user[0].w);
        $('#l').text(user[0].l);
        $('#d').text(user[0].d);
      }

      // <span class="new badge red">4</span>
      // <span class="new badge blue">4</span>
      // <span class="new badge green">4</span>

      var addUser = function(userId) {
        usersOnline.push(userId);
        reloadUserList();
      };

     var removeUser = function(userId) {
          for (var i=0; i<usersOnline.length; i++) {
            if (usersOnline[i] === userId) {
                usersOnline.splice(i, 1);
            }
         }

         reloadUserList();
      };

      var reloadGameList = function( gamelist ) {
        $('#game-list').empty();
        gamelist.forEach(function(game) {
            var $li = $('<li>').addClass('collection-item');
            $li.attr('id',game.id);
            var info = game.users.x + " VS. " + game.users.o;
            $li.text(info);
            $('#game-list').append($li);
         });

      }



      var updateUserList = function() {
        $('#userList').empty();
        usersOnline.forEach(function(user) {
          if(username !== user){
            $('#userList').append($('<button>')
                          .text(user)
                          .on('click', function() {
                            socket.emit('invite',  user);
                          }));
          }
        });
      };

      var reloadUserList = function() {
        $('#playerlist .collection-item').remove();
        usersOnline.forEach(function(user) {
          if(username !== user){
            var $li = $('<li>').addClass('collection-item');
            var $subdiv = $('<div>').text(user);
            var $anchor = $('<a>').attr('herf','#!').addClass('secondary-content');
            var $i = $('<i>').addClass('material-icons').text('games').on('click', function() {socket.emit('invite', user)});

            var $s = $('<i>').addClass('material-icons').text('send').attr('id',user).on('click', function(event) {
              whisperTo = $(event.target).attr('id');
              $('#icon_prefix2').val("@" + whisperTo + ": ");
            });
            // "<a href='#!' class='secondary-content'><i class='material-icons'>send</i></a>";
            $anchor.append($s);
            $anchor.append($i);
            $subdiv.append($anchor);
            $li.append($subdiv);
            $('#playerlist').append($li);
          }
        });
      };


      //tictactoe drawing area:


      var initGame = function (serverGameState) {
        serverGame = serverGameState;//update local current game info

          var cfg = {
            div : 'grdgrp',
            position : serverGame.board,
            gameId : serverGame.id,
            rule : function(id){return id;},
            gameMode : 'HvH',
            goFirst : 'H',
            socket: socket,
            side: playerColor,
            size : 3
          };

          render = ticBoard(cfg);
          render.initGrids();
      }



      //-----------Chatbox feature----------------

      //sender
      $('#sendbtn').click(function() {
        var content = $('#icon_prefix2').val();
        if(content.length > 0){
          socket.emit('whisper', {to : whisperTo, message : content});
          $('#chatlog').append('<p>me' + content + '</p>');
          $('#icon_prefix2').val('');
        }
      });

      $('#groupbtn').click(function() {
        var content = $('#icon_prefix2').val();
        if(content.length > 0){
          socket.emit('broadcast', content);
          $('#chatlog').append('<p>me: ' + content + '</p>');
          $('#icon_prefix2').val('');
        }
      });

      //receiver
      socket.on('whisper', function(msg) {

        var $from = $('<span>').text(msg.from).click(function() {
            whisperTo = msg.from;
            $('#icon_prefix2').val("@" + whisperTo + ": ");
        }).css('color','red');
        var $msg = $('<p>').append($from);
        $msg.append(msg.message);
        $('#chatlog').append($msg);
      });

      socket.on('broadcast', function(msg) {
        var line = msg.from + ": " + msg.message;
        var $msg = $('<p>').append(line);
        $('#chatlog').append($msg);
      });

      //buttons that controls the modal dropdowns
      // X button to close the dropdown
      $(".close").on("click",function(){
        $("#myModal").css("display","none");
        $(".modal-header h2").remove();
      });



      // 
      // $("#AddNew").on("click",function(){
      //   return showPanel();
      // });
      //
      //
      // $("#addPlayer").on("click",function(){
      //   $(".scoreBoard .rds").remove();
      //   return addPlayer();
      // });
      //
      // $("#cancel").on("click",function(){
      //   $("#playerPanel").css("display","none");
      //   $(".scoreBoard .rds").remove();
      // });
      //
      //
      // function showPanel(){
      //   $("#playerPanel").css("display","block");
      //   printPlayers();
      // }


})();
