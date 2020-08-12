/**
 */
define(function(require, exports, module){
  var eventBus = require('../../utils/event_bus');
  var plug_volume = require('./plug_volume').init_plugin_volume();

  var MeasurementView = Backbone.View.extend({
    drawType: null,
    initialize: function() {
    },
    initPlug: function() {
      eventBus.trigger('addPlug',{
        name: 'plug_volume',
        title: '土方量计算',
        value: this,
        icon: 'fa fa-pencil',
        isIndependent: true, // 是否是单独的功能
        children: [
          {
            title: '选择施工区域',
            type: 'polygon',
            icon: 'fa fa-square-o'
          }
        ]
      });
    },
    activate: function(type) {
      this.drawType = type;
      if (this.drawType === 'polygon') {
        plug_volume.activate();
      }
    },
    deactivate: function() {
      if (this.drawType === 'polygon') {
        plug_volume.deactivate();
      }
    },
  });
  module.exports = MeasurementView;
});