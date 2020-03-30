define(function(require, exports, module){
  require('./tpl.css');
  var tpl = require('./tpl.html');
  var OlView = require('./view');

  var olView = new OlView(tpl);

  var OlAction = {
    start: function() {
      olView.render();
    }
  }
  module.exports = OlAction;
});