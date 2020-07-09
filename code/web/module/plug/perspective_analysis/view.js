
define(function(require, exports, module){
  let bt_plug_perspectiveAnalysis = {}; 								//创建插件对象
  bt_plug_perspectiveAnalysis.js_name = "bt_plug_perspectiveAnalysis"; 	//插件文件名
  bt_plug_perspectiveAnalysis.plug_name = "透视分析"; 						//插件名
  bt_plug_perspectiveAnalysis.plug_icon = "ali-icon-icon_yulan";			//插件图标
  bt_plug_perspectiveAnalysis.plug_isOnMobile = true;						//插件可在移动设备上使用

  bt_plug_perspectiveAnalysis.time = 0; 									//点击次数（0 or 1）
  bt_plug_perspectiveAnalysis.count = 0;									//计数器
  bt_plug_perspectiveAnalysis.setTimeOut = null;							//计时器
  bt_plug_perspectiveAnalysis.pointA_X = 0;
  bt_plug_perspectiveAnalysis.pointA_Y = 0;
  bt_plug_perspectiveAnalysis.pointA_Z = 0; //线段顶点A坐标
  bt_plug_perspectiveAnalysis.pointB_X = 0;
  bt_plug_perspectiveAnalysis.pointB_Y = 0;
  bt_plug_perspectiveAnalysis.pointB_Z = 0; //线段顶点B坐标
  bt_plug_perspectiveAnalysis.pointC_X = 0;
  bt_plug_perspectiveAnalysis.pointC_Y = 0;
  bt_plug_perspectiveAnalysis.pointC_Z = 0; //线段交点C坐标
  bt_plug_perspectiveAnalysis.pointPos = []; 								//顶点坐标
  bt_plug_perspectiveAnalysis.pointPosSave = [];							//顶点坐标储存器（防止双击与单击冲突）
  bt_plug_perspectiveAnalysis.pointPosC = []; 							//交点坐标
  bt_plug_perspectiveAnalysis.annotations = []; 							//标注坐标
  bt_plug_perspectiveAnalysis.click_btID = 0; 							//鼠标单击时的按键ID
  bt_plug_perspectiveAnalysis.click_x = 0; 								//鼠标单击时的x坐标
  bt_plug_perspectiveAnalysis.click_y = 0; 								//鼠标单击时的y坐标
  bt_plug_perspectiveAnalysis.down_btID = 0; 								//鼠标按键按下时的按键ID
  bt_plug_perspectiveAnalysis.down_x = 0; 								//鼠标按键按下时的x坐标
  bt_plug_perspectiveAnalysis.down_y = 0; 								//鼠标按键按下时的y坐标
  bt_plug_perspectiveAnalysis.up_btID = 0; 								//鼠标按键弹起时的按键ID
  bt_plug_perspectiveAnalysis.up_x = 0; 									//鼠标按键弹起时的x坐标
  bt_plug_perspectiveAnalysis.up_y = 0; 									//鼠标按键弹起时的y坐标

  //将屏幕坐标转世界坐标，输出世界坐标
  bt_plug_perspectiveAnalysis.posArr = function posArr() {
    let x = bt_plug_perspectiveAnalysis.up_x;
    let y = bt_plug_perspectiveAnalysis.up_y;
    let QueryPoint = bt_Util.executeScript("Render\\CameraControl\\QueryPointPosInScreen " + x + " " + y + ";");
    return QueryPoint[0].split(" ");
  };

  //储存并输出线段交点
  bt_plug_perspectiveAnalysis.posC_Arr = function posC_Arr(){
    let QueryPotinC = bt_Util.executeScript("Render\\CameraControl\\LineIntersect " + bt_plug_perspectiveAnalysis.pointA_X + " " + bt_plug_perspectiveAnalysis.pointA_Y + " " + bt_plug_perspectiveAnalysis.pointA_Z + " " + bt_plug_perspectiveAnalysis.pointB_X + " " + bt_plug_perspectiveAnalysis.pointB_Y + " " + bt_plug_perspectiveAnalysis.pointB_Z+ ";");
    return QueryPotinC[0].split(" ");
  }

  //储存并设置顶点A
  bt_plug_perspectiveAnalysis.setPointA = function setPointA() {
    //bt_plug_perspectiveAnalysis.pointPos[]内的前3个元素分别为线段起点的x、y、z轴坐标
    bt_plug_perspectiveAnalysis.pointPos = [];
    bt_plug_perspectiveAnalysis.pointPos[0] = bt_plug_perspectiveAnalysis.posArr()[1];
    bt_plug_perspectiveAnalysis.pointPos[1] = bt_plug_perspectiveAnalysis.posArr()[2];
    bt_plug_perspectiveAnalysis.pointPos[2] = bt_plug_perspectiveAnalysis.posArr()[3];
    bt_plug_perspectiveAnalysis.pointA_X = bt_plug_perspectiveAnalysis.pointPos[0];
    bt_plug_perspectiveAnalysis.pointA_Y = bt_plug_perspectiveAnalysis.pointPos[1];
    bt_plug_perspectiveAnalysis.pointA_Z = bt_plug_perspectiveAnalysis.pointPos[2];
  }

  //储存并设置顶点B
  bt_plug_perspectiveAnalysis.setPointB = function setPointB() {
    //bt_plug_perspectiveAnalysis.pointPos[]内的后3个元素分别为线段终点的x、y、z轴坐标
    bt_plug_perspectiveAnalysis.pointPos[3] = bt_plug_perspectiveAnalysis.posArr()[1];
    bt_plug_perspectiveAnalysis.pointPos[4] = bt_plug_perspectiveAnalysis.posArr()[2];
    bt_plug_perspectiveAnalysis.pointPos[5] = bt_plug_perspectiveAnalysis.posArr()[3];
    bt_plug_perspectiveAnalysis.pointB_X = bt_plug_perspectiveAnalysis.pointPos[3];
    bt_plug_perspectiveAnalysis.pointB_Y = bt_plug_perspectiveAnalysis.pointPos[4];
    bt_plug_perspectiveAnalysis.pointB_Z = bt_plug_perspectiveAnalysis.pointPos[5];
  }

  //设置标注（从顶点A开始）
  bt_plug_perspectiveAnalysis.setAnnotationFromPointA = function setAnnotationFromPointA() {
    //记录标注坐标
    bt_plug_perspectiveAnalysis.annotations = [];
    bt_plug_perspectiveAnalysis.annotations[0] = bt_plug_perspectiveAnalysis.posArr()[1];
    bt_plug_perspectiveAnalysis.annotations[1] = bt_plug_perspectiveAnalysis.posArr()[2];
    bt_plug_perspectiveAnalysis.annotations[2] = bt_plug_perspectiveAnalysis.posArr()[3];
    //设置标注
    bt_Plug_Annotation.setAnnotation("p" , bt_plug_perspectiveAnalysis.posArr()[1], bt_plug_perspectiveAnalysis.posArr()[2], bt_plug_perspectiveAnalysis.posArr()[3], -8, -16, "<div style='background:url(images/DefaultIcon.png); background-position:center left; background-repeat: no-repeat; height:16px;line-height:10px;'><span style='margin-left:16px; font-size:9px; white-space: nowrap;'></span></div>", false);
    bt_Util.executeScript("Render\\ForceRedraw;");
  };

  //渲染线段和标注（从顶点A开始）
  bt_plug_perspectiveAnalysis.addLineFromPointA = function addLineFromPointA() {
    if(!bt_Util.mobileDevice){
      let event = window.event;
      bt_plug_perspectiveAnalysis.up_x = event.clientX;
      bt_plug_perspectiveAnalysis.up_y = event.clientY;
    }
    bt_plug_perspectiveAnalysis.pointB_X = bt_plug_perspectiveAnalysis.posArr()[1];
    bt_plug_perspectiveAnalysis.pointB_Y = bt_plug_perspectiveAnalysis.posArr()[2];
    bt_plug_perspectiveAnalysis.pointB_Z = bt_plug_perspectiveAnalysis.posArr()[3];
    if(bt_plug_perspectiveAnalysis.posArr()[0] == 1) { //限定事件发生范围在场景内
      bt_plug_perspectiveAnalysis.setAnnotationFromPointA();
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\AddRenderObj line 4 1 " + bt_plug_perspectiveAnalysis.pointA_X + " " + bt_plug_perspectiveAnalysis.pointA_Y + " " + bt_plug_perspectiveAnalysis.pointA_Z + " 8 2 2 0.000000 0.000000 0.000000 255 255 0 255 " + (bt_plug_perspectiveAnalysis.posC_Arr()[1] - bt_plug_perspectiveAnalysis.pointA_X) + " " + (bt_plug_perspectiveAnalysis.posC_Arr()[2] - bt_plug_perspectiveAnalysis.pointA_Y) + " " + (bt_plug_perspectiveAnalysis.posC_Arr()[3] - bt_plug_perspectiveAnalysis.pointA_Z) + " 255 255 0 255 0 1 1; ");
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\AddRenderObj lineC 4 1 " + bt_plug_perspectiveAnalysis.posC_Arr()[1] + " " + bt_plug_perspectiveAnalysis.posC_Arr()[2] + " " + bt_plug_perspectiveAnalysis.posC_Arr()[3] + " 8 2 2 0.000000 0.000000 0.000000 255 0 0 255 " + (bt_plug_perspectiveAnalysis.pointB_X - bt_plug_perspectiveAnalysis.posC_Arr()[1]) + " " + (bt_plug_perspectiveAnalysis.pointB_Y - bt_plug_perspectiveAnalysis.posC_Arr()[2]) + " " + (bt_plug_perspectiveAnalysis.pointB_Z - bt_plug_perspectiveAnalysis.posC_Arr()[3]) + " 255 0 0 255 0 1 1; ");
      bt_Util.executeScript("Render\\ForceRedraw;");
    }
  };

  //清除渲染
  bt_plug_perspectiveAnalysis.clearLastDraw = function clearLastDraw () {
    //如果计数器值为0
    if (bt_plug_perspectiveAnalysis.count === 0) {
      //清除之前渲染的线段和标注
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj line 8;");
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj lineC 8;");
      bt_Plug_Annotation.removeAnnotation("p");
      //清除保留的渲染
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj oldLine 8;");
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj oldLineC 8;");
      bt_Plug_Annotation.removeAnnotation("oldP");
      //强制刷新重绘
      bt_Util.executeScript("Render\\ForceRedraw;");
      //计数器+1
      bt_plug_perspectiveAnalysis.count += 1;
    }
  }

  if(bt_Util.mobileDevice){
    //如果是移动设备
    //查询两顶点间距离
    bt_plug_perspectiveAnalysis.distMeasure = function distMeasure() {
      if(bt_plug_perspectiveAnalysis.posArr()[0] == 1) { //限定事件发生范围在场景内
        if(bt_plug_perspectiveAnalysis.time == 0) {
          //第一次单击时
          bt_plug_perspectiveAnalysis.time = 1;
          //如果计数器值为0
          if (bt_plug_perspectiveAnalysis.count === 0) {
            //清除之前渲染的线段和标注
            bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj line 8;");
            bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj lineC 8;");
            bt_Plug_Annotation.removeAnnotation("p");
            //清除保留的渲染
            bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj oldLine 8;");
            bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj oldLineC 8;");
            bt_Plug_Annotation.removeAnnotation("oldP");
            //强制刷新重绘
            bt_Util.executeScript("Render\\ForceRedraw;");
            //重置相关数据
            bt_plug_perspectiveAnalysis.pointPos = [];
            bt_plug_perspectiveAnalysis.pointPosC = [];
          }
          //计数器+1
          bt_plug_perspectiveAnalysis.count += 1;
          //设置并储存顶点A
          bt_plug_perspectiveAnalysis.setPointA();
          //设置标注
          bt_Plug_Annotation.setAnnotation("p", bt_plug_perspectiveAnalysis.posArr()[1], bt_plug_perspectiveAnalysis.posArr()[2], bt_plug_perspectiveAnalysis.posArr()[3], -8, -16, "<div style='background:url(images/DefaultIcon.png); background-position:center left; background-repeat: no-repeat; height:16px;line-height:10px;'><span style='margin-left:16px; font-size:9px; white-space: nowrap;'></span></div>", false);
          //监听鼠标双击事件
          bt_event.addEventListener("GUIEvent\\KM\\OnMouseDbClick", function(ep) {
            if(ep[0] == 0) { //判断如果双击的是鼠标左键，则删除多余数据，将time和count重置
              bt_plug_perspectiveAnalysis.time = 0;
              bt_plug_perspectiveAnalysis.count = 0;
            };
          });
        } else {
          //第二次单击时
          bt_plug_perspectiveAnalysis.time = 0;
          //移除起点标注
          bt_Plug_Annotation.removeAnnotation("p");
          //储存并设置顶点B
          bt_plug_perspectiveAnalysis.setPointB();
          //渲染整个线段
          bt_plug_perspectiveAnalysis.addLineFromPointA();
          //储存交点坐标
          bt_plug_perspectiveAnalysis.pointPosC[0] = bt_plug_perspectiveAnalysis.posC_Arr()[1];
          bt_plug_perspectiveAnalysis.pointPosC[1] = bt_plug_perspectiveAnalysis.posC_Arr()[2];
          bt_plug_perspectiveAnalysis.pointPosC[2] = bt_plug_perspectiveAnalysis.posC_Arr()[3];
          //储存顶点坐标
          if (bt_plug_perspectiveAnalysis.pointPos.length > 3) {
            bt_plug_perspectiveAnalysis.pointPosSave = bt_plug_perspectiveAnalysis.pointPos;
          }
        };
      }
    };
    //监听鼠标事件
    bt_plug_perspectiveAnalysis.MouseListener = function MouseListener(ep) {
      if(ep[0] == 0){
        bt_plug_perspectiveAnalysis.up_x = ep[1];
        bt_plug_perspectiveAnalysis.up_y = ep[2];
        bt_plug_perspectiveAnalysis.distMeasure()
      }
    };
  } else {
    //如果是PC端
    //查询两顶点间距离
    bt_plug_perspectiveAnalysis.distMeasure = function distMeasure(up) {
      if(bt_plug_perspectiveAnalysis.posArr()[0] == 1) { //限定事件发生范围在场景内
        if(bt_plug_perspectiveAnalysis.time == 0) {
          //第一次单击时
          bt_plug_perspectiveAnalysis.time = 1;
          //如果计数器为0，鼠标开始移动时清除上次渲染、重置相关数据
          bt_event.addEventListener("GUIEvent\\KM\\OnMouseMove", bt_plug_perspectiveAnalysis.clearLastDraw);
          //储存并设置顶点A
          bt_plug_perspectiveAnalysis.setPointA();
          //监听鼠标移动并渲染线段
          bt_event.addEventListener("GUIEvent\\KM\\OnMouseMove", bt_plug_perspectiveAnalysis.addLineFromPointA);
          //记录当前点击的坐标
          bt_plug_perspectiveAnalysis.click_x = up.clientX;
          bt_plug_perspectiveAnalysis.click_y = up.clientY;
        } else {
          //如果第二次单击时的坐标与上一次单击时的坐标不同
          if(bt_plug_perspectiveAnalysis.click_x != up.clientX && bt_plug_perspectiveAnalysis.click_y != up.clientY){
            //第二次单击时
            bt_plug_perspectiveAnalysis.time = 0;
            //储存并设置顶点B
            bt_plug_perspectiveAnalysis.setPointB();
            //移除鼠标移动监听并渲染最终线段
            bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", bt_plug_perspectiveAnalysis.addLineFromPointA);
            //储存交点坐标
            bt_plug_perspectiveAnalysis.pointPosC[0] = bt_plug_perspectiveAnalysis.posC_Arr()[1];
            bt_plug_perspectiveAnalysis.pointPosC[1] = bt_plug_perspectiveAnalysis.posC_Arr()[2];
            bt_plug_perspectiveAnalysis.pointPosC[2] = bt_plug_perspectiveAnalysis.posC_Arr()[3];
            //记录当前点击的坐标
            bt_plug_perspectiveAnalysis.click_x = up.clientX;
            bt_plug_perspectiveAnalysis.click_y = up.clientY;
            //储存顶点坐标
            if (bt_plug_perspectiveAnalysis.pointPos.length > 3) {
              bt_plug_perspectiveAnalysis.pointPosSave = bt_plug_perspectiveAnalysis.pointPos;
            }
          } else {
            //如果第二次单击时的坐标与上一次单击时的坐标相同，判断为双击，移除鼠标移动监听
            bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", bt_plug_perspectiveAnalysis.clearLastDraw);
            bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", bt_plug_perspectiveAnalysis.addLineFromPointA);
            //重置点击次数和计数器
            bt_plug_perspectiveAnalysis.time = 0;
            bt_plug_perspectiveAnalysis.count = 0;
          }
        };
      }
    };
    //监听鼠标单击事件
    bt_plug_perspectiveAnalysis.MouseListener = function MouseListener(down) {
      var down = window.event;
      bt_plug_perspectiveAnalysis.down_btID = down.button;
      bt_plug_perspectiveAnalysis.down_x = down.clientX;
      bt_plug_perspectiveAnalysis.down_y = down.clientY;
      if(bt_plug_perspectiveAnalysis.down_btID  === 0) {
        bt_event.addEventListener("GUIEvent\\KM\\OnMouseButtonUp", function(up){
          var up = window.event;
          bt_plug_perspectiveAnalysis.up_btID = up.button;
          bt_plug_perspectiveAnalysis.up_x = up.clientX;
          bt_plug_perspectiveAnalysis.up_y = up.clientY;
          if(bt_plug_perspectiveAnalysis.down_x === bt_plug_perspectiveAnalysis.up_x && bt_plug_perspectiveAnalysis.down_y === bt_plug_perspectiveAnalysis.up_y && bt_plug_perspectiveAnalysis.up_btID === 0){
            bt_plug_perspectiveAnalysis.distMeasure(up);
            bt_Util.executeScript("Render\\ForceRedraw;");
          }
        })
      }
    }
  }

  //插件激活方法
  bt_plug_perspectiveAnalysis.plug_activate = function() {
    if(bt_Util.mobileDevice){
    //如果是移动设备
      //切换回插件时恢复保留的上次渲染
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\AddRenderObj oldLine 4 1 " + bt_plug_perspectiveAnalysis.pointPosSave[0] + " " + bt_plug_perspectiveAnalysis.pointPosSave[1] + " " + bt_plug_perspectiveAnalysis.pointPosSave[2] + " 8 2 2 0.000000 0.000000 0.000000 255 225 0 255 " + (bt_plug_perspectiveAnalysis.pointPosC[0] - bt_plug_perspectiveAnalysis.pointPosSave[0]) + " " + (bt_plug_perspectiveAnalysis.pointPosC[1] - bt_plug_perspectiveAnalysis.pointPosSave[1]) + " " + (bt_plug_perspectiveAnalysis.pointPosC[2] - bt_plug_perspectiveAnalysis.pointPosSave[2]) + " 255 225 0 255 0 1 1; ");
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\AddRenderObj oldLineC 4 1 " + bt_plug_perspectiveAnalysis.pointPosC[0] + " " + bt_plug_perspectiveAnalysis.pointPosC[1] + " " + bt_plug_perspectiveAnalysis.pointPosC[2] + " 8 2 2 0.000000 0.000000 0.000000 255 0 0 255 " + (bt_plug_perspectiveAnalysis.pointPosSave[3] - bt_plug_perspectiveAnalysis.pointPosC[0]) + " " + (bt_plug_perspectiveAnalysis.pointPosSave[4] - bt_plug_perspectiveAnalysis.pointPosC[1]) + " " + (bt_plug_perspectiveAnalysis.pointPosSave[5] - bt_plug_perspectiveAnalysis.pointPosC[2]) + " 255 0 0 255 0 1 1; ");
      bt_Plug_Annotation.setAnnotation("oldP", bt_plug_perspectiveAnalysis.annotations[0], bt_plug_perspectiveAnalysis.annotations[1], bt_plug_perspectiveAnalysis.annotations[2], -8, -16, "<div style='background:url(images/DefaultIcon.png); background-position:center left; background-repeat: no-repeat; height:16px;line-height:10px;'><span style='margin-left:16px; font-size:9px; white-space: nowrap;'></span></div>", false);
      //监听鼠标单击事件
      bt_event.addEventListener("GUIEvent\\KM\\OnMouseClick", bt_plug_perspectiveAnalysis.MouseListener);
    } else {
    //如果是PC端
      //切换回插件时恢复保留的上次渲染
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\AddRenderObj oldLine 4 1 " + bt_plug_perspectiveAnalysis.pointPosSave[0] + " " + bt_plug_perspectiveAnalysis.pointPosSave[1] + " " + bt_plug_perspectiveAnalysis.pointPosSave[2] + " 8 2 2 0.000000 0.000000 0.000000 255 225 0 255 " + (bt_plug_perspectiveAnalysis.pointPosC[0] - bt_plug_perspectiveAnalysis.pointPosSave[0]) + " " + (bt_plug_perspectiveAnalysis.pointPosC[1] - bt_plug_perspectiveAnalysis.pointPosSave[1]) + " " + (bt_plug_perspectiveAnalysis.pointPosC[2] - bt_plug_perspectiveAnalysis.pointPosSave[2]) + " 255 225 0 255 0 1 1; ");
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\AddRenderObj oldLineC 4 1 " + bt_plug_perspectiveAnalysis.pointPosC[0] + " " + bt_plug_perspectiveAnalysis.pointPosC[1] + " " + bt_plug_perspectiveAnalysis.pointPosC[2] + " 8 2 2 0.000000 0.000000 0.000000 255 0 0 255 " + (bt_plug_perspectiveAnalysis.pointPosSave[3] - bt_plug_perspectiveAnalysis.pointPosC[0]) + " " + (bt_plug_perspectiveAnalysis.pointPosSave[4] - bt_plug_perspectiveAnalysis.pointPosC[1]) + " " + (bt_plug_perspectiveAnalysis.pointPosSave[5] - bt_plug_perspectiveAnalysis.pointPosC[2]) + " 255 0 0 255 0 1 1; ");
      bt_Plug_Annotation.setAnnotation("oldP", bt_plug_perspectiveAnalysis.annotations[0], bt_plug_perspectiveAnalysis.annotations[1], bt_plug_perspectiveAnalysis.annotations[2], -8, -16, "<div style='background:url(images/DefaultIcon.png); background-position:center left; background-repeat: no-repeat; height:16px;line-height:10px;'><span style='margin-left:16px; font-size:9px; white-space: nowrap;'></span></div>", false);
      //监听鼠标单击事件
      bt_event.addEventListener("GUIEvent\\KM\\OnMouseButtonDown", bt_plug_perspectiveAnalysis.MouseListener);
    }
    bt_Util.executeScript("Render\\ForceRedraw;");
    console.log("透视分析开启");
  };

  //插件注销方法
  bt_plug_perspectiveAnalysis.plug_deactivate = function() {
    if(bt_Util.mobileDevice){
      //如果是移动设备
      //移除鼠标监听事件
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseClick", bt_plug_perspectiveAnalysis.MouseListener);
      //清除渲染
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj line 8;");
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj lineC 8;");
      bt_Plug_Annotation.removeAnnotation("p");
      //清除保留的渲染
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj oldLine 8;");
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj oldLineC 8;");
      bt_Plug_Annotation.removeAnnotation("oldP");
      //重置点击次数和计数器
      bt_plug_perspectiveAnalysis.time = 0;
      bt_plug_perspectiveAnalysis.count = 0;
      //强制刷新重绘
      bt_Util.executeScript("Render\\ForceRedraw;");
    }else{
    //如果是PC端
      //移除鼠标监听事件
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", bt_plug_perspectiveAnalysis.clearLastDraw);
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", bt_plug_perspectiveAnalysis.addLineFromPointA);
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseButtonDown", bt_plug_perspectiveAnalysis.MouseListener);
      //清除渲染
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj line 8;");
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj lineC 8;");
      bt_Plug_Annotation.removeAnnotation("p");
      //清除保留的渲染
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj oldLine 8;");
      bt_Util.executeScript("Render\\RenderDataContex\\DynamicFrame\\DelRenderObj oldLineC 8;");
      bt_Plug_Annotation.removeAnnotation("oldP");
      //重置点击次数和计数器
      bt_plug_perspectiveAnalysis.time = 0;
      bt_plug_perspectiveAnalysis.count = 0;
      //强制刷新重绘
      bt_Util.executeScript("Render\\ForceRedraw;");
    }
    console.log("透视分析关闭");
  };


  var eventBus = require('../../utils/event_bus');
  var PerspectiveAnalysisView = Backbone.View.extend({
    initPlug: function() {
      eventBus.trigger('addPlug',{
        name: 'plug_perspectiveAnalysis',
        title: '透视分析',
        value: this,
        icon: '',
        isIndependent: true, // 是否是单独的功能
        children: null
      });
    },
    activate: function(type) {
      bt_plug_perspectiveAnalysis.plug_activate();
    },
    deactivate: function() {
      bt_plug_perspectiveAnalysis.plug_deactivate();
    }
  });
  module.exports = PerspectiveAnalysisView;
});