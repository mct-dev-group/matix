/**
 * 图层管理
 * @sp
 */
define(function(require, exports, module){
  var eventBus = require('../../utils/event_bus');
  var WMSHelper = require('./../../utils/wms_helper');
  var WFSHelperX = require('./../../utils/wfs_helperX');
  
  var WMSManageView = Backbone.View.extend({
    offsetx: 0,
    offsety: 0,
    // 高亮颜色
    lightColor: '#189e08',
    // 是否正在发送请求
    sendingRequest: false,
    // 相机在上一次请求图片时的位置
    lastP: null,
    isThirdLayer: false,
    // 选中图层组
    checkedLayers: [],
    initialize: function(tpl) {
      this.template = _.template(tpl);
      this.onBeforRender = this.onBeforRender.bind(this);
      this.onClick = this.onClick.bind(this);
    },
    render: function(data) {
      $('body').append(this.template(data));
      this.initEvent();
    },
    initEvent: function() {
      var self = this;
      // 复选框按钮事件
      $('#wmsManage div.card-body input[name="wms_manage_checked"]').click(function() {
        self.checkedLayers = self.getSelectLayers();
        self.requestImage();
      });
    },
    getSelectLayers: function () {
      var tempLayers = [];
      $('#wmsManage div.card-body input[name="wms_manage_checked"]:checked').each(function(){//遍历每一个名字为interest的复选框，其中选中的执行函数    
        tempLayers.push(JSON.parse($(this).val()));//将选中的值添加到数组chk_value中    
      });
      return tempLayers;
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
      var layerConf = config.wmsManageConf;
      this.layerConf = layerConf;
      this.render({layerConf});
    },
    activate: function() {
      $('#wmsManage').show();
      // 激活场景事件
      bt_event.addEventListener("Render\\BeforeRender", this.onBeforRender);
      bt_event.addEventListener('GUIEvent\\KM\\OnMouseClick', this.onClick);

      // 添加二维图层 请求状态恢复默认 fasle
      this.sendingRequest = false;

      this.requestImage();
    },
    deactivate: function() {
      $('#wmsManage').hide();
      // 移除场景事件
      bt_event.removeEventListener("Render\\BeforeRender", this.onBeforRender);
      bt_event.removeEventListener('GUIEvent\\KM\\OnMouseClick', this.onClick);
      // 取消图层列表复选框
      $('#wmsManage div.card-body input[name="wms_manage_checked"]').each(function() {
        $(this).prop("checked", false);
      })
      this.checkedLayers = [];
      // 移除显示的数据
      this.hideData();
      // 移除wms图片纹理
      this.clearImage();
      // 更新相机位置 为默认值 null
      this.lastP = null;
    },
    onBeforRender () {
      if (this.sendingRequest) return;
      // 获取相机位置
      const p = bt_Util.getCameraParam().cameraPt;
      // 如果当前相机位置和上一次请求图片时相机位置相等 则不再请求 直接return
      if (
        this.lastP &&
        this.lastP.x == p.x &&
        this.lastP.y == p.y &&
        this.lastP.z == p.z
      )
        return;
      // 更新相机位置
      this.lastP = p;
      // 发送请求
      this.requestImage();
    },
    onClick (e) {
      this.requestFeature(e);
    },
    clearImage () {
      bt_Util.SetGlobalOrthoTexture1(
        -9999999999,
        -9999999999,
        -9999999999,
        -9999999999,
        1,
        1,
        new Image()
      );
      bt_Util.executeScript("Render\\ForceRedraw;");
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
        // const container = document.getElementById("bt_container");
        // const width = container.style.width.replace("px", "") * 2;
        // const height = container.style.height.replace("px", "") * 2;
        const width = document.getElementById('bt_container').clientWidth;
        const height = document.getElementById('bt_container').clientHeight;

        // 请求wms服务
        let srs = this.layerConf.srs,layers = [];
        for (let i = 0; i < this.checkedLayers.length; i++) {
          layers.push(this.checkedLayers[i].wms.layer);
        }
        let wmsHelper = new WMSHelper({
          url: this.layerConf.wmsUrl,
          layers: layers,
          srs: `EPSG:${srs}`,
          format: 'image/png'
        });
        wmsHelper.getRectImage(bbox, width, height, (image) =>{
          bt_Util.SetGlobalOrthoTexture1(x1, y2, x2, y1, width, height, image);
          bt_Util.executeScript("Render\\ForceRedraw;");
          // 请求完成 状态设为 false
          this.sendingRequest = false;
        });
      } else {
        this.clearImage();
      }
    },
    requestFeature(e) {
      var self = this;
      // 获取分辨率
      // const container = document.getElementById("bt_container");
      // const width = document.getElementById('bt_container').clientWidth;
      const height = document.getElementById('bt_container').clientHeight;
      const res = this.getView().vHeight / height;

      // 得到世界坐标系
      const { x, y, z } = bt_Util.screenToWorld(e[1], e[2]);
      const bbox = [x - res * 2 + this.offsetx, y - res * 2 + this.offsety, x + res * 2 + this.offsetx, y + res * 2 + this.offsety];

      let featureTypes = [], wfsHelperX = null, srs = this.layerConf.srs;
      for (let i = 0; i < this.checkedLayers.length; i++) {
        featureTypes.push(this.checkedLayers[i].wfs.typename);
      }
      wfsHelperX = new WFSHelperX({
        url: this.layerConf.wfsUrl,
        srsName: `EPSG:${srs}`,
        geometryName: this.layerConf.geometryName || 'geom'
      });
      let polygon = new ol.geom.Polygon([[[bbox[0], bbox[1]], [bbox[0], bbox[3]], [bbox[2], bbox[3]], [bbox[2], bbox[1]], [bbox[0], bbox[1]]]]);
      wfsHelperX.getFeaturesBySort({
        featureTypes,
        filter: ol.format.filter.contains(this.layerConf.geometryName || 'geom', polygon)
      }, function(dataArr) {
        // 返回结果前清除上一次显示的结果
        self.hideData();
        for (let data of dataArr) {
          let gj = wfsHelperX.convertGml3ToGeoJSON(data, `EPSG:${srs}`);
          // 根据typename顺序 取最前面的数据
          if (gj.features.length > 0) {
            self.showData(gj, x, y, z);
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
      let vHeight = 2.5 * Math.tan(0.5) * this.distance3(cameraPt, lookatPt); //窗口高度
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