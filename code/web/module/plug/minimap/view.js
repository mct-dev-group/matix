define(function(require, exports, module) {
  var defs = require('./../../utils/crs-defs.json');
  var Map = require('./../../utils/map');
  var eventBus = require('../../utils/event_bus');
  var MiniMapView = Backbone.View.extend({
    initialize: function(tpl) {
      this.template = _.template(tpl);
      this.onRenderFinalBlend = this.onRenderFinalBlend.bind(this);
    },
    render: function() {
      $('body').append(this.template());
      this.initMap();
      this.initCameraPic();
    },
    initPlug: function() {
      eventBus.trigger('addPlug',{
        name: 'plug_miniMap',
        title: '鹰眼',
        value: this,
        icon: '',
        isIndependent: false, // 是否是单独的功能
        children: null
      });
      // 获取服务信息 渲染模板
      var layerConf = config.miniMapConf;
      this.layers = layerConf.layers
      this.srs = layerConf.srs;
      this.render();
    },
    activate: function(type) {
      $('#minimap').css('opacity',1);
      $('#minimap').css('z-index',0);
    },
    deactivate: function() {
      $('#minimap').css('opacity',0);
      $('#minimap').css('z-index',-1);
    },
    initMap: function() {
      if (this.layers.length > 0) {
        // 取得投影
        const srs = this.srs;
        const srsName = `EPSG:${srs}`;
        proj4.defs(srsName, defs[srsName]);
        ol.proj.proj4.register(proj4);
        var map = Map.create({
          target: 'minimap',
          epsg: srsName
        });

        for (let i = 0; i < this.layers.length; i++) {
          var layer = new ol.layer.Image({
            source: new ol.source.ImageWMS({
              url: this.layers[i].url,
              params: {
                FORMAT: 'image/png',
                VERSION: '1.1.1',
                LAYERS: this.layers[i].layer
              }
            })
          });
          map.addLayer(layer);
        }
      }
      map.getInteractions().forEach(function(element,index,array){
        if(element instanceof ol.interaction.DragPan){
          element.setActive(false);
        }
      });
    },
    initCameraPic: function() {
      this.img_c = new Image();
      this.img_c.src = './../../../images/camera_direction.png';

      this.canvas_c = document.createElement('canvas');
      this.cav_c = this.canvas_c.getContext('2d');
      document.getElementById('cameraPic').appendChild(this.canvas_c);
      bt_event.addEventListener("Render\\FinalBlend", this.onRenderFinalBlend);
    },
    onRenderFinalBlend: function() {
      this.syncMiniMap();
      this.syncCameraPic();
    },
    syncMiniMap: function() {
      let { cameraPt, lookatPt } = bt_Util.getCameraParam();
      let zero = { x: lookatPt.x, y: lookatPt.y, z: 0 }; // 视点位置
      let vHeight = 1 * Math.tan(0.5) * this.distance3(cameraPt, lookatPt); //窗口高度
     
      // 计算 bbox
      const x1 = zero.x - vHeight;
      const y1 = zero.y - vHeight;
      const x2 = zero.x + vHeight;
      const y2 = zero.y + vHeight;

      const bbox = [x1, y1, x2, y2];


      var map = Map.getMap();
      if (map) {
        map.getView().fit(bbox,map.getSize());
        // map.getView().setRotation(this.rot);
        this.syncCameraPic();
      }

    },
    syncCameraPic: function () {
      let cam_param = bt_Util.getCameraParam();
      let dx = cam_param.lookatPt.x - cam_param.cameraPt.x;
      let dy = cam_param.lookatPt.y - cam_param.cameraPt.y;
      let dz = cam_param.lookatPt.z - cam_param.cameraPt.z;
      if (dx == 0 && dy == 0) {
        dx = cam_param.upVec.x;
        dy = cam_param.upVec.y;
        if (dz > 0) {
          dy = -dy;
          dx = -dx;
        }
      }
      let rot = -Math.PI / 2 + Math.atan2(dy, dx);

      const width = 250, height = 150;

      this.canvas_c.width = width;
      this.canvas_c.height = height;
      this.cav_c.translate(width / 2, height / 2);
      this.cav_c.rotate(Math.PI*2 - rot);
      try {
        this.cav_c.drawImage(this.img_c, -this.img_c.width/2, -this.img_c.height/2 - 22);
      } catch (error) {
        console.log(error);
      }
    },
    distance3({ x: x1, y: y1, z: z1 }, { x: x2, y: y2, z: z2 }) {
      return Math.abs(
        Math.sqrt(
          Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) + Math.pow(z1 - z2, 2)
        )
      );
    }
  });
  module.exports = MiniMapView;
})