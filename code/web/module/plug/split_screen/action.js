define(function(require, exports, module){
  var SplitScreenView = require('./view');
  var splitScreenView = new SplitScreenView();
  var SplitScreenAction = {
    start: function(){
      splitScreenView.initPlug();
    }
  }
  module.exports = SplitScreenAction;
});