define(function(require, exports, module){
  var eventBus = require('../../utils/event_bus');
  var SplitScreenView = Backbone.View.extend({
    iframe: null,
    initPlug: function() {
      eventBus.trigger('addPlug',{
        name: 'plug_splitScreen',
        title: '分屏',
        value: this,
        icon: '',
        isIndependent: true, // 是否是单独的功能
        children: null
      });
    },
    activate: function() {
      this.createIframe();
    },
    deactivate: function() {
      this.removeIframe();
    },
    createIframe () {
      $('#bt_container').width('50%');
      var iframe = document.createElement('iframe');
      iframe.src = './module/plug/split_screen/matrix.html';
      iframe.style.width = '50%';
      iframe.style.height = '100%';
      iframe.style.position = 'absolute';
      iframe.style.top = '0px';
      iframe.style.right = '0px';
      iframe.style.border = '0px';
      document.body.appendChild(iframe);
      this.iframe = iframe;
    },
    removeIframe () {
      $('#bt_container').width('100%');
      document.body.removeChild(this.iframe)
    }
  });
  module.exports = SplitScreenView;
});