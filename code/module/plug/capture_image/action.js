define(function(require, exports, module){
  var CaptureImageView = require('./view');
  var captureImageView = new CaptureImageView();
  var CaptureImageAction = {
    start: function(){
      captureImageView.initPlug();
    }
  }
  module.exports = CaptureImageAction;
});