define(function(require, exports, module) {
  require('./tpl.css');
  var tpl = require('./tpl.html');
  var MiniMapView = require('./view');

  var miniMapView = new MiniMapView(tpl);

  var MiniMapAction = {
    start:function() {
      miniMapView.initPlug();
    }
  }
  module.exports = MiniMapAction;
});