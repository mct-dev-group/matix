var bt_event = {
  events: {},
  //获取屏幕上的点坐标
  getPointOnCanvas(canvas, x, y) {
    let bbox = canvas.getBoundingClientRect();
    return {
      x: x - bbox.left * (canvas.width / bbox.width),
      y: y - bbox.top * (canvas.height / bbox.height)
    };
  },
  bt_DefaultGUIAction: {
    panBegan: function (x, y) {
      let script = "Render\\CameraControl\\PanBegan " + x + "\t" + y + ";";
      BT_BodyExecuteScript(g_Body, script, 0);
    },
    pan: function (x, y) {
      let script = "Render\\CameraControl\\Pan " + x + "\t" + y + ";";
      BT_BodyExecuteScript(g_Body, script, 0);
    },
    pinchBegan: function () {
      BT_BodyExecuteScript(g_Body, "Render\\CameraControl\\PinchBegan;");
    },
    pinch: function (scale) {
      let script = "Render\\CameraControl\\Pinch " + scale + ";";
      BT_BodyExecuteScript(g_Body, script, 0);
    },
    rotateBegan: function (x, y) {
      let script = "Render\\CameraControl\\RotateBegan " + x + " " + y + ";";
      BT_BodyExecuteScript(g_Body, script, 0);
    },
    rotate: function (x, y) {
      let script = "Render\\CameraControl\\Rotate " + x + "\t" + y + ";";
      BT_BodyExecuteScript(g_Body, script, 0);
    },
    transformTo: function (x, y) {
      let script = "Render\\CameraControl\\TransformTo " + x + "\t" + y + ";";

      let bt_log = BT_LogCreate();
      BT_BodyExecuteScript(g_Body, script, bt_log);

      let log_count = BT_LogGetCount(bt_log);
      if (log_count > 0) {
        let log_str = Module.UTF8ToString(BT_LogGetLog(0, bt_log));
        console.log(log_str);
      }
      BT_LogClearAll(bt_log);
      BT_LogRelease(bt_log);
    },

    km: {
      onMouseButtonDown: function (button_id, x, y) {
        let script = "GUIEvent.KM.OnMouseButtonDown " + button_id + " " + x + " " + y + ";";
        BT_BodyExecuteScript(g_Body, script, 0);
      },

      onMouseButtonUp: function (button_id, x, y) {
        let script = "GUIEvent.KM.OnMouseButtonUp " + button_id + " " + x + " " + y + ";";
        BT_BodyExecuteScript(g_Body, script, 0);
      },

      onMouseMove: function (x, y) {
        let script = "GUIEvent.KM.OnMouseMove " + x + " " + y + ";";
        BT_BodyExecuteScript(g_Body, script, 0);
      },

      onMouseClick: function (button_id, x, y) {
        let script = "GUIEvent.KM.OnMouseClick " + button_id + " " + x + " " + y + ";";
        BT_BodyExecuteScript(g_Body, script, 0);
      },

      onMouseDbClick: function (button_id, x, y) {
        let script = "GUIEvent.KM.OnMouseDbClick " + button_id + " " + x + " " + y + ";";
        BT_BodyExecuteScript(g_Body, script, 0);
      },

      onMouseWheel: function (delta, x, y) {
        if (delta > 0) {
          let script = "GUIEvent.KM.OnMouseWheel 1.06 + " + x + " " + y + ";";
          BT_BodyExecuteScript(g_Body, script, 0);
        }
        else {
          let script = "GUIEvent.KM.OnMouseWheel 0.9434 + " + x + " " + y + ";";
          BT_BodyExecuteScript(g_Body, script, 0);
        }
      },

      onKeyDown: function (key) {
        let script = "GUIEvent.KM.OnKeyDown " + key + ";";
        BT_BodyExecuteScript(g_Body, script, 0);
      },

      onKeyUp: function (key) {
        let script = "GUIEvent.KM.OnKeyUp " + key + ";";
        BT_BodyExecuteScript(g_Body, script, 0);
      }
    }, //KM
  },
  km: {
    onMouseButtonDown(button_id, x, y) {
      let ep = [];
      ep[0] = 'GUIEvent\\KM\\OnMouseButtonDown';
      ep[1] = button_id;
      ep[2] = x;
      ep[3] = y;
      if (bt_event.on_BTEvent(ep)) return true;
      bt_event.bt_DefaultGUIAction.km.onMouseButtonDown(button_id, x, y);
    },
    onMouseButtonUp(button_id, x, y) {
      let ep = [];
      ep[0] = 'GUIEvent\\KM\\OnMouseButtonUp';
      ep[1] = button_id;
      ep[2] = x;
      ep[3] = y;
      if (bt_event.on_BTEvent(ep)) return true;
      bt_event.bt_DefaultGUIAction.km.onMouseButtonUp(button_id, x, y);
    },
    onMouseMove(x, y) {
      let ep = [];
      ep[0] = 'GUIEvent\\KM\\OnMouseMove';
      ep[1] = x;
      ep[2] = y;
      if (bt_event.on_BTEvent(ep)) return true;
      bt_event.bt_DefaultGUIAction.km.onMouseMove(x, y);
    },
    onMouseClick(button_id, x, y) {
      let ep = [];
      ep[0] = 'GUIEvent\\KM\\OnMouseClick';
      ep[1] = button_id;
      ep[2] = x;
      ep[3] = y;
      if (bt_event.on_BTEvent(ep)) return true;
      bt_event.bt_DefaultGUIAction.km.onMouseClick(button_id, x, y);
    },
    onMouseDbClick(button_id, x, y) {
      let ep = [];
      ep[0] = 'GUIEvent\\KM\\OnMouseDbClick';
      ep[1] = button_id;
      ep[2] = x;
      ep[3] = y;
      if (bt_event.on_BTEvent(ep)) return true;
      bt_event.bt_DefaultGUIAction.km.onMouseDbClick(button_id, x, y);
    },
    onMouseWheel(delta, x, y) {
      let ep = [];
      ep[0] = 'GUIEvent\\KM\\OnMouseWheel';
      ep[1] = delta;
      ep[2] = x;
      ep[3] = y;
      if (bt_event.on_BTEvent(ep)) return true;
      bt_event.bt_DefaultGUIAction.km.onMouseWheel(delta, x, y);
    },
    onKeyDown(key) {
      let ep = [];
      ep[0] = 'GUIEvent\\KM\\OnKeyDown';
      ep[1] = key;
      if (bt_event.on_BTEvent(ep)) return true;
      bt_event.bt_DefaultGUIAction.km.onKeyDown(key);
    },
    onKeyUp(key) {
      let ep = [];
      ep[0] = 'GUIEvent\\KM\\OnKeyUp';
      ep[1] = key;
      if (bt_event.on_BTEvent(ep)) return true;
      bt_event.bt_DefaultGUIAction.km.onKeyUp(key);
    }
  }, //KM
  addEventListener: function (e, f) {    
    if (!bt_event.events[e]) {
      bt_event.events[e] = new Map();
    }
    let event = bt_event.events[e];    
    if (!event.has(f)) {
      event.set(f,f)
    }
  },
  removeEventListener: function (e, f) {    
    if (!bt_event.events[e]) return;
    let event = bt_event.events[e];
    if (!event.has(f)) return;
    event.delete(f);
  },
  on_BTEvent: function (e) {
    let event_param = [];
    for (let i = 1; i < e.length; i++) {
      event_param[i - 1] = e[i];
    }
    let event = this.events[e[0]];
    if (!event) return;
    for (const v of event.values()) {
      if (v(event_param)) {
        return true;
      }
    }
  },
  canvasgl_GUI_init() {
    //设备类型标识
    let browser = {
      versions: function () {
        let u = navigator.userAgent, app = navigator.appVersion;
        return {
          Chrome: u.indexOf('Chrome') > -1,
          MSIE: u.indexOf('Trident') > -1 || u.indexOf('MSIE') > -1,
          OPR: u.indexOf('Presto') > -1 || u.indexOf('OPR') > -1,
          webKit: u.indexOf('AppleWebKit') > -1 || u.indexOf('Safari') > -1,
          gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1,
          mobile: !!u.match(/AppleWebKit.*Mobile.*/),
          ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),
          android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1,
          iPhone: u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1,
          iPad: u.indexOf('iPad') > -1,
          webApp: u.indexOf('Safari') == -1,
          Firefox: u.indexOf('Firefox') > -1
        }
      }()
    }
    //判断如果是移动设备
    if (browser.versions.mobile || browser.versions.android || browser.versions.iPhone || browser.versions.iPad) {
      bt_is_mobile = true;
      let action = '';		//储存手势行为名称
      let buttonID = '';		//储存模拟的鼠标按键ID
      let trigger = null;		//计时器
      //初始化数据
      touch.config = {
        tap: true,
        doubleTap: true,
        hold: false,
        holdTime: 650,
        swipe: true,
        swipTime: 300,
        swipMinDistance: 18,
        swipFactor: 0.1,
        drag: true,
        pinch: true
      };

      //手指刚接触屏幕时
      touch.on('#canvasgl', 'touchstart', function (ev) {
        if (ev.originEvent.touches.length == 1) {	//判断如果只有一根手指接触屏幕
          trigger = setTimeout(function () {
            buttonID = 0;
          }, 15)	//间隔15秒最流畅
          let loc = bt_event.getPointOnCanvas(ev.target, ev.originEvent.changedTouches[0].clientX, ev.originEvent.changedTouches[0].clientY);
          bt_event.km.onMouseButtonDown(buttonID, parseInt(loc.x), parseInt(loc.y));
        } else {	//判断如果有两根或两根以上的手指接触屏幕
          clearTimeout(trigger);	//清除定时器
          action = 'fingers';		//更新手势为多指
          buttonID = '';			//重置"buttonID"
        }
        ev.preventDefault();
      });
      //手指离开屏幕时
      touch.on('#canvasgl', 'touchend', function (ev) {
        if (ev.originEvent.touches.length == 0) {
          let loc = bt_event.getPointOnCanvas(ev.target, ev.originEvent.changedTouches[0].clientX, ev.originEvent.changedTouches[0].clientY);
          bt_event.km.onMouseButtonUp(buttonID, parseInt(loc.x), parseInt(loc.y));
          action = '';
          buttonID = '';
        }
        ev.preventDefault();
      });
      //单击屏幕
      touch.on('#canvasgl', 'tap', function (ev) {
        if (ev.originEvent.changedTouches.length == 1) {
          let loc = bt_event.getPointOnCanvas(ev.target, ev.originEvent.changedTouches[0].clientX, ev.originEvent.changedTouches[0].clientY);
          bt_event.km.onMouseClick(0, parseInt(loc.x), parseInt(loc.y));
        };
        ev.preventDefault();
      });
      //双击屏幕
      touch.on('#canvasgl', 'doubletap', function (ev) {
        if (ev.originEvent.changedTouches.length == 1) {
          let loc = bt_event.getPointOnCanvas(ev.target, ev.originEvent.changedTouches[0].clientX, ev.originEvent.changedTouches[0].clientY);
          bt_event.km.onMouseDbClick(0, parseInt(loc.x), parseInt(loc.y));
        }
      });

      //拖动开始
      touch.on('#canvasgl', 'dragstart', function (ev) {
        if (ev.originEvent.changedTouches.length == 1) {
          let loc = bt_event.getPointOnCanvas(ev.target, ev.originEvent.changedTouches[0].clientX, ev.originEvent.changedTouches[0].clientY);
          bt_event.km.onMouseButtonDown(buttonID, parseInt(loc.x), parseInt(loc.y));
          action = 'drag';
        }
        ev.preventDefault();
      });
      //拖动手势
      touch.on('#canvasgl', 'drag', function (ev) {
        if (ev.originEvent.changedTouches.length == 1) {
          let loc = bt_event.getPointOnCanvas(ev.target, ev.originEvent.changedTouches[0].clientX, ev.originEvent.changedTouches[0].clientY);
          bt_event.km.onMouseMove(parseInt(loc.x), parseInt(loc.y));
          action = 'drag';
        }
        ev.preventDefault();
      });
      //拖动结束
      touch.on('#canvasgl', 'dragend', function (ev) {
        let loc = bt_event.getPointOnCanvas(ev.target, ev.originEvent.changedTouches[0].clientX, ev.originEvent.changedTouches[0].clientY);
        bt_event.km.onMouseButtonUp(buttonID, parseInt(loc.x), parseInt(loc.y));
        action = '';
      });

      //获取两点间距离绝对值
      function getDistance(x1, y1, x2, y2) {
        return Math.sqrt((Math.abs(x1 - x2)) * (Math.abs(x1 - x2)) + (Math.abs(y1 - y2)) * (Math.abs(y1 - y2)));
      };

      //缩放、旋转
      let ps_x1, ps_y1, ps_x2, ps_y2;
      touch.on('#canvasgl', 'pinch', function (ev) {
        let x1 = ev.originEvent.touches[0].clientX;
        let y1 = ev.originEvent.touches[0].clientY;
        let x2 = ev.originEvent.touches[1].clientX;
        let y2 = ev.originEvent.touches[1].clientY;
        if (action === 'fingers') {	//如果手势为多指操作
          action = 'start';		//action更新为start，手势开始准备
          ps_x1 = x1;
          ps_y1 = y1;
          ps_x2 = x2;
          ps_y2 = y2;
        } else if (action === 'start') {	//如果action为start
          let diststart = getDistance(ps_x1, ps_y1, ps_x2, ps_y2);
          let distnow = getDistance(x1, y1, x2, y2);
          if (Math.abs(distnow - diststart) >= 2) { //判断如果双指间移动距离绝对值大于等于2
            //当双指间移动距离以绝对值2为判断条件时，缩放与旋转的辨别是最准确的
            action = 'pinch'; //缩放
            ps_x1 = x1;
            ps_y1 = y1;
            ps_x2 = x2;
            ps_y2 = y2;
            bt_event.bt_DefaultGUIAction.pinchBegan();
          } else { //判断如果双指间移动距离绝对值小于2
            action = 'rotate'; //旋转	
            bt_event.km.onMouseButtonDown(2, parseInt((x1 + x2) / 2), parseInt((y1 + y2) / 2));
          }
        } else if (action === 'pinch') {
          let diststart = getDistance(ps_x1, ps_y1, ps_x2, ps_y2);
          let distnow = getDistance(x1, y1, x2, y2);
          let scale = distnow / diststart;
          bt_event.bt_DefaultGUIAction.pinch(scale);
        } else if (action = 'rotate') {
          bt_event.km.onMouseMove(parseInt((x1 + x2) / 2), parseInt((y1 + y2) / 2));
        }
      });
      touch.on('#canvasgl', 'pinchend', function (ev) {
        action = '';
        ev.preventDefault();
      });

      //判断如果是PC端	
    } else {
      let timer = null;
      let click_times = 0;
      let down_x = -1;
      let down_y = -1;
      let down_key = -1;

      function bt_canvase_onMouseMove(event) {
        let loc = bt_event.getPointOnCanvas(bt_canvasgl, event.clientX, event.clientY);
        if (loc.x != down_x || loc.y != down_y) {
          bt_event.km.onMouseMove(loc.x, loc.y);
          event.preventDefault();
          event.stopImmediatePropagation();

          if (click_times === 1) {
            bt_event.km.onMouseClick(down_key, down_x, down_y);
          }
          else if (click_times === 2) {
            bt_event.km.onMouseDbClick(down_key, down_x, down_y);
          }

          down_key = -1;
          click_times = 0;
          clearTimeout(timer);
        }
      }

      function bt_canvase_onMouseDown(event) {
        let loc = bt_event.getPointOnCanvas(bt_canvasgl, event.clientX, event.clientY);

        bt_event.km.onMouseButtonDown(event.button, loc.x, loc.y);
        event.preventDefault();
        event.stopImmediatePropagation();

        clearTimeout(timer);
        down_x = loc.x;
        down_y = loc.y;
        down_key = event.button;
      }

      function bt_canvase_onMouseUp(event) {
        let loc = bt_event.getPointOnCanvas(bt_canvasgl, event.clientX, event.clientY);
        bt_event.km.onMouseButtonUp(event.button, loc.x, loc.y);
        event.preventDefault();
        event.stopImmediatePropagation();

        clearTimeout(timer);
        if (down_x === loc.x && down_y === loc.y && event.button === down_key) {
          click_times++;

          timer = setTimeout(function () {
            if (click_times === 1) {
              bt_event.km.onMouseClick(down_key, down_x, down_y);
            }
            else if (click_times > 1) {
              bt_event.km.onMouseDbClick(down_key, down_x, down_y);
            }

            click_times = 0;
            down_key = -1;
          }, 300);
        }
        else {
          down_key = -1;
          click_times = 0;
        }
      }

      function bt_canvase_onMouseWheel(event) {
        delta = event.wheelDelta ? (event.wheelDelta / 120) : (-event.detail / 3);
        let loc = bt_event.getPointOnCanvas(event.target, event.clientX, event.clientY);
        bt_event.km.onMouseWheel(delta, loc.x, loc.y);
        event.preventDefault();
        event.stopImmediatePropagation();
      }

      function bt_canvase_onKeyDown(event) {
        bt_event.km.onKeyDown(event.key);
      }

      function bt_canvase_onKeyUp(event) {
        bt_event.km.onKeyUp(event.key);
      }

      bt_canvasgl.addEventListener('mousemove', bt_canvase_onMouseMove, true);
      bt_canvasgl.addEventListener('mousedown', bt_canvase_onMouseDown, true);
      bt_canvasgl.addEventListener('mouseup', bt_canvase_onMouseUp, true);
      bt_canvasgl.oncontextmenu = function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      if (browser.versions.Firefox)
        bt_canvasgl.addEventListener('DOMMouseScroll', bt_canvase_onMouseWheel, true);
      else
        bt_canvasgl.addEventListener('mousewheel', bt_canvase_onMouseWheel, true);

      bt_canvasgl.addEventListener('keydown', bt_canvase_onKeyDown, true);
      bt_canvasgl.addEventListener('keyup', bt_canvase_onKeyUp, true);
      bt_canvasgl.focus();
    }
  }
};

