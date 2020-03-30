define(function(require, exports, module){
  require('./tpl.css');
  var tpl = require('./tpl.html')
  var DrawVectorView = require('./view');
  var drawVectorView = new DrawVectorView(tpl);
  var DrawVectorAction = {
    start: function() {
      drawVectorView.initPlug();
    }
  }
  module.exports = DrawVectorAction;
});