define(function(require, exports, module){
  var eventBus = require('../../utils/event_bus');
  var SplitScreenView = Backbone.View.extend({
    initialize: function() {
      this.finalBlend = this.finalBlend.bind(this);
    },
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
      iframe.id = 'iframe'
      iframe.src = './module/plug/split_screen/matrix.html';
      iframe.style.width = '50%';
      iframe.style.height = '100%';
      iframe.style.position = 'absolute';
      iframe.style.top = '0px';
      iframe.style.right = '0px';
      iframe.style.border = '0px';
      document.body.appendChild(iframe);
      this.iframe = iframe;
      this.initEvent();
    },
    removeIframe () {
      if (this.iframe) {
        $('#bt_container').width('100%');
        document.body.removeChild(this.iframe)
        this.iframe = null;
      }
    },
    initEvent () {
      bt_event.addEventListener('Render\\FinalBlend', this.finalBlend);
    },
    finalBlend () {
      if (this.iframe) {
        const param = bt_Util.getCameraParam();
        this.iframe.contentWindow.postMessage(param,"*");  
      }
    }
  });
  module.exports = SplitScreenView;
});