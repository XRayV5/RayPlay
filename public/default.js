
(function () {



      var socket, serverGame;
      var username, playerColor;
      var game, board;

      var usersOnline = [];

      var myGames = [];
      socket = io();

      var render;
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

      socket.on('gameadd', function(msg) {

      });

      socket.on('gameremove', function(msg) {

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

        console.log(checkEmpty());
        console.log(msg.game.board);

        if(checkEmpty()){
          initGame(msg.game);
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
          updateUserList();

          myGames = msg.games;
          updateGamesList();
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

      // $('#game-back').on('click', function() {
      //   socket.emit('login', username);
      //   $('.main').hide();
      //   $('#page-lobby').show();
      // });


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
        $('#gamesList').empty();
        myGames.forEach(function(game) {
          $('#gamesList').append($('<button>')
                        .text('#'+ game)
                        .on('click', function() {
                          socket.emit('resumegame',  game);
                        }));
        });
      };

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


      //buttons that controls the modal dropdowns
      // X button to close the dropdown
      $(".close").on("click",function(){
        $("#myModal").css("display","none");
        $(".modal-header h2").remove();
      });




      $("#AddNew").on("click",function(){
        return showPanel();
      });


      $("#addPlayer").on("click",function(){
        $(".scoreBoard .rds").remove();
        return addPlayer();
      });

      $("#cancel").on("click",function(){
        $("#playerPanel").css("display","none");
        $(".scoreBoard .rds").remove();
      });


      function showPanel(){
        $("#playerPanel").css("display","block");
        printPlayers();
      }

      function addPlayer(){
          //$(".scoreBoard").append("<div>"+$("#pname").val()+"</div>");
          //access local storage
          localStorage.setItem($("#pname").val(), "");
          printPlayers();
      }


      function printPlayers(){
        for(var k in localStorage){
            $(".scoreBoard").append("<div class='rds'>"+k+" : "+localStorage[k]+"</div>");
        }
        $(".rds").on("click",function(event){
          $("#p1").append("<div class='playerUp'>" + event.target.textContent + "</div>");
        });
      }






})();
