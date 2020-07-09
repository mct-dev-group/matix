define(function(require, exports, module){
  var PerspectiveAnalysisView = require('./view');
  var perspectiveAnalysisView = new PerspectiveAnalysisView();
  var PerspectiveAnalysisAction = {
    start: function(){
      perspectiveAnalysisView.initPlug();
    }
  }
  module.exports = PerspectiveAnalysisAction;
});