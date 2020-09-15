define(function(require, exports, module){
  require('./tpl.css');
  var CustomizeModelView = require('./view');
  var tpl = require('./tpl.html');
  var ctrl = require('./ctrl.html');
  var customizeModelView = new CustomizeModelView(tpl, ctrl);
  var CustomizeModelAction = {
    start: function(){
      customizeModelView.initPlug();
    }
  }
  module.exports = CustomizeModelAction;
});