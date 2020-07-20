define(function(require, exports, module){
  var MeasurementView = require('./view');
  var measurementView = new MeasurementView();
  var MeasurementAction = {
    start: function(){
      measurementView.initPlug();
    }
  }
  module.exports = MeasurementAction;
});