define(function(require, exports, module){
  require('./tpl.css');
  var tpl = require('./tpl.html');
  var AutoCollectView = require('./view');
  var autoCollectView = new AutoCollectView(tpl);
  var AutoCollectAction = {
    start: function() {
      autoCollectView.initPlug();
    }
  }
  module.exports = AutoCollectAction;
});