// 全局事件

let canvas = document.getElementById("canvasgl");

var bt_UIE_divSetNdx = 0;
var bt_UIE_divSets = [];
var bt_UIE_divContainerElement = document.getElementById("bt_container");
function JS_BT_UIElementClearAll() {
  for (; bt_UIE_divSetNdx < bt_UIE_divSets.length; ++bt_UIE_divSetNdx) {
    bt_UIE_divSets[bt_UIE_divSetNdx].style.display = "none";
  }
  bt_UIE_divSetNdx = 0;
}
function JS_BT_UIElementAddText(msg, x, y) {
  // get the next div
  var divSet = bt_UIE_divSets[bt_UIE_divSetNdx++];
  // If it doesn't exist make a new one
  if (!divSet) {
    divSet = {};
    divSet.div = document.createElement("div");

    divSet.div.addEventListener(
      "mousemove",
      function(event) {
        var bbox = divSet.div.getBoundingClientRect();
        event.clientX += bbox.left;
        event.clientY += bbox.top;
        bt_canvase_onMouseMove(event);
      },
      false
    );

    divSet.div.addEventListener(
      "mousedown",
      function(event) {
        var bbox = divSet.div.getBoundingClientRect();
        event.clientX += bbox.left;
        event.clientY += bbox.top;
        bt_canvase_onMouseDown(event);
      },
      false
    );

    divSet.div.addEventListener(
      "mouseup",
      function(event) {
        var bbox = divSet.div.getBoundingClientRect();
        event.clientX += bbox.left;
        event.clientY += bbox.top;
        bt_canvase_onMouseUp(event);
      },
      false
    );

    if (typeof browser !== "undefined" && browser.versions.Firefox)
      divSet.div.addEventListener(
        "DOMMouseScroll",
        function(event) {
          var bbox = divSet.div.getBoundingClientRect();
          event.clientX += bbox.left;
          event.clientY += bbox.top;
          bt_canvase_onMouseWheel(event);
        },
        false
      );
    else
      divSet.div.addEventListener(
        "mousewheel",
        function(event) {
          var bbox = divSet.div.getBoundingClientRect();
          event.clientX += bbox.left;
          event.clientY += bbox.top;
          bt_canvase_onMouseWheel(event);
        },
        false
      );

    divSet.style = divSet.div.style;
    divSet.div.className = "bt_ui_element";

    // add the text node to the div
    divSet.textNode = document.createElement("div");
    divSet.div.appendChild(divSet.textNode);

    // add the div to the container
    bt_UIE_divContainerElement.appendChild(divSet.div);

    // Add it to the set
    bt_UIE_divSets.push(divSet);
  }

  // make it display
  divSet.style.display = "block";
  divSet.style.left = Math.floor(x - 8) + "px";
  divSet.style.top = Math.floor(y - 16) + "px";

  divSet.textNode.innerHTML =
    "<div style='background:url(assets/images/DefaultIcon.png); background-position:center left; background-repeat: no-repeat; height:16px;line-height:10px;'><span style='margin-left:16px; font-size:9px; white-space: nowrap;'>" +
    Module.UTF8ToString(msg) +
    "</span></div>";
}

