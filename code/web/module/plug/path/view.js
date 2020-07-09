define(function(require, exports, module){
  require('./path.css');
  let eventBus = require('../../utils/event_bus');
  const msgbox=require('../../utils/MessageBox/action');
  const msg=require('../../utils/Message/action');
  $('body').append('<div id="pathContainer"></div>');
  let events={};
  let PathView=Backbone.View.extend({
    el:'#pathContainer',    
    data: {
      pathRoamingRate: 0.03,
      mileage: 1000,
      pathRoamingLength: 0,
      pathRoamingLHeight: 20,
      pathRoamingLViewHeight: -15,
      viewToCameraDistance: 20,
      localDataFile: null,      
    },
    events:{
      'click button[role=control]':'startFunc',
      'click button[role=speedUp]':'speedUpFunc',
      'click button[role=slowDown]':'slowDownFunc',
      'click button[role=startPoint]':'handleEdit',
      'change #PathRoamingImportPointFile':'handleChange'
    },
    initPlug(){      
      eventBus.trigger('addPlug',{
        name: 'plug_pathRoaming',
        title: '路径漫游',
        value: this,
        icon: '',
        isIndependent: true, // 是否是单独的功能
        children: [
          {
            title: '编辑路径点',
            type: '1',
            icon: ''
          },
          {
            title: '开始漫游',
            type: '2',
            icon: ''
          },
          {
            title: '导入路径数据',
            type: '3',
            icon: '',
            isOnce:true //一次性点击功能
          },
          {
            title: '导出路径数据',
            type: '4',
            icon: '',
            isOnce:true //一次性点击功能
          }
        ]
      });
    },
    activate(type){
      switch (type) {
        case '1':
          this.deactivateStartPathRoaming();
          this.activateCollectPathPoint();
          break;
        case '2':
          this.deactivateCollectPathPoint();
          this.activeStartPathRoaming();
          break;
        case '3':
          this.importPathRoamingData();
          break;
        case '4':
          this.exportPathRoamingData();
          break;
        default:
          break;
      }
    },
    deactivate(){
      this.deactivateStartPathRoaming();
      this.deactivateCollectPathPoint();
      
    },
    activateCollectPathPoint(){
      events['collectPathPointMouseDown']=this.collectPathPointMouseDown.bind(this);
      events['collectPathPointMouseUp']=this.collectPathPointMouseUp.bind(this);
      bt_event.addEventListener("GUIEvent\\KM\\OnMouseButtonDown", events['collectPathPointMouseDown']);
      bt_event.addEventListener("GUIEvent\\KM\\OnMouseButtonUp", events['collectPathPointMouseUp']);
      bt_Util.executeScript("Render\\ForceRedraw;");

      $(document).off("keydown").on('keydown',(e)=>{        
        let keyCode = e.keyCode || e.which || e.charCode;
        let ctrlKey = e.ctrlKey || e.metaKey;
        if (ctrlKey && keyCode === 90) {
          //Ctrl + Z
          let pointList = this.data.pointList;
          if (pointList && pointList.length > 0) {
            this.clearPointAndLine(pointList);
            pointList.splice(pointList.length - 1, 1);
            this.drawPointAndLine(pointList);
          }
          bt_Util.executeScript("Render\\ForceRedraw;");
          return false;
        } else if (ctrlKey && keyCode === 68) {
          //Ctrl + D  删除所有边界线和标注点
          let pointList = this.data.pointList;
          this.clearPointAndLine(pointList);
          this.data.pointList = [];
          bt_Util.executeScript("Render\\ForceRedraw;");
          return false;
        }
      });

      //弹出组合键提示框
      let html=require('./tip.html');
      let tpl=_.template(html);  
      this.$el.html(tpl);            

      //若pointList不为空，则绘制路径
      let pointList = this.data.pointList;
      if (pointList && pointList.length > 0) this.drawPointAndLine(pointList);

    },
    activeStartPathRoaming(){
      if (!this.data.pointList) {
        msg.error('暂无路径点可供漫游，请采集路径点或导入路径数据后再尝试开始漫游。');
        return false;
      }      
      let html=require('./control.html');
      let tpl=_.template(html);      

      let pointList = this.data.pointList;
      let distance = 0;
      let mileage = this.data.mileage;
      let pathRoamingPointList = [];
      this.data.pathRoamingLength = 0;
      pathRoamingPointList.push({index: 1, site: "起点", point: pointList[0], distance: 0});
      for (let i = 1; i < pointList.length; i++) {
          distance = distance + Math.sqrt(Math.pow(pointList[i].x - pointList[i - 1].x, 2) + Math.pow(pointList[i].y - pointList[i - 1].y, 2) + Math.pow(pointList[i].z - pointList[i - 1].z, 2));
      }
      this.data.lineLength = distance;
      for (let i = 0; i < distance / mileage; i++) {
        if ((i + 1) * mileage < distance) {
          let point = this.getSiteByDistance((i + 1) * mileage, pointList);
          pathRoamingPointList.push({
              index: pathRoamingPointList.length + 1,
              site: (i + 1) * mileage + "米",
              point: point,
              distance: (i + 1) * mileage
          });
        }
      }
      let finalDistance = distance > 50 ? distance - 50 : distance - 25;
      pathRoamingPointList.push({
        index: pathRoamingPointList.length + 1,
        site: "终点",
        point: pointList[pointList.length - 1],
        distance: finalDistance
      });

      this.data.pathRoamingPointList = pathRoamingPointList;

      //添加标注点
      for (let i = 0; i < pathRoamingPointList.length; i++) {
        bt_Plug_Annotation.setAnnotation("pathRoamingStartSign" + i, pathRoamingPointList[i].point.x, pathRoamingPointList[i].point.y, pathRoamingPointList[i].point.z, -8, -16, "<div style='background:url(images/DefaultIcon.png); " +
            "background-position:center left; background-repeat: no-repeat; height:16px; line-height:10px;'>" +
            "<span style='margin-left:16px; font-size:9px; white-space: nowrap;'>" +
            pathRoamingPointList[i].site + "</span></div>", false);
      }
      this.$el.html(tpl({controlText:'开始',tableData:pathRoamingPointList}));            
    },
    handleEdit(evt){      
      const distance=$(evt.currentTarget).data('distance');      
      let pointList = this.data.pointList;
      let cameraPoint = this.getSiteByDistance(parseFloat(distance), pointList);
      let viewPoint = this.getSiteByDistance(parseFloat(distance) + 20, pointList);
      let height = this.data.pathRoamingLHeight;
      let viewHeight = this.data.pathRoamingLViewHeight;
      bt_Util.executeScript("Render\\Camera\\SetParam " + cameraPoint.x + " " + cameraPoint.y + " " + (cameraPoint.z + parseFloat(height)) + " "
          + viewPoint.x + " " + viewPoint.y + " " + (viewPoint.z + parseFloat(height) + parseFloat(viewHeight)) + " 0 0 1 1;");
      this.data.pathRoamingLength = distance;
    },
    startFunc(){      
      if (!this.data.startSign) {
        this.data.startSign = true;          
        this.$('button[role=control]').text("暂停");
        this.data.preDate = new Date().getTime();
        events['beforeRender']=this.beforeRender.bind(this);
        events['pathRoaming_mouseWheel']=this.pathRoaming_mouseWheel.bind(this);
        events['changeAngle_mouseDown']=this.changeAngle_mouseDown.bind(this);
        events['changeAngle_mouseMove']=this.changeAngle_mouseMove.bind(this);
        events['changeAngle_mouseUp']=this.changeAngle_mouseUp.bind(this);
        events['disable_click']=this.disable_click.bind(this);
        events['OnMouseDbClick']=this.disable_DBClick.bind(this);

        bt_event.addEventListener("Render\\BeforeRender", events['beforeRender']);
        bt_Util.executeScript("Render\\ForceRedraw;");

        bt_event.addEventListener("GUIEvent\\KM\\OnMouseWheel", events['pathRoaming_mouseWheel'] );
        bt_event.addEventListener("GUIEvent\\KM\\OnMouseButtonDown", events['changeAngle_mouseDown']);
        bt_event.addEventListener("GUIEvent\\KM\\OnMouseMove", events['changeAngle_mouseMove']);
        bt_event.addEventListener("GUIEvent\\KM\\OnMouseButtonUp", events['changeAngle_mouseUp']);
        bt_event.addEventListener("GUIEvent\\KM\\OnMouseClick", events['disable_click']);
        bt_event.addEventListener("GUIEvent\\KM\\OnMouseDbClick", events['OnMouseDbClick']);
      } else {        
        this.data.startSign = false;          
        this.$('button[role=control]').text("开始");
        bt_event.removeEventListener("Render\\BeforeRender", events['beforeRender']);

        bt_event.removeEventListener("GUIEvent\\KM\\OnMouseWheel", events['pathRoaming_mouseWheel']);
        bt_event.removeEventListener("GUIEvent\\KM\\OnMouseButtonDown", events['changeAngle_mouseDown']);
        bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", events['changeAngle_mouseMove']);
        bt_event.removeEventListener("GUIEvent\\KM\\OnMouseButtonUp", events['changeAngle_mouseUp']);
        bt_event.removeEventListener("GUIEvent\\KM\\OnMouseClick", events['disable_click']);
        bt_event.removeEventListener("GUIEvent\\KM\\OnMouseDbClick", events['OnMouseDbClick']);
      }
    },
    speedUpFunc(){
      console.log('加速');
      this.data.pathRoamingRate += 0.01;
    },
    slowDownFunc(){
      console.log('减速');
      if (this.data.pathRoamingRate > 0.01) {
          this.data.pathRoamingRate -= 0.01;
      }
    },
    handleChange(evt){      
      let file = evt.target.files[0];
      if (!file) return;      
      if (file.name.split(".").pop()!=='txt') {
        msg.error('导入文件格式错误，需为txt格式文件！');
      } else {
        let fileReader = new FileReader();
        fileReader.readAsText(file);
        fileReader.onload = (e) =>{
          let text = e.target.result;
          let list = text.split('\r\n');
          if (!list[list.length - 1]) {
            list.length = list.length - 1;
          }
          let pointList = [];
          for (let i = 0; i < list.length; i++) {
            pointList.push(JSON.parse(list[i]));
          }
          $("#PathRoamingImportPointFile").val("");
          this.data.pointList = pointList;
          this.deactivateCollectPathPoint();
          this.deactivateStartPathRoaming();
          msg.success('导入路径点文件成功。');
        }
      }
    },
    clearPointAndLine(pointList){
      if (!pointList) return;
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj PathRoamingSignLine 8;");
      for (let i = 0; i < pointList.length; i++) {
        bt_Plug_Annotation.removeAnnotation("PathRoamingSign" + i);
      }
    },
    collectPathPointMouseDown(ep){
      if (ep[0] === 0) {
        this.data.mouseDownPoint = {x: ep[1], y: ep[2]};
      }
    },
    collectPathPointMouseUp(ep){
      if (ep[0] === 0) {
          let mouseDownPoint = this.data.mouseDownPoint;
          if (Math.abs(ep[1] - mouseDownPoint.x) < 2 && Math.abs(ep[2] - mouseDownPoint.y) < 2) {
              let point = bt_Util.executeScript("Render\\CameraControl\\QueryPointPosInScreen " + ep[1] + " " + ep[2] + ";");
              point = point[0].split(" ");
              if (point[0] == 1) {
                  let pointList = this.data.pointList;
                  //若pointList未定义则表明为第一个点，则添加鼠标移动的监听事件,并清除之前的数据
                  if (!pointList || pointList.length < 1) {
                      pointList = [];
                      this.clearPointAndLine(this.data.pointList);
                  }
                  pointList.push({x: point[1], y: point[2], z: point[3]});
                  this.data.pointList = pointList;
                  this.drawPointAndLine(pointList);
              }
          }
      }
    },
    drawPointAndLine(pointList){
      let lineStr = "Render\\RenderDataContex\\DynamicFrame\\AddRenderObj PathRoamingSignLine 4 1 " + pointList[0].x + " " + pointList[0].y + " " + pointList[0].z
          + " 8 " + pointList.length + " " + (pointList.length - 1) * 2 + " ";
      let indexStr = "";
      for (let i = 0; i < pointList.length; i++) {
          //设置坐标点
          bt_Plug_Annotation.setAnnotation("PathRoamingSign" + i, pointList[i].x, pointList[i].y, pointList[i].z, -8, -16, "<div style='background:url(images/DefaultIcon.png); " +
              "background-position:center left; background-repeat: no-repeat; height:16px; line-height:10px;'>" +
              "<span style='margin-left:16px; font-size:9px; white-space: nowrap;'>路径点" +
              (i + 1) + "</span></div>", false);
          //设置线顶点、索引点
          lineStr += (pointList[i].x - pointList[0].x) + " " + (pointList[i].y - pointList[0].y) + " " + (pointList[i].z - pointList[0].z) + " 255 255 0 255 ";
          if (i < pointList.length - 1) {
              indexStr += i + " " + (i + 1) + " ";
          }
      }
      lineStr += indexStr + "0;";
      bt_Util.executeScript(lineStr);
      bt_Util.executeScript("Render\\ForceRedraw;");
    },
    deactivateCollectPathPoint(){
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseButtonDown", events['collectPathPointMouseDown']);
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseButtonUp", events['collectPathPointMouseUp']);
      this.clearPointAndLine(this.data.pointList);
      bt_Util.executeScript("Render\\ForceRedraw;");
      $(document).off("keydown");
      this.$('#pathTipDiv').length&&this.$('#pathTipDiv').remove();      
    },
    deactivateStartPathRoaming(){
      bt_event.removeEventListener("Render\\BeforeRender", events['beforeRender']);
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseWheel", events['pathRoaming_mouseWheel']);
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseButtonDown", events['changeAngle_mouseDown']);
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", events['changeAngle_mouseMove']);
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseButtonUp", events['changeAngle_mouseUp']);
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseClick", events['disable_click']);
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseDbClick", events['disable_DBClick']);      

      let pathRoamingPointList = this.data.pathRoamingPointList;
      if (pathRoamingPointList) {
        for (let i = 0; i < pathRoamingPointList.length; i++) {
          bt_Plug_Annotation.removeAnnotation("pathRoamingStartSign" + i);
        }
      }
      this.data.rotationAngle = 0;
      this.$('#pathRoamingDiv').length&&this.$('#pathRoamingDiv').remove();
    },
    getSiteByDistance(distance, pointList){
        let perLength = 0;
        for (let j = 1; j < pointList.length; j++) {
            let newPerLength = perLength + Math.sqrt(Math.pow(pointList[j].x - pointList[j - 1].x, 2) + Math.pow(pointList[j].y - pointList[j - 1].y, 2) + Math.pow(pointList[j].z - pointList[j - 1].z, 2));
            if (newPerLength > distance) {
                let percent = (distance - perLength) / (newPerLength - perLength);
                let x = (parseFloat(pointList[j].x) - parseFloat(pointList[j - 1].x)) * percent + parseFloat(pointList[j - 1].x);
                let y = (parseFloat(pointList[j].y) - parseFloat(pointList[j - 1].y)) * percent + parseFloat(pointList[j - 1].y);
                let z = (parseFloat(pointList[j].z) - parseFloat(pointList[j - 1].z)) * percent + parseFloat(pointList[j - 1].z);
                return {x: x, y: y, z: z};
            } else {
                perLength = newPerLength;
            }
        }
    },
    beforeRender(){
      let pointList = this.data.pointList;
      let pathRoamingLength = this.data.pathRoamingLength;
      if (!pathRoamingLength) pathRoamingLength = 0;
      let preDate = this.data.preDate;
      if (!preDate) preDate = new Date().getTime() - 33;
      let cameraPoint = this.getSiteByDistance(pathRoamingLength, pointList);
      let viewPoint = this.getSiteByDistance(pathRoamingLength + this.data.viewToCameraDistance, pointList);
      let height = this.data.pathRoamingLHeight;
      let viewHeight = this.data.pathRoamingLViewHeight;
      let rate = this.data.pathRoamingRate;
      let distance = this.data.lineLength;
      let rotationAngle = this.data.rotationAngle;
      if (!rotationAngle) rotationAngle = 0;

      if (pathRoamingLength >= distance + 50) {
          // this.data.startPathRoamingVue.controlText = "开始";
          this.$('button[role=control]').text('开始');
          this.data.startSign = false;
          bt_event.removeEventListener("GUIEvent\\KM\\OnMouseWheel", events['pathRoaming_mouseWheel']);
          bt_event.removeEventListener("GUIEvent\\KM\\OnMouseButtonDown", events['changeAngle_mouseDown']);
          bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", events['changeAngle_mouseMove']);
          bt_event.removeEventListener("GUIEvent\\KM\\OnMouseButtonUp", events['changeAngle_mouseUp']);
          bt_event.removeEventListener("GUIEvent\\KM\\OnMouseClick", events['disable_click']);
          bt_event.removeEventListener("GUIEvent\\KM\\OnMouseDbClick", events['disable_DBClick']);
          this.data.pathRoamingLength = 0;
          bt_event.removeEventListener("Render\\BeforeRender", events['beforeRender']);
          bt_Util.executeScript("Render\\ForceRedraw;");
          return true;
      }

      if (cameraPoint && viewPoint) {

          let rotationX = (viewPoint.x - cameraPoint.x) * Math.cos(rotationAngle) - (viewPoint.y - cameraPoint.y) * Math.sin(rotationAngle) + cameraPoint.x;
          let rotationY = (viewPoint.y - cameraPoint.y) * Math.cos(rotationAngle) - (viewPoint.x - cameraPoint.x) * Math.sin(rotationAngle) + cameraPoint.y;
          viewPoint = {x: rotationX, y: rotationY, z: viewPoint.z};

          viewPoint.z = (viewPoint.z + parseFloat(height) + parseFloat(viewHeight));

          viewPoint.x = (viewPoint.x - cameraPoint.x) * 5 + cameraPoint.x;
          viewPoint.y = (viewPoint.y - cameraPoint.y) * 5 + cameraPoint.y;
          viewPoint.z = ((viewPoint.z - cameraPoint.z) * 5 + cameraPoint.z) * 0.5;

          //调整视角
          bt_Util.executeScript("Render\\Camera\\SetParam " + cameraPoint.x + " " + cameraPoint.y + " " + (cameraPoint.z + parseFloat(height)) + " "
              + viewPoint.x + " " + viewPoint.y + " " + viewPoint.z + " 0 0 1 1;");
      }

      let currentDate = new Date().getTime();
      pathRoamingLength += rate * (currentDate - preDate);
      this.data.perIncrease = rate * (currentDate - preDate);
      this.data.preDate = currentDate;
      this.data.pathRoamingLength = pathRoamingLength;      
      this.data.rotationAngle = rotationAngle;
      bt_Util.executeScript("Render\\ForceRedraw;");
    },
    pathRoaming_mouseWheel(e){
      let height = this.data.pathRoamingLHeight;
      height = height - e[0] * 1;
      this.data.pathRoamingLHeight = height;
      return true;
    },
    disable_click(){
        return true;
    },
    disable_DBClick(){
        return true;
    },
    changeAngle_mouseDown(ep){
        if (ep[0] !== 2) return false;
        this.data.changeAngle_mouseDown = ep[1] + " " + ep[2];
        return true;
    },
    changeAngle_mouseMove(e){
        let mouseDownSite = this.data.changeAngle_mouseDown;
        if (!mouseDownSite) return true;
        mouseDownSite = mouseDownSite.split(" ");
        let viewHeight = this.data.pathRoamingLViewHeight;
        this.data.pathRoamingLViewHeight = (viewHeight - (parseFloat(e[1]) - parseFloat(mouseDownSite[1])).toFixed(4) * 0.1) * 0.5;

        let changeAngle_mouseMoveX = this.data.changeAngle_mouseMoveX;
        if (!changeAngle_mouseMoveX) {
            changeAngle_mouseMoveX = e[0];
            this.data.changeAngle_mouseMoveX = changeAngle_mouseMoveX;
        } else {
            let rotationAngle = this.data.rotationAngle;
            if (!rotationAngle) rotationAngle = 0;
            let perX = e[0] - changeAngle_mouseMoveX;
            let angle = Math.asin(Math.abs(perX) / parseFloat(this.data.viewToCameraDistance)) * 0.15;
            if (perX > 0) {
                rotationAngle -= angle;
            } else {
                rotationAngle += angle;
            }
            this.data.rotationAngle = rotationAngle;
            this.data.changeAngle_mouseMoveX = e[0];
        }

        return true;
    },
    changeAngle_mouseUp(){
      this.data.changeAngle_mouseDown = null;
      return true;
    },
    importPathRoamingData(){
        if (this.data.pointList) {            
          msgbox.confirm('此操作将覆盖当前已有的路径点数据, 是否继续?', '提示',).then(()=>{
            console.log(this);
            const html=$('<div><input type="file" id="PathRoamingImportPointFile" style="display: none;"></div>');              
            this.$el.html(html);
            $("#PathRoamingImportPointFile").click();
          }).catch(()=>{
            return
          })
        } else {
          const html=$('<div><input type="file" id="PathRoamingImportPointFile" style="display: none;"></div>');              
          this.$el.html(html);
          $("#PathRoamingImportPointFile").click();
        }
    },
    exportPathRoamingData(){
        let pointList = this.data.pointList;
        let content = "";
        if (!pointList || pointList.length < 1) {
            msg.error('暂无路径点可供导出，请设置路径点后再次尝试导出。');
            return false;
        }
        for (let i = 0; i < pointList.length; i++) {
          content += JSON.stringify(pointList[i]) + "\r\n";
        }
        let blob = new Blob([content], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "路径点" + new Date().getTime() + ".txt");
        msg.success('导出路径点文件成功。');
    },    
  });  
  module.exports=PathView;
})