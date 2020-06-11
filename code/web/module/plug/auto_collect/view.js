define(function(require, exports, module){
  var eventBus = require('../../utils/event_bus');
  var AutoCollectView = Backbone.View.extend({
    initialize: function(tpl) {
      this.template = _.template(tpl);
    },
    render:function () {
      $('body').append(this.template());
      
      this.initLocalDB();
    },
    initPlug: function() {
      eventBus.trigger('addPlug',{
        name: 'plug_autoCollect',
        title: '拆迁面积计算',
        value: this,
        icon: '',
        isIndependent: true, // 是否是单独的功能
        children: [
          {
            title: '选取建筑',
            type: 'collect',
            icon: 'fa fa-circle-o',
          },
          {
            title: '导出轮廓',
            type: 'export',
            icon: 'fa fa-circle-o',
            isOnce:true //一次性点击功能
          },
          {
            title: '清除数据',
            type: 'clear',
            icon: 'fa fa-vine',
            isOnce:true //一次性点击功能
          }
        ]
      });
      this.render();
    },
    activate: function(type) {
      switch (type) {
        case 'collect':
          $('#aotuCollect').show();
          this.openBorderCollect();
          break;
        case 'export':
          this.exportBorderData();
          break;
        case 'clear':
          this.clearLocalData();
          break;
        default:
          break;
      }
    },
    deactivate: function() {
      $('#aotuCollect').hide();
      var that = this;
      // 关闭边界提取功能
      bt_Util.executeScript("Plugin\\DeactivePlugin OsgFeatureAbstract;");
      bt_event.removeEventListener("Plugin\\OsgFeatureAbstract\\OnBldgPick", that.onBldgPick.bind(that));
      that.closeBorderCollect();
    },
    initLocalDB: function() {
      var that = this;
      localDB.set("autoCollectSign", true);
      if (!bt_indexedDB.isSupport()) {
        alert('所使用的浏览器暂不支持indexedDB!');
      }
      // 打开、创建数据库
      bt_indexedDB.createDB('buddb', 1, 'contourLines', [{
        name: 'name',
        attr: 'name',
        unique: true
      }], 'id', null).then(resolve2 => {
        // 初始加载绘制外边界
        return bt_indexedDB.getAll('contourLines').then((resolve, reject) => {
          let boxList = resolve;
          let lineBox = "";
          for (let i = 0; i < boxList.length; i++) {
            let posList = [];
            posList.push(boxList[i].min_z);
            posList.push(boxList[i].max_z);
            posList.push(boxList[i].location.length / 2);
            posList = posList.concat(boxList[i].location);
            lineBox += that.drawBox(posList, boxList[i].id);
          }
          if (lineBox != "") {
            bt_Util.executeScript(lineBox);
            bt_Util.executeScript("Render\\ForceRedraw;");
          }
        });
      });
    },
    // 清除本地数据
    clearLocalData: function () {
      var that = this;
      bt_indexedDB.getAll('contourLines').then((resolve, reject) => {
        let boxList = resolve;
        // 清除边界绘制线段
        for (let i = 0; i < boxList.length; i++) {
          bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj box" + boxList[i].id + " 8;");
        }
        //清除面积信息
        $(".area").html(0);
        $(".volume").html(0);
        // 清空数据
        bt_indexedDB.clearData('contourLines');
        localDB.set("autoCollectSign", true);
        bt_Util.executeScript("Render\\ForceRedraw;");
      });
    },
    // 导出边界数据
    exportBorderData: function () {
      var that = this;
      bt_indexedDB.getAll('contourLines').then((resolve, reject) => {
        let list = resolve;
        let exportStr = "";
        for (let i = 0; i < list.length; i++) {
          exportStr += '{"min_z":' + list[i].min_z + ',"max_z":' + list[i].max_z + ',"meta":' + JSON.stringify(list[i].info) + ',"contour":[';
          let locationList = list[i].location;
          let contourList = [];
          for (let j = 0; j < locationList.length; j = j + 2) {
              contourList.push('{"x":' + locationList[j] + ',"y":' + locationList[j + 1] + '}');
          }
          exportStr += contourList + "]}\r\n";
        }
        that.download("export" + new Date().getTime(), exportStr);
      });
    },
    /**
     * 生成txt文件
     *
     * @param filename
     * @param text
     */
    download: function (filename, text) {
      let blob = new Blob([text], {type: "text/plain;charset=utf-8"});
      saveAs(blob, filename + ".txt");
    },
    // 打开边界提取功能
    openBorderCollect: function () {
      localDB.set("autoCollectSign", false);
      bt_Util.executeScript("Render\\RenderDataContex\\SetOsgAttribBox 0 0 blue 1 0 0;");
      bt_Util.executeScript("Plugin\\ActivePlugin OsgFeatureAbstract;");
      bt_event.addEventListener("Plugin\\OsgFeatureAbstract\\OnBldgPick", this.onBldgPick.bind(this));
      bt_Util.executeScript("Render\\ForceRedraw;");
    },
    // 关闭边界提取功能
    closeBorderCollect: function () {
      localDB.set("autoCollectSign", true);
      bt_Util.executeScript("Plugin\\DeactivePlugin OsgFeatureAbstract;");
      bt_event.removeEventListener("Plugin\\OsgFeatureAbstract\\OnBldgPick", this.onBldgPick.bind(this));
      bt_Util.executeScript("Render\\ForceRedraw;");
  },
    // 边界提取
    onBldgPick: function (ep) {
      var that = this;
      let boxId = 0;
      /**
       * 查看当前点击到了哪个建筑，若未点击到则添加新数据，若点击到则替换数据
       */
      bt_indexedDB.getAll('contourLines').then((resolve, reject) => {
        let list = resolve;
        let testPoint = ep[0].split(" ");
        let changeSign = false;

        let pointList2 = ep[1].split(" ");
        testPoint = testPoint.map(Number);
        for (let i = 0; i < list.length; i++) {
          let location = list[i].location;
          let pointList = [];
          for (let j = 1; j < location.length; j = j + 2) {
            let tempList = [location[j - 1], location[j]];
            pointList.push(tempList.map(Number));
          }
          if (this.insidePolygon(testPoint, pointList)) {
            changeSign = true;
            bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj box" + list[i].id + " 8;");
            bt_Util.executeScript("Render\\ForceRedraw;");
            boxId = list[i].id;
            return bt_indexedDB.updateData('contourLines', {
              'id': list[i].id,
              'name': list[i].id,
              location: pointList2.slice(3),
              min_z: pointList2[0],
              max_z: pointList2[1],
              info: {name: list[i].id, site: '武汉市洪山区'}
            });
          }
        }
        if (!changeSign) {
          boxId = list.length + 1;
          return bt_indexedDB.saveData('contourLines', {
            'id': list.length + 1,
            'name': list.length + 1,
            location: pointList2.slice(3),
            min_z: pointList2[0],
            max_z: pointList2[1],
            info: {name: list.length + 1, site: '武汉市洪山区'}
          });
        }
      }).then(resolve => {
        /**
         * 保存数据
         */
        // 绘制轮廓线
        let posList = ep[1];
        posList = posList.split(" ");
        let lineBox = that.drawBox(posList, boxId);
        bt_Util.executeScript(lineBox);
        bt_Util.executeScript("Render\\ForceRedraw;");
      });
    },
    /**
     * 判断一个点是否在多边形内部
     *
     * @param points
     *            多边形坐标集合
     * @param testPoint
     *            测试点坐标 返回true为真，false为假
     */
    insidePolygon: function (testPoint, points) {
      let x = testPoint[0],
          y = testPoint[1];
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        let xi = points[i][0],
            yi = points[i][1];
        let xj = points[j][0],
            yj = points[j][1];

        let intersect = ((yi > y) !== (yj > y)) &&
          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    },
    /**
     * 绘制轮廓线
     */
    drawBox: function (posList, boxId) {
      //计算体积、面积、容积率
      let pointList = posList.slice(3);
      let xList = [];
      let yList = [];

      let height = parseFloat(posList[1]) - parseFloat(posList[0]);
      let area = this.square(pointList);
      let prevVolume = $(".volume").html();
      if(prevVolume.length> 0){
        prevVolume = parseFloat(prevVolume) + area * height;
      }else{
        prevVolume =area * height;
      }

      prevVolume = prevVolume.toFixed(2);
      $(".volume").html(prevVolume);

      let prevArea = $(".area").html();
      if(prevArea.length> 0 && prevArea !== "0"){
        prevArea = parseFloat(prevArea) + area * height /3;
      }else{
        prevArea =area * height/3;
      }

      prevArea = prevArea.toFixed(2);

      $(".area").html(prevArea);
      let topStr = "";
      let botStr = "";
      let vertStr = "";
      let levelDiff = posList[1] - posList[0];
      let pointCount = pointList.length * 4 - 2;
      let lineBox = "Render\\RenderDataContex\\DynamicFrame\\AddRenderObj box" + boxId + " 4 1 " + pointList[0] + " " + pointList[1] + " " + posList[0] + " 8 " + pointCount + " " + pointCount + " ";

      for (let i = 0; i < pointList.length - 2; i = i + 2) {
          // 纵向轮廓线
        vertStr += (pointList[i] - pointList[0]) + " " + (pointList[i + 1] - pointList[1]) + " 0 255 255 0 255 " + (pointList[i] - pointList[0]) + " " + (pointList[i + 1] - pointList[1]) + " " + levelDiff + " 255 255 0 255 ";
        vertStr += (pointList[i + 2] - pointList[0]) + " " + (pointList[i + 3] - pointList[1]) + " 0 255 255 0 255 " + (pointList[i + 2] - pointList[0]) + " " + (pointList[i + 3] - pointList[1]) + " " + levelDiff + " 255 255 0 255 ";
        // 顶部轮廓线
        topStr += (pointList[i] - pointList[0]) + " " + (pointList[i + 1] - pointList[1]) + " " + levelDiff + " 255 255 0 255 " + (pointList[i + 2] - pointList[0]) + " " + (pointList[i + 3] - pointList[1]) + " " + levelDiff + " 255 255 0 255 ";
        // 底部轮廓线
        botStr += (pointList[i] - pointList[0]) + " " + (pointList[i + 1] - pointList[1]) + " 0 255 255 0 255 " + (pointList[i + 2] - pointList[0]) + " " + (pointList[i + 3] - pointList[1]) + " 0 255 255 0 255 ";
      }

      topStr += (pointList[pointList.length - 2] - pointList[0]) + " " + (pointList[pointList.length - 1] - pointList[1]) + " " + levelDiff + " 255 255 0 255 0 0 " + levelDiff + " 255 255 0 255 ";
      botStr += (pointList[pointList.length - 2] - pointList[0]) + " " + (pointList[pointList.length - 1] - pointList[1]) + " 0 255 255 0 255 0 0 0 255 255 0 255 ";
      vertStr += (pointList[pointList.length - 2] - pointList[0]) + " " + (pointList[pointList.length - 1] - pointList[1]) + " 0 255 255 0 255 " + (pointList[pointList.length - 2] - pointList[0]) + " " + (pointList[pointList.length - 1] - pointList[1]) + " " + levelDiff + " 255 255 0 255 ";
      lineBox += topStr + botStr + vertStr;

      for (let i = 0; i < pointCount; i++) {
        lineBox += i + " ";
      }
      lineBox += "1;";
      return lineBox;
    },
    square:function(pointList) {
      let x3 = 0;
      let y3 = 0;
      for (let i = 0; i < pointList.length; i=i+2) {
        x3 += 2 * pointList[i]/pointList.length;
        y3 += 2 * pointList[i+1]/pointList.length;
      }

      let area = 0;

      for (let i = 0; i < pointList.length; i=i+4) {
        let x1 = parseFloat(pointList[i]);
        let y1 = parseFloat(pointList[i+1]);
        let x2 = parseFloat(pointList[i+2]);
        let y2 = parseFloat(pointList[i+3]);

        if(x1 != x2 || y1 != y2){
          let side1 = Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2));
          let side2 = Math.sqrt(Math.pow(x1-x3,2) + Math.pow(y1-y3,2));
          let side3 = Math.sqrt(Math.pow(x2-x3,2) + Math.pow(y2-y3,2));
          let p = (side1+side2+side3)/2;

          let tempArea = Math.sqrt(p*(p-side1)*(p-side2)*(p-side3));
          area += isNaN(tempArea) ? 0:tempArea;
          console.log(area);
        }
      }
      return area;
    }
  });
  module.exports = AutoCollectView;
});