define(function(require, exports, module){
  require('./tpl.css');
  var tpl = require('./tpl.html');
  var plug_tpl = require('./plug_tpl.html');
  var PlugManagerView = require('./view');
  var plugManagerView = new PlugManagerView(tpl,plug_tpl);

  var PlugManagerAction = {
    start: function() {
      plugManagerView.render();
    }
  }
  module.exports = PlugManagerAction;
});