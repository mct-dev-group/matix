define(function(require, exports, module){
  require('./tpl.css');
  var WMSManageView = require('./view');
  var tpl = require('./tpl.html')
  var wmsManageView = new WMSManageView(tpl);
  var WMSManageAction = {
    start: function() {
      wmsManageView.initPlug();
    }
  }
  module.exports = WMSManageAction;
});