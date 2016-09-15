


var helpers = {
  getValues : function (obj) {
    var val = [];
    for(var k in obj) {
      val.push(obj[k]);
    }
    return val;
  }
}

module.exports = helpers;