function BT_RenderFrame() {
  document.getElementById("bt_container").style.width =
    $(window).width() + "px";
  document.getElementById("bt_container").style.height =
    $(window).height() + "px";
  if (
    document.getElementById("canvasgl").width !=
    document.getElementById("bt_container").clientWidth
  ) {
    document.getElementById("canvasgl").width = document.getElementById(
      "bt_container"
    ).clientWidth;
  }
  if (
    document.getElementById("canvasgl").height !=
    document.getElementById("bt_container").clientHeight
  ) {
    document.getElementById("canvasgl").height = document.getElementById(
      "bt_container"
    ).clientHeight;
  }
  canvas = document.getElementById("canvasgl");
  var script =
    "Render\\OnRender " + canvasgl.width + " " + canvasgl.height + ";";
  bt_Util.executeScript(script);
  requestId = window.requestAnimationFrame(BT_RenderFrame);
}
//JS_BT_FireEvent
function JS_BT_FireEvent(event) {
  let that = this;
  bt_event.on_BTEvent(event);
  if (event[0] == "Render\\OnFinalBlend") {
    //渲染结束事件：
  } else if (
    event[0] == "Plugin\\ModelInstanceQuery\\OnInstanceSelected"
  ) {
    //实例被选中事件
  } else if (
    event[0] == "Plugin\\ModelInstanceQuery\\OnInstanceUnselected"
  ) {
    //实例被取消选中事件
  }
  return;
}