/**
 * WMSHelper
 * @sp
 */
define(function(){
  /**
   * @param {*} option
   * @param {String} option.url
   * @param {String} option.layers
   * @param {String} option.format
   * @param {String} option.srs
   */
  var WMSHelper = function(option) {
    this.option = option;
    /**
   * @method getRect
   * @param {*} bbox 
   * @param {*} width 
   * @param {*} height 
   * @param {*} callback 
   */
    this.getRect = function (bbox, width, height, callback) {
      const {url, layers, format, srs} = this.option;
      const urlStr = `${url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=${format}&TRANSPARENT=true&LAYERS=${layers}&SRS=${srs}&STYLES=&WIDTH=${width}&HEIGHT=${height}&BBOX=${bbox}`;

      const xhr = new XMLHttpRequest();
        // 图片请求结果处理
        xhr.onload = () => {
        const url = URL.createObjectURL(xhr.response)
        const image = new Image();
        image.onload = () => {
          const canv = document.createElement('canvas');
          const ctx = canv.getContext("2d");
          canv.width = image.width;
          canv.height = image.height;
          ctx.drawImage(image, 0, 0);
          let data = ctx.getImageData(0, 0, image.width, image.height).data;
          if (callback) callback(data)
          // 清除图片
          URL.revokeObjectURL(url);
        }
        image.onerror = () => {
          console.log(`wms服务请求出错！！！`)
        }
        image.src = url;
      }
      xhr.open('GET', urlStr, true);
      xhr.timeout = 5000;
      xhr.responseType = 'blob';
      xhr.send();
    }
  }
  return WMSHelper;
});