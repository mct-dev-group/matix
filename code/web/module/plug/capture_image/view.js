 /**
  * 地图截图
  * @ sp
  */
define(function(require, exports, module){
  var eventBus = require('../../utils/event_bus');
  var CaptureImageView = Backbone.View.extend({
    initPlug () {
      eventBus.trigger('addPlug',{
        name: 'plug_captureImage',
        title: '地图截图',
        value: this,
        icon: 'fa fa fa-camera',
        isIndependent: false, // 是否是单独的功能
        isOnce: true //if true 点击之后状态还原
      });
    },
    activate () {
      this.exportImage();
    },
    deactivate () {
    },
    exportImage: function() {
      function exfun () {
        bt_event.removeEventListener('Render\\FinalBlend', exfun);
        let opts = {
          allowTaint: false,
          useCORS: true,
          height: document.getElementById("canvasgl").height,
          width: document.getElementById("canvasgl").width
        }
        html2canvas(document.getElementById('bt_container'), opts).then(cans => {
          let imgUrl = cans.toDataURL('image/png', 1);
          //获取相机参数
          let parma = bt_Util.getCameraParam();
          //文件名
          let {x, y, z} = parma.cameraPt;
          let name = `${x},${y},${z}.png`;
          // 创建a标签
          let aLink = document.createElement('a')
          aLink.download = name;
          aLink.href = imgUrl
          aLink.click();
        });
      }
      bt_event.addEventListener('Render\\FinalBlend', exfun);
      bt_Util.executeScript("Render\\ForceRedraw;");
    }
  });
  module.exports = CaptureImageView;
});