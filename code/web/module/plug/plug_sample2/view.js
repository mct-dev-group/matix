define(function(require, exports, module){
  var eventBus = require('../../utils/event_bus');
  var PlugSampleView = Backbone.View.extend({
    initPlug: function() {
      eventBus.trigger('addPlug',{
        name: 'plug_plugSample2',
        title: '插件示例2',
        value: this,
        icon: '',
        isIndependent: true, // 是否是单独的功能
        children: null
      });
      console.log('加载sample插件。。。。');
    },
    activate: function(type) {
      console.log('激活插件',type);
    },
    deactivate: function() {
      console.log('失活插件');
    }
  });
  module.exports = PlugSampleView;
});