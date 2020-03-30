define(function(require, exports, module){
  require('./tpl.css');
  var tpl = require('./tpl.html');
  var MatrixView = require('./view');

  var matrixView = new MatrixView(tpl);

  var MatrixAction = {
    start: function() {
      matrixView.render();
    }
  }
  module.exports = MatrixAction;
});