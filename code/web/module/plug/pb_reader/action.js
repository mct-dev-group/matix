define(function(require, exports, module){
  var tpl = require('./tpl.html');
  var PbReaderView = require('./view');
  var pbReaderView = new PbReaderView(tpl);
  var PbReaderAction = {
    start: function(){
      pbReaderView.initPlug();
    }
  }
  module.exports = PbReaderAction;
});