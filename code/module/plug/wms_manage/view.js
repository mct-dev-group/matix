/**
 * 图层管理
 * @sp
 */
define(function(require, exports, module){
  var eventBus = require('../../utils/event_bus');
  var WMSHelper = require('./../../utils/wms_helper');
  var WFSHelper = require('./../../utils/wfs_helper');
  
  var WMSManageView = Backbone.View.extend({
    offsetx: 0,
    offsety: 0,
    // 高亮颜色
    lightColor: '#189e08',
    // 是否正在发送请求
    sendingRequest: false,
    // 相机在上一次请求图片时的位置
    lastP: null,
    // 选中图层组
    checkedLayers: [],
    initialize: function(tpl) {
      this.template = _.template(tpl);
    },
    render: function(data) {
      $('body').append(this.template(data));
      this.initEvent();
    },
    initEvent: function() {
      var self = this;
      $('#wmsManage div.card-body input[name="wms_manage_checked"]').click(function() {
        var tempLayers = [];
        $('#wmsManage div.card-body input[name="wms_manage_checked"]:checked').each(function(){//遍历每一个名字为interest的复选框，其中选中的执行函数    
          tempLayers.push($(this).val());//将选中的值添加到数组chk_value中    
        });
        self.checkedLayers = tempLayers;
        self.requestImage();
      });
      
    },
    initPlug: function() {
      eventBus.trigger('addPlug',{
        name: 'plug_wms',
        title: '图层管理',
        value: this,
        icon: 'fa fa-map',
        isIndependent: true, // 是否是单独的功能
        children: null
      });
      // 获取服务信息 渲染模板
      var serverConf = {
        wms: {
          url: 'http://39.98.79.255:8888/geoserver/test/wms',
          version: '1.1.1',
          format: 'image/png',
          srs: 'EPSG:4547',
          layers: [
            {
              title: '社区边界',
              value: 'test:community'
            },
            {
              title: '漏洞边界',
              value: 'test:building'
            }
          ]
        },
        wfs: {
          url: 'http://39.98.79.255:8888/geoserver/test/wfs',
          version: '1.0.0',
          typenames: 'test:building,test:community',
          serverType: 'geoserver'
        }
      }
      this.wms = serverConf.wms;
      this.wfs = serverConf.wfs;
      this.render(serverConf);
    },
    activate: function() {
      $('#wmsManage').show();
      // 激活场景事件
      bt_event.addEventListener("Render\\BeforeRender", this.onBeforRender.bind(this));
      bt_event.addEventListener('GUIEvent\\KM\\OnMouseClick', this.onClick.bind(this));

      // 添加二维图层 请求状态恢复默认 fasle
      this.sendingRequest = false;

      this.requestImage();
    },
    deactivate: function() {
      $('#wmsManage').hide();
      // 移除场景事件
      bt_event.removeEventListener("Render\\BeforeRender", this.onBeforRender.bind(this));
      bt_event.removeEventListener('GUIEvent\\KM\\OnMouseClick', this.onClick.bind(this));
      // 移除显示的数据
      this.hideData();
      // 移除wms图片纹理
      bt_Util.SetGlobalOrthoTexture1(
        -9999999999,
        -9999999999,
        -9999999999,
        -9999999999,
        1,
        1,
        []
      );
      bt_Util.executeScript("Render\\ForceRedraw;");
      // 更新相机位置 为默认值 null
      this.lastP = null;
    },
    onBeforRender () {
      if (this.sendingRequest) return;
      this.requestImage();
    },
    onClick (e) {
      this.requestFeature(e);
    },
    requestImage() {
      if (this.checkedLayers && this.checkedLayers.length > 0) {
        // 请求状态设为true
        this.sendingRequest = true;

        const view = this.getView();
        const zero = view.zero;
        const vHeight = view.vHeight;

        // 计算 bbox
        const x1 = zero.x - vHeight;
        const y1 = zero.y - vHeight;
        const x2 = zero.x + vHeight;
        const y2 = zero.y + vHeight;

        let bbox = x1;
        bbox += "," + y1;
        bbox += "," + x2;
        bbox += "," + y2;

        // 获取容器大小
        const container = document.getElementById("bt_container");
        const width = container.style.width.replace("px", "") * 2;
        const height = container.style.height.replace("px", "") * 2;

        // 图层顺序（按照列表顺序排序）
        let layerArr = [];
        for (let i = 0; i < this.wms.layers.length; i++) {
          if (this.checkedLayers.includes(this.wms.layers[i].value)) {
            layerArr.push(this.wms.layers[i].value);
          }
        }
        
        const {url, format, srs} = this.wms;
        let layers = layerArr.join(',');
        var wmsHelper = new WMSHelper({
          url: url,
          layers: layers,
          srs: srs,
          format: format
        });
        wmsHelper.getRect(bbox, width, height, function(data){
          for (let i = 0; i < data.length; i = i + 4) {
            data[i + 3] *= 0.5;
          }
          bt_Util.SetGlobalOrthoTexture1(x1, y2, x2, y1, width, height, data);
          bt_Util.executeScript("Render\\ForceRedraw;");
          // 请求完成 状态设为 false
          this.sendingRequest = false;
        });
      }
    },
    requestFeature(e) {
      var self = this;
      // 获取分辨率
      const container = document.getElementById("bt_container");
      const res = this.getView().vHeight / container.style.height.replace('px', '');

      // 得到世界坐标系
      const { x, y, z } = bt_Util.screenToWorld(e[1], e[2]);

      // let bbox = (x - res * 2 + this.offsetx);
      // bbox += ',' + (y - res * 2 + this.offsety);
      // bbox += ',' + (x + res * 2 + this.offsetx);
      // bbox += ',' + (y + res * 2 + this.offsety);
      let x1 = x - res * 2 + this.offsetx,
      y1 = y - res * 2 + this.offsety,
      x2 = x + res * 2 + this.offsetx,
      y2 = y + res * 2 + this.offsety;
      const CQL_FILTER = `CONTAINS(geom,POLYGON((${x1} ${y1}, ${x1} ${y2}, ${x2} ${y2}, ${x2} ${y1}, ${x1} ${y1})))`;

      const { url, version,typenames, serverType } = this.wfs;
      var wfsHelper = new WFSHelper({
        url: url,
        version: version,
        serverType: serverType
      });
      wfsHelper.getFeature(typenames,CQL_FILTER, function(dataArr){
        // 返回结果前清除上一次显示的结果
        self.hideData();
        for (let data of dataArr) {
          // 根据typename顺序 取最前面的数据
          if (data.features.length > 0) {
            self.showData(data, x, y, z);
            return;
          }
        }
      });
    },
    showData(data, x, y, z) {
      const feature = data.features[data.features.length - 1];
      this.setPop(feature, x, y, z);
      this.setLight(feature, x, y, z);
    },
    hideData() {
      // 移除高亮和标注
      bt_Plug_Annotation.removeAnnotation('wms_poi_id');
      bt_Util.executeScript("Render\\RenderDataContex\\SetOsgAttribBox 0;");
    },
    setPop(feature, x, y, z) {
      // let html = "<div class='wms_poi'>";
      // html += "<div class='pop'>"
      // html += "<ul>";
      // for (let i in feature.properties) {
      //   html += "<li>" + i + "：" + feature.properties[i] + "</li>"
      // }
      // html += "</ul>"
      // html += "</div>"
      // html += "</div>"
      var popTPl = require('./pop.html');
      var template = _.template(popTPl);
      bt_Plug_Annotation.setAnnotation('wms_poi_id', x, y, z, -8, -16, template({feature}), false);
    },
    setLight(feature, x, y, z) {
      let type = feature.geometry.type;
      let allPointArr = []
      let allPoint = ''
      let len = 0
      switch (type) {
        case "MultiPolygon":
          const coordinates = feature.geometry.coordinates;
          // 多面情况下 判断当前鼠标点位置 高亮当前区域
          for (let i = 0; i < coordinates.length; i++) {
            // 判断xy是否再面上
            const bl = this.insidePolygon([x, y], coordinates[i][0]);
            if (bl) {
              for (let j = 0; j < coordinates[i].length; j++) {
                // 轮廓线点数
                len += coordinates[i][j].length
                for (let k = 0; k < coordinates[i][j].length; k++) {
                  allPointArr.push(coordinates[i][j][k][0]);
                  allPointArr.push(coordinates[i][j][k][1]);
                }
              }
              break
            }
          }

          // for (let i = 0; i < coordinates.length; i++ ) {
          //   for (let j = 0; j < coordinates[i].length; j++) {
          //     // 轮廓线点数
          //     len += coordinates[i][j].length
          //     for (let k = 0; k < coordinates[i][j].length; k++) {
          //       allPointArr.push(coordinates[i][j][k][0])
          //       allPointArr.push(coordinates[i][j][k][1])
          //     }
          //   }
          // }

          allPoint = allPointArr.join(' ');
          //执行单体化高亮命令
          let str = `Render\\RenderDataContex\\SetOsgAttribBox -10 9999 ${this.lightColor} ${len} ${allPoint};`
          bt_Util.executeScript(str);
          break;

        default:
          bt_Util.executeScript("Render\\RenderDataContex\\SetOsgAttribBox 0;");

          break;
      }
    },
    getView() { // 获取窗口信息
      let { cameraPt, lookatPt } = bt_Util.getCameraParam();
      let zero = { x: lookatPt.x, y: lookatPt.y, z: 0 }; // 视点位置
      let vHeight = 2 * Math.tan(0.5) * this.distance3(cameraPt, lookatPt); //窗口高度
      return {
        zero,
        vHeight
      }
    },
    distance3({ x: x1, y: y1, z: z1 }, { x: x2, y: y2, z: z2 }) {
      return Math.abs(
        Math.sqrt(
          Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) + Math.pow(z1 - z2, 2)
        )
      );
    },
    insidePolygon(testPoint, points) {
      const x = testPoint[0], y = testPoint[1]
      let inside = false
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i][0], yi = points[i][1];
        const xj = points[j][0], yj = points[j][1];

        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }
  });
  module.exports = WMSManageView;
});