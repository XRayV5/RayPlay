




var ticBoard = function(setting){

  var div = setting.div;
  var socket = setting.socket;
  var gameId = setting.gameId
  var mode = setting.gameMode;

  var size = setting.size;

  var side = setting.side;

  var imgPath = ["url(img/cross_red.png)","url(img/greenCircle.png)"];


  function placeOX (pit,track){
    if(track === 'X'){
      $("#"+pit).css("background-image",imgPath[0]);
      $("#"+pit).css("background-size","contain");
      $("#"+pit).css("background-repeat","no-repeat");
    }else if(track === 'O'){
      $("#"+pit).css("background-image",imgPath[1]);
      $("#"+pit).css("background-size","contain");
      $("#"+pit).css("background-repeat","no-repeat");
    }else{
      $("#"+pit).css("background-image","");
      $("#"+pit).css("background-size","");
      $("#"+pit).css("background-repeat","");
    }
  }


  return {

    initGrids : function (){
      $("." + div).empty();
      plotTracker=[];
      for(var i=0; i<size; i++){
        for(var j=0; j<size; j++){
          var id = i.toString()+"_"+j.toString();
          var $grid = $("<div>").addClass("grid").attr("id",id)
          $("." + div).append($grid);
        }
      }
      if(size===3){
          $(".grid").css({  "width":"28%","height":"30%"});
        }else if(size===4){
          $(".grid").css({  "width":"20%","height":"21%"});
        }else if(size===5){
          $(".grid").css({  "width":"15%","height":"17%"});
        }else if(size===8){
          $(".grid").css({  "width":"7.5%","height":"8%"});
        }
        $("." + div).append("<div class='holder'></div>");

        if(mode==="HvH"){
          $(".grid").on("click",function(event){
            console.log(event.target.id);
            //apply tellLegit here conditions : true, false, win!

            socket.emit('tic_move', {move: event.target.id, gameId: gameId ,side: side});

          });
       }
      //  else if(gameMode==="HvB"){
      //   if(goFirst==="H"){
      //    $(".grid").on("click",function(event){
      //      plotTracker.push(event.target.id);
      //      console.log(event.target.id);
      //      plot(event.target.id,plotTracker);
      //      placeOX(event.target.id,plotTracker);
      //      $(this).off("click");
      //      console.log(plotTracker);
      //      plotBot(board,plotTracker);
      //    });
      //  }else{
      //    plotBot(board,plotTracker);
      //    $(".grid").on("click",function(event){
      //      plotTracker.push(event.target.id);
      //      console.log(event.target.id);
      //      plot(event.target.id,plotTracker);
      //      placeOX(event.target.id,plotTracker);
      //      $(this).off("click");
      //      console.log(plotTracker);
      //      plotBot(board,plotTracker);
      //    });
      //  }
      // }else{
      //   //bot vs. bot game process here
      //   plotBot(board,plotTracker);
      //   interId = setInterval(function(){return plotBot(board,plotTracker);}, haltTime);
      // }
    },
    renderBrd : function (brd) {
      //render the board
      for(var i = 0; i < brd.length; i++){
        for(var j = 0; j < brd[i].length; j++){
          var grid = i + "_" +j;
          if(brd[i][j].includes("X")){
            placeOX(grid,'X');
          }else if(brd[i][j].includes("O")){
            placeOX(grid,'O');
          }else{
            placeOX(grid,'blank');
          }
        }
      }
    },
    showWinCombo : function (winCombo, color){
      $(".grid").off();
      for(var i = 0;i < winCombo.length;i++){
      var winElmt = winCombo[i].split("-")[0];
      console.log(winElmt);
      $("#"+winElmt).css({"background-color":color});
      }
    },
    promptWin : function (result){
      $("#myModal").css("display","block");
      $("#winner").empty();
      $("#winner").append("<h4>"+result+"</h4>");
    },
    showturn : function (turn){
      $('#turn').text(turn + ' goes first!');
    }

  }

}
