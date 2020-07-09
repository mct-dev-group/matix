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
        // center: [541331, 3374142], //[106.51, 29.55],
        // zoom: 14,
        target: 'map'
      }); 
      var layer = new ol.layer.Image({
        source: new ol.source.ImageWMS({
          url: 'http://192.168.0.250:8888/geoserver/anren/wms',
          params: {
            FORMAT: 'image/png',
            VERSION: '1.1.1',
            LAYERS: 'anren:country'
          }
        })
      });
      map.addLayer(layer);
      map.getView().fit([409466.624899996, 2908195.347, 461413.781900003, 2970272.7048], map.getSize());
    }
    // initMap: function() {
    //   var map = Map.create({
    //     epsg: 'EPSG:4326',
    //     center: [114.13, 30.63],
    //     zoom: 14,
    //     target: 'map'
    //   });
    //   this.map = map;
    //   this.addWMSLayer();
    //   // this.addWMTSLayer();
    // },
    // addWMSLayer: function() {
    //   var map = this.map;
    //   var layer = new ol.layer.Image({
    //     source: new ol.source.ImageWMS({
    //       url: 'http://localhost/qgis/qgis_mapserv.fcgi.exe?map=C:/Users/Spueni/Desktop/qgisprojects/dem32.qgs',
    //       // url: 'http://localhost:12306/mct6/app/v1/serv_name/vgis/token/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwic3ViIjowLCJpYXQiOjE1ODkxNzgyODAsImV4cCI6MTU4OTE4MDA4MH0.80j0nke6DlgM-hRQESex3-Zu0selHGO1TZ0SI87l5uQ/qgis/qgis_mapserv.fcgi.exe?map=C:/Users/Spueni/Desktop/qgisprojects/china_postgis.qgs',
    //       params: {
    //         FORMAT: 'image/png; mode=16bit',
    //         VERSION: '1.1.1',
    //         LAYERS: 'dem_f32'
    //       }
    //     })
    //   });
    //   map.addLayer(layer);
    // },
    // addWMTSLayer: function() {
    //   var map = this.map;
    //   var projection = ol.proj.get('EPSG:4326');
    //   var projectionExtent = projection.getExtent();
    //   var size = ol.extent.getWidth(projectionExtent) / 256;
    //   var resolutions = [];
    //   var matrixIds = [];
    //   for (var z = 1; z < 20; ++z) {
    //     resolutions.push(size/ Math.pow(2, z));
    //     matrixIds.push(z-1);
    //   }
    //   var layer1 = new ol.layer.Tile({
    //     source: new ol.source.WMTS({
    //       tileGrid: new ol.tilegrid.WMTS({
    //         extent: [-180.0, -90.0, 180.0, 90.0],//范围
    //         // extent: [73.441277, 18.159829, 135.086931, 53.561772],
    //         tileSize: [256, 256],
    //         origin: [-180.0, 90.0],
    //         resolutions: resolutions,
    //         matrixIds: matrixIds,
    //       }),
    //       matrixSet: "EPSG:4326",
    //       layer: "china",
    //       style: "default",
    //       format: 'image/png',
    //       // wrapX: true,
    //       // version: '1.1.0',
    //       // requestEncoding: "REST",
    //       url: "http://localhost/qgis/qgis_mapserv.fcgi.exe?map=C:/Users/Spueni/Desktop/qgisprojects/china_postgis.qgs"
    //       // url: 'http://localhost:8888/geoserver/gwc/service/wmts'
    //     })
    //   });
    //   map.addLayer(layer1);
    // }
  });
  module.exports = OlView;
});