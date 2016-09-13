//init the grid(2d arr) for logic



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
    validateMove : function(side, move) {
      
    }

}


module.exports = to_export;
