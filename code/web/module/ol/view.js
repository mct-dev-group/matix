define(function(require, exports, module){
  var Map = require('./../utils/map');
  var OlView = Backbone.View.extend({
    initialize: function(tpl) {
      this.template = _.template(tpl);
    },
    render: function() {
      $('body').append(this.template());
      // 初始化地图
      this.initMap();
    },
    initMap: function() {
      proj4.defs('EPSG:4547', '+proj=tmerc +lat_0=0 +lon_0=114 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs');
      ol.proj.proj4.register(proj4);
      var map = Map.create({
        epsg: 'EPSG:4547',
        center: [541331, 3374142], //[106.51, 29.55],
        zoom: 14,
        target: 'map'
      }); 
      var layer = new ol.layer.Image({
        source: new ol.source.ImageWMS({
          url: 'http://39.98.79.255:8888/geoserver/test/wms',
          params: {
            FORMAT: 'image/png',
            VERSION: '1.1.1',
            LAYERS: 'test:community'
          }
        })
      });
      map.addLayer(layer);
    }
  });
  module.exports = OlView;
});