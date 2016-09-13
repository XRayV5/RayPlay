




var ticBoard = function(setting){
  //setting = {div, position, rule(on_click), gameMode, , goFirst, size}
  var div = setting.div;
  var position = setting.position; //arr[][]
  var tellLegit = setting.rule;
  var socket = setting.socket;
  var gameId = setting.gameId
  console.log("socket:" + socket);
  var mode = setting.gameMode;
  var first = setting.goFirst;
  var size = setting.size;

  var side = setting.side;

  var imgPath = ["url(img/cross_red.png)","url(img/greenCircle.png)"];

  var plotTracker;

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
        //$(".grdgrp").append("<div class='holder'></div>");

        function placeOX(pit,track){
          if(track === 'X'){//track === 'X'
            //$("#"+pit).append($("<img>").attr("src",imgPath[0]));
            $("#"+pit).css("background-image",imgPath[0]);
            $("#"+pit).css("background-size","contain");
            $("#"+pit).css("background-repeat","no-repeat");
          }else{
            //$("#"+pit).append($("<img>").attr("src",imgPath[1]));
            $("#"+pit).css("background-image",imgPath[1]);
            $("#"+pit).css("background-size","contain");
            $("#"+pit).css("background-repeat","no-repeat");
          }
        }


        if(mode==="HvH"){
          $(".grid").on("click",function(event){
            console.log(event.target.id);
            //apply tellLegit here conditions : true, false, win!
            var status = tellLegit('X');

            socket.emit('tic_move', {move: event.target.id, gameId: gameId ,side: side});

            // if(status === 'X'){
            //
            //   plotTracker.push(event.target.id);
            //   console.log(event.target.id);
            //   //plot(event.target.id,plotTracker);
            //   placeOX(event.target.id, status);
            //   $(event.target).off("click");
            //   console.log(plotTracker);
            //
            // }

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
    }


  }

}








function showWinCombo(winCombo){
  for(var i = 0;i < winCombo.length;i++){
  var winElmt = winCombo[i].split("_").slice(0,2).join("_");
  console.log(winElmt);
  $("#"+winElmt).css({"background-color":"yellow"});
  }
}
