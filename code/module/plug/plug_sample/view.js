define(function(require, exports, module){
  var eventBus = require('../../utils/event_bus');
  var PlugSampleView = Backbone.View.extend({
    initPlug: function() {
      eventBus.trigger('addPlug',{
        name: 'plug_plugSample',
        title: '插件示例',
        value: this,
        icon: '',
        isIndependent: true, // 是否是单独的功能
        isOnce: false, //if true 点击之后状态还原
        children: [
          {
            title: '按钮1',
            type: '1',
            icon: '',
          },
          {
            title: '按钮2',
            type: '2',
            icon: '',
          },
          {
            title: '按钮3',
            type: '3',
            icon: '',
          }
        ]
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