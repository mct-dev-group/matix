 /**
  * 绘制矢量
  * @sp
  */
 define(function(require, exports, module){
  var Map = require('./../../utils/map');
  var eventBus = require('../../utils/event_bus');
  var PbReaderView = Backbone.View.extend({
    initialize: function(tpl) {
      this.template = _.template(tpl);
    },
    render: function() {
      $('body').append(this.template());
      this.initEvent();
    },
    initEvent: function() {
      var self = this;
      // 绘制点
      $('#drawPointBtn').click(function(){
        self.addDrawControl('Point');
      });
      // 绘制线
      $('#drawLineBtn').click(function(){
        self.addDrawControl('LineString');
      });
      // 绘制面
      $('#drawPolygonBtn').click(function(){
        self.addDrawControl('Polygon')
      });
      // 失活控件
      $('#removeVectorBtn').click(function(){
        self.removeDrawControl();
      });
      $('#saveVectorBtn').click(function(){
        debugger
        if (self.source) {
          var feas = self.source.getFeatures();
          var gj = new ol.format.GeoJSON();
          var g = gj.writeFeaturesObject(feas);
          alert(JSON.stringify(g));
        }
      });
    },
    initPlug: function() {
      eventBus.trigger('addPlug',{
        name: 'plug_drawVector',
        title: '绘制矢量',
        value: this,
        icon: '',
        isIndependent: true, // 是否是单独的功能
        isOnce: false //if true 点击之后状态还原
      });
      this.render();
      var map = Map.getMap();
      var source = new ol.source.Vector({
        wrapX: false
      });
      var vector = new ol.layer.Vector({
        source: source,
        style: new ol.style.Style({
          fill: new ol.style.Fill({
            color: '#ff00008c'
          }),
          stroke: new ol.style.Stroke({
            color: '#ff0000'
          }),
          image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
              color: '#ff0000'
            })
          })
        })
      });
      map.addLayer(vector);
      this.map = map;
      this.source = source;
    },
    activate: function() {
      $('#drawPanel').show();
    },
    deactivate: function() {
      $('#drawPanel').hide();
      this.removeDrawControl();
    },
    addDrawControl: function(type) {
      var self = this;
      this.removeDrawControl();
      var source = this.source;
      var map = this.map;
      var draw = new ol.interaction.Draw({
        source: source,
        type: type,
        stopClick: true
      }); 
      draw.on('drawend', function() {
        self.removeDrawControl();
      });
      var snap = new ol.interaction.Snap({
        source: source
      });
      var modify = new ol.interaction.Modify({
        source: source
      });
      map.addInteraction(modify);
      map.addInteraction(draw);
      map.addInteraction(snap);
      this.draw = draw;
      this.snap = snap;
      this.modify = modify;
    },
    removeDrawControl: function() {
      var draw = this.draw;
      var source = this.source;
      var map = this.map;
      map.removeInteraction(draw);
      // 清空矢量数据源
      source.clear();
    }
  });
  module.exports = PbReaderView;
});