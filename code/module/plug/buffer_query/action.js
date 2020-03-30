define(function(require, exports, module){
  require('./tpl.css');
  var BufferQueryView = require('./view');
  var bufferQueryView = new BufferQueryView();
  var BufferQueryAction = {
    start: function() {
      bufferQueryView.initPlug();
    }
  }
  module.exports = BufferQueryAction;
});