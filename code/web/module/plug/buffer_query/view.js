define(function(require, exports, module){
  var eventBus = require('../../utils/event_bus');
  var WFSHelperX = require('./../../utils/wfs_helperX');
  var BufferQueryView = Backbone.View.extend({
    drawType: null,
    bufferWidth: 100,
    lightColor: '#189e08',
    pointArr: [],
    pos_length: 0, //标注长度
    movePoint: null,
    initialize: function() {
      this.onClick = this.onClick.bind(this);
      this.onDbClick = this.onDbClick.bind(this);
      this.onMouseMove = this.onMouseMove.bind(this);
    },
    initPlug: function() {
      eventBus.trigger('addPlug',{
        name: 'plug_bufferQuery',
        title: '缓冲查询',
        value: this,
        icon:'fa fa-search',
        isIndependent: true, // 是否是单独的功能
        isOnce: false, //if true 点击之后状态还原
        children: [
          {
            title: '点缓冲',
            type: 'point',
            icon: 'fa fa-circle-o',
            isActive: false
          },
          {
            title: '线缓冲',
            type: 'line',
            icon: 'fa fa-vine',
            isActive: false
          },
          {
            title: '面缓冲',
            type: 'polygon',
            icon: 'fa fa-square-o',
            isActive: false
          }
        ]
      });

      // 加载服务配置
      this.wfsConf = config.bufferQueryConf;
    },
    activate: function(type) {
      this.drawType = type;
      this.pointArr = [];
      // 激活鼠标单击事件
      bt_event.addEventListener("GUIEvent\\KM\\OnMouseClick", this.onClick);
      // 激活pos事件
      $(document).on('mouseenter', '.buffer_poi', this.posEvent);
    },
    deactivate: function() {
      // 清除高亮效果
      bt_Util.executeScript("Render\\RenderDataContex\\SetOsgAttribBox 0;");
      // 移除标注
      this.removePos();
      // 事件失活
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseClick", this.onClick);
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", this.onMouseMove);
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseDbClick", this.onDbClick);
    },
    onClick: function(e) {
      if (e[0] == 0) { // 鼠标左键单击
        const px = e[1], py = e[2];
        const QueryPoint = bt_Util.executeScript("Render\\CameraControl\\QueryPointPosInScreen " + px + " " + py + ";");
        const posArr = QueryPoint[0].split(" ");
        this.removePos(); // 移除标注
        if (posArr[0] == 1) { // 击中场景
          const type = this.drawType;
          const x = Number(posArr[1]), y = Number(posArr[2]), z = Number(posArr[3]);
          switch (type) {
            case 'point':
              this.pointArr = [{x, y, z}];
              this.drawGeom();
              bt_event.addEventListener("GUIEvent\\KM\\OnMouseDbClick", this.onDbClick);
              break;
            case 'line':
            case 'polygon':
              this.pointArr.push({x, y, z});
              this.drawGeom();
              bt_event.addEventListener("GUIEvent\\KM\\OnMouseMove", this.onMouseMove);
              bt_event.addEventListener("GUIEvent\\KM\\OnMouseDbClick", this.onDbClick);
              break;
            default:
              break;
          }
        }
      } else if (e[0] == 2) { // 鼠标右键结束绘制 激活标注点击事件
        // 事件失活
        // bt_event.removeEventListener("GUIEvent\\KM\\OnMouseClick", this.onClick);
        // bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", this.onMouseMove);
        // bt_event.removeEventListener("GUIEvent\\KM\\OnMouseDbClick", this.onDbClick);
        // // 清除绘制线段
        // bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj buffer_lineOrPolygon 8;");
        // // 激活pos事件
        // $(document).on('click', '.buffer_poi', this.posEvent);
      }
    },
    onMouseMove: function(e) {
      const px = e[0], py = e[1];
      const QueryPoint = bt_Util.executeScript("Render\\CameraControl\\QueryPointPosInScreen " + px + " " + py + ";");
      const posArr = QueryPoint[0].split(" ");
      const x = Number(posArr[1]), y = Number(posArr[2]), z = Number(posArr[3]);
      const type = this.drawType;
      switch (type) {
        case 'line':
        case 'polygon':
          this.movePoint = {x, y, z};
          this.pointArrTmp = this.pointArr.concat([{x, y, z}]);
          this.moveLine();
          break;
        default:
          break;
      }
    },
    onDbClick: function (e) {
      console.log('BufferQuery');
      if (e[0] == 0) { // 鼠标左键单击

        const px = e[1], py = e[2];
        const QueryPoint = bt_Util.executeScript("Render\\CameraControl\\QueryPointPosInScreen " + px + " " + py + ";");
        const posArr = QueryPoint[0].split(" ");

        if (posArr[0] == 1) { // 击中场景
        
          // 移除鼠标移动和双击事件
          bt_event.removeEventListener("GUIEvent\\KM\\OnMouseDbClick", this.onDbClick);
          bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", this.onMouseMove);
          
          const type = this.drawType;
          const x = Number(posArr[1]), y = Number(posArr[2]), z = Number(posArr[3]);
          switch (type) {
            case 'line':
              this.pointArr.push({x, y, z});
              this.handleData(type);
              break;
            case 'polygon':
              const originPoint = this.pointArr[0];
              this.pointArr.push({x, y, z});
              this.pointArr.push(originPoint);
              this.handleData(type);
              break;
            default:
              break;
          }
          // 清除绘制线段
          bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj buffer_lineOrPolygon 8;");
          bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj buffer_moveline 8;");
          // 清空点集合
          this.pointArr = [];
        }
      }
    },
    moveLine () {
      const type = this.drawType;
      const line_id = 'buffer_moveline';
      const lastP = this.pointArr[this.pointArr.length -1];
      const startP = this.pointArr[0];
      let scriptStr = null;
      switch (type) {
        case 'line':
          // 渲染线段
          // scriptStr = `Render\\RenderDataContex\\DynamicFrame\\AddRenderObj ${line_id} 4 1 (0,0,0) 8 2 2 (${lastP.x},${lastP.y},${lastP.z},255,255,0,255) (${this.movePoint.x},${this.movePoint.y},${this.movePoint.z},255,255,0,255) (0,1) 0;`;
          scriptStr = `Render\\RenderDataContex\\DynamicFrame\\AddRenderObj ${line_id} 4 1 (${lastP.x},${lastP.y},${lastP.z}) 8 2 2 (0,0,0,255,255,0,255) (${this.movePoint.x - lastP.x},${this.movePoint.y - lastP.y},${this.movePoint.z - lastP.z},255,255,0,255) (0,1) 0;`;
          bt_Util.executeScript(scriptStr);
          bt_Util.executeScript(`Render\\ForceRedraw;`);
          break;
        case 'polygon':
          // 渲染线段
          // scriptStr = `Render\\RenderDataContex\\DynamicFrame\\AddRenderObj ${line_id} 4 1 (0,0,0) 8 3 4 (${startP.x},${startP.y},${startP.z},255,255,0,255) (${this.movePoint.x},${this.movePoint.y},${this.movePoint.z},255,255,0,255) (${lastP.x},${lastP.y},${lastP.z},255,255,0,255) (0,1,1,2) 0;`;
          scriptStr = `Render\\RenderDataContex\\DynamicFrame\\AddRenderObj ${line_id} 4 1 (${startP.x},${startP.y},${startP.z}) 8 3 4 (0,0,0,255,255,0,255) (${this.movePoint.x - startP.x},${this.movePoint.y - startP.y},${this.movePoint.z - startP.z},255,255,0,255) (${lastP.x - startP.x},${lastP.y - startP.y},${lastP.z - startP.z},255,255,0,255) (0,1,1,2) 0;`;
          bt_Util.executeScript(scriptStr);
          bt_Util.executeScript(`Render\\ForceRedraw;`);
        default:
          break;
      }
    },
    drawGeom () {
      const type = this.drawType;
      switch (type) {
        case 'point':
          this.handleData(type);
          break;
        case 'line':
        case 'polygon':
          bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj buffer_moveline 8;");
          bt_Util.executeScript(`Render\\ForceRedraw;`);

          let pointArr = this.pointArr;
          // 计算顶点个数
          const vertex_count = pointArr.length;
          // 计算索引个数
          const index_count = vertex_count == 1 ? 1 : 2*(vertex_count -1); 
          // 计算索引
          let indexStr = `(`;
          for (let i = 0; i < pointArr.length -1; i++) {
            indexStr += `${i},${i+1},`;
          }
          indexStr = indexStr.substr(0, indexStr.length -1);
          indexStr += `)`;

          // 起始点
          const {x ,y ,z} = pointArr[0];

          let pointStr = ``;
          for (const point of pointArr) {
            pointStr += ` (${point.x - x},${point.y - y},${point.z - z},255,255,0,255)`;
          }
          //渲染线段
          const line_id = 'buffer_lineOrPolygon'
          const scriptStr = `Render\\RenderDataContex\\DynamicFrame\\AddRenderObj ${line_id} 4 1 (${x},${y},${z}) 8 ${vertex_count} ${index_count} ${pointStr} ${indexStr} 0;`;
          bt_Util.executeScript(scriptStr);
          bt_Util.executeScript(`Render\\ForceRedraw;`);
          break;
        default:
          break;
      }
    },
    handleData (type) {
      const pointArr = this.pointArr;
      let wktTmp ='';
      for (const point of pointArr) {
        wktTmp += `${point.x} ${point.y},`;
      }
      wktTmp = wktTmp.substr(0, wktTmp.length -1);

      let wkt = null;
      switch (type) {
        case 'point':
          wkt = `POINT (${wktTmp})`;
          break;
        case 'line':
          wkt = `LINESTRING (${wktTmp})`;
          break;
        case 'polygon':
          wkt = `POLYGON ((${wktTmp}))`;
          break;
        default:
          break;
      }
      
      // 计算缓冲边界
      const reader = new jsts.io.WKTReader();
      const jstsGeom = reader.read(wkt);
      const buffered = jstsGeom.buffer(this.bufferWidth);
      const coordinates = buffered.getCoordinates();

      const pointStr = this.convertToStr(coordinates);
      const len = coordinates.length;

      // 设置高亮
      this.setLight(pointStr, len);
      this.requestFeature(pointStr);
    },
    convertToStr (coordinates) {
      let pointArr = [];
      for (const ite of coordinates) {
        const tmpArr = [ite.x, ite.y];
        pointArr = pointArr.concat(tmpArr);
      }
      return pointArr.join(' ');
    },
    setLight (pointStr, len) {
      //执行单体化高亮命令
      const str = `Render\\RenderDataContex\\SetOsgAttribBox -10 9999 ${this.lightColor} ${len} ${pointStr};`
      bt_Util.executeScript(str);
    },
    requestFeature (pointStr) {
      var self = this;
      let coordinates = [];
      const pointArr = pointStr.split(' ');
      for (let i = 0; i < pointArr.length; i+=2) {
        coordinates.push([pointArr[i], pointArr[i+1]]);
      }
      const {url, typename, srs, geometryName } = this.wfsConf;
      let wfsHelperX = new WFSHelperX({
        url,
        srsName: `EPSG:${srs}`,
        geometryName
      });
      wfsHelperX.getFeatures({
        featureTypes: [typename],
        filter: ol.format.filter.intersects(geometryName, new ol.geom.Polygon([coordinates]))
      }, function(data) {
        let gj = wfsHelperX.convertGml3ToGeoJSON(data, `EPSG:${srs}`);
        self.showPos(gj);
      });
    
      // const pointArr = pointStr.split(' ');
      // const { url, version, typename, serverType } = this.wfs;
      // let outputformat = '';
      // let urlStr = '';
      // if (serverType && serverType == 'geoserver') {
      //   outputformat = '&outputFormat=application/json';
      //   let polygon2 = '';
      //   for (let i = 0; i < pointArr.length; i+=2) {
      //     polygon2 += `${pointArr[i]} ${pointArr[i+1]},`;
      //   }
      //   polygon2 = polygon2.substring(0, polygon2.length -1);
      //   const CQL_FILTER = `Intersects(the_geom,POLYGON((${polygon2})))`;
      //   urlStr = `${url}?service=WFS&request=GetFeature&version=${version}&typename=${typename}&CQL_FILTER=${CQL_FILTER}${outputformat}`;
      // } else {
      //   let polygon =  ``;
      //   for (let i = 0; i < pointArr.length; i+=2) {
      //     polygon += `${pointArr[i]},${pointArr[i+1]} `;
      //   }
      //   const filter = `<ogc:Filter><ogc:Intersects><ogc:PropertyName>Shape</ogc:PropertyName><gml:Polygon><gml:outerBoundaryIs><gml:LinearRing><gml:coordinates>${polygon}</gml:coordinates></gml:LinearRing></gml:outerBoundaryIs></gml:Polygon></ogc:Intersects></ogc:Filter>`;
      //   urlStr = `${url}?service=WFS&request=GetFeature&version=${version}&typename=${typename}&filter=${filter}${outputformat}`;
      // }
      // if (serverType && serverType == 'geoserver') outputformat = '&outputFormat=application/json';
      // const filter = `<ogc:Filter><ogc:Intersects><ogc:PropertyName>Shape</ogc:PropertyName><gml:Polygon><gml:outerBoundaryIs><gml:LinearRing><gml:coordinates>${polygon}</gml:coordinates></gml:LinearRing></gml:outerBoundaryIs></gml:Polygon></ogc:Intersects></ogc:Filter>`;
      // const urlStr = `${url}?service=WFS&request=GetFeature&version=${version}&typename=${typename}&filter=${filter}${outputformat}`;

      // $.ajax({
      //   url: urlStr,
      //   type: 'get',
      //   dataType: 'text',
      //   timeout: 5000,
      //   success: (data) => {
      //     if (serverType && serverType == 'geoserver') {
      //       const gj = JSON.parse(data);
      //       this.showPos(gj);
      //     } else {
      //       const gmlParser = new GMLParser();
      //       const gj = gmlParser.gml2Geojson(data);          
      //       this.showPos(gj);
      //     }
      //   },
      //   error: (error) => {
      //     console.log(error);
      //   }
      // })
    },
    showPos (data) {
      const features = data.features;
      this.pos_lenth = features.length;
      for (let i = 0; i < features.length; i++) {
        const feature = features[i];
        const [x, y] = feature.geometry.coordinates;
        // 求交得到当前点的高度z值
        const result = bt_Util.executeScript(`Render\\CameraControl\\LineIntersect ${x} ${y} -10 ${x} ${y} 8848;`);
        const resultArr = result[0].split(' ');
        const z = resultArr[0] == 1 ? resultArr[3] : 10;
        var popTPl = require('./pop.html');
        var template = _.template(popTPl);
        bt_Plug_Annotation.setAnnotation('buffer_poi_'+i, x, y, z, -8, -16, template({feature}), false);
      }
    },
    posEvent (e) {
      $('.buffer_poi .bufferPop').hide();
      $(e.currentTarget).find('.bufferPop').show();
      $('.bt_ui_element').css({'z-index':10})
      $(e.currentTarget).parent().parent().css({'z-index':11});
    },
    removePos () {
      $(document).off('click', '.buffer_poi', this.posEvent);
      for (let i = 0; i < this.pos_lenth; i++) {
        bt_Plug_Annotation.removeAnnotation('buffer_poi_'+i);
      }
      this.pos_lenth = 0;
    }
  });
  module.exports = BufferQueryView;
});