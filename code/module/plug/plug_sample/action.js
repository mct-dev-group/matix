define(function(require, exports, module){
  var PlugSampleView = require('./view');
  var plugSampleView = new PlugSampleView();
  var PlugSampleAction = {
    start: function(){
      plugSampleView.initPlug();
    }
  }
  module.exports = PlugSampleAction;
});