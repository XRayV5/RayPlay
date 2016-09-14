//init the grid(2d arr) for logic
function judgeCall(crtBrd,flg){
  var win;
  for(var i=0; i<crtBrd.length; i++){
    if(crtBrd[i].every(function(e){return e.includes(flg);})){
      win = crtBrd[i];
      break;
    }
      win = false;
  }
  return win;
}

function checkDiag(crtBrd,flg){
  var diag = [];
  var win = false;
  for(var i=0; i<crtBrd.length; i++){
    diag.push(crtBrd[i][i]);
  }
  if(diag.every(function(e){return e.includes(flg);})){
    win = diag;
  }
  return win;
}

function checkDiagFlip(crtBrd,flg){
  var diag = [];
  var win = false;
  var j = 0;
  for(var i=crtBrd.length-1; i>=0; i--){
    diag.push(crtBrd[i][j]);
    j++;
  }
  if(diag.every(function(e){return e.includes(flg);})){
    win = diag;
  }
  return win;
}

function transposingArr(array){
  //flip the gameboard over 90degs
  var newArray = array[0].map(function(col, i) {
    return array.map(function(row) {
      return row[i]
    })
  });
  return newArray;
}

function checkDraw(crtBrd){
  var space = 0;
  for (var i = 0; i < crtBrd.length; i++){
    for(var j = 0; j < crtBrd[i].length; j++){
      if(crtBrd[i][j] === ''){
        return false;
      }
    }
  }
  return true;
}

function winOrloss(crtBrd,flg){
  // function of deciding w or l
  //x demension check
  // console.log(flg);
  // console.log(crtBrd);
  var hrzn = judgeCall(crtBrd,flg);
  var vert = judgeCall(transposingArr(crtBrd),flg);
  var diag = checkDiag(crtBrd,flg);
  var anti = checkDiagFlip(crtBrd,flg);
    if(hrzn!==false){
      console.log("The winner is "+flg+" horizon");
      console.log(hrzn);
      //winTrack = hrzn;
      return hrzn;
    }else if(vert!==false){
      console.log("The winner is "+flg+" vertical");
      console.log(vert);
      return vert;
    }else if(diag!==false){
      console.log("The winner is "+flg+" diag");
      console.log("###", diag);
      winTrack = diag;
      return diag;
    }else if(anti!==false){
      console.log("The winner is "+flg+" anti-diag");
      console.log(anti);
      return anti;
    }else if(checkDraw(crtBrd)){
      console.log("All Tied!");
      return "draw";
    }else{
      return false;
    }
}


var to_export = {
    initBoard : function (size){
              var iMax = size;
              var jMax = size;
              var brd = new Array();
              for (i=0;i<iMax;i++) {
               brd[i]=new Array();
               for (j=0;j<jMax;j++) {
                brd[i][j]="";
               }
              }
        return brd;
    },
    validateMove : function(side, move, game) {
      var xy = move.split('_');
      if (game.turn === side && game.board[xy[0]][xy[1]]===""){
        //game board updated
        game.board[xy[0]][xy[1]] = move + '-' + side;
        if(side === 'X'){
          game.turn = 'O';
        }else{
          game.turn = 'X';
        }

        var result = winOrloss(game.board, side);
        if(result!==false){
          game.over = true; 
          if(typeof result === "object"){
            if(result[0].includes("X")){
            //prompt X here
              return {win: 'X', run: result, board: game.board}
              console.log("X!!!");
            }else if(result[0].includes("O")){
              //promt O here
              return {win: 'O', run: result, board: game.board}
              console.log("O!!!");
            }
          }
          else{
            //prompt Draw!
            return {win: 'D', run: result, board: game.board}
            console.log(result+"!!!");
          }
        }else{
          return {win: false, run: result, board: game.board}
        }

      }else{
        return false
      }


    }

}


module.exports = to_export;
