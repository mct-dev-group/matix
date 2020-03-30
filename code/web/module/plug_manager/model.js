define(function(require, exports, module){
  var eventBus = require('../utils/event_bus');
  var PlugManagerModel = Backbone.Model.extend({
    defaults: {
      plugList: [],
    },
    initialize: function(view) {
      this.iniiListen();
      this.view = view;
    },
    iniiListen: function() {
      var self = this;
      eventBus.on('addPlug', function(plug) {
        var plugList = self.get('plugList');
        self.set({
          plugList: _.concat(plugList,plug)
        });
      });
      console.log('插件管理器初始化成功。。。');
      this.on('change:plugList', function(model,value) {
        self.view.renderPlug({
          plugList: value
        });
      });
    }
  });
  module.exports = PlugManagerModel;
});