define(function(require, exports, module){
  var eventBus = require('../../utils/event_bus');
  var message = require('./../../utils/Message/action');
  var instanceListTpl = require('./instanceList.html');
  var CustomizeModelView = Backbone.View.extend({
    modelUrl: '',
    pathname: '',
    symbolList: [],
    curSymbolName: '',
    symbolInstanceList: [],
    initialize: function(tpl, tpl2) {
      this.template = _.template(tpl);
      this.template2 = _.template(tpl2);
      this.onClick = this.onClick.bind(this);
      this.onDbClick = this.onDbClick.bind(this);
      this.onMouseMove = this.onMouseMove.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onInstanceSelected = this.onInstanceSelected.bind(this);
    },
    render: function(data) {
      $('body').append(this.template(data));
      $('body').append(this.template2());
    },
    initEvent: function() {
      var self = this;
      $('#symbolPanel div.card-body input[name="symbol_checked"]').click(function() { // 复选框实现单选
        if ($(this).is(':checked')) {
          bt_event.addEventListener('GUIEvent\\KM\\OnMouseClick', self.onClick);
          self.curSymbolName = $(this).val();
          $('#symbolCtrlPanel').show();
          $(this).parent().parent().siblings().find('input[name="symbol_checked"]').prop('checked', false);
        } else {
          bt_event.removeEventListener('GUIEvent\\KM\\OnMouseClick', self.onClick);
          self.curSymbolName = '';
          $('#symbolCtrlPanel').hide();
          self.reset();
        }
      });
      $('#symbolCtrlPanel div.card-body #setInstance').click(function() {
        self.setInstanceToSence();
      });
      $('#symbolCtrlPanel div.card-body #saveInstance').click(function() {
        self.saveInstance();
      });
    },
    initPlug: function() {
      eventBus.trigger('addPlug',{
        name: 'plug_plugSample',
        title: '模型',
        value: this,
        icon: '',
        isIndependent: true, // 是否是单独的功能
        isOnce: false, //if true 点击之后状态还原
        children: [
          {
            title: '添加实例',
            type: 'add',
          },
          {
            title: '查看实例',
            type: 'query',
          },
        ]
      });
      $.getJSON(config.customizeModelConf.url, async data => {
        const { pb_fname, symbols } = data;
        const { origin, pathname } = new URL(config.customizeModelConf.url);
        let tmpPathArr = pathname.split('/');
        tmpPathArr.length -= 1;
        // 加载模型
        this.pathname = tmpPathArr.join('/') + `/${pb_fname}`;
        bt_Util.executeScript(`Render\\RenderDataContex\\ModelScene\\OpenModelScene mc://${origin} ${this.pathname};`);
        // 渲染模板
        this.symbolList = symbols;
        this.render({symbolList: this.symbolList});
        this.initEvent();
      });
      // this.modelUrl = config.customizeModelConf.modelUrl;
      // this.symbolList = config.customizeModelConf.symbolList;
      // //  加载模型
      // const { origin, pathname } = new URL(this.modelUrl);
      // this.pathname = pathname;
      // bt_Util.executeScript(`Render\\RenderDataContex\\ModelScene\\OpenModelScene mc://${origin} ${pathname};`);
      // // 渲染模板
      // const symbolList = this.symbolList;
      // this.render({symbolList});
      // this.initEvent();
    },
    activate: function(type) {
      switch (type) {
        case 'add':
          $('#symbolPanel').show();
          break;
        case 'query':
          this.getSymbolInstanceList();
          bt_Util.executeScript("Plugin\\ActivePlugin ModelInstanceQuery;");
          bt_event.addEventListener("Plugin\\ModelInstanceQuery\\OnInstanceSelected", this.onInstanceSelected);
          break;
      }
      // 加载模型
      for (let i = 0; i < this.symbolInstanceList.length; i++) {
        const item = this.symbolInstanceList[i];
        this.addSymbolInstance(item, 1);
      }
    },
    deactivate: function() {
      $('#symbolPanel').hide();
      $('#symbolCtrlPanel').hide();
      $('#instancePanel').hide();
      this.reset();
      //清空模型实例
      for (let i = 0; i < this.symbolInstanceList.length; i++) {
        const item = this.symbolInstanceList[i];
        this.removeSymbolInstance(item, 1);
      }
    },
    onClick (e) {
      var self = this;
      // 得到世界坐标系
      const { hit, x, y, z } = bt_Util.screenToWorld(e[1], e[2]);
      if (hit) {
        this.addSymbolInstance({ x, y, z });
        this.setInstanceParam({ x, y, z });
        bt_event.addEventListener("GUIEvent\\KM\\OnMouseMove", this.onMouseMove);
        bt_event.addEventListener("GUIEvent\\KM\\OnMouseDbClick", this.onDbClick);
        $(document).off("keydown").on('keydown', this.onKeyDown);
      }
    },
    onMouseMove (e) {
      const { hit, x, y, z } = bt_Util.screenToWorld(e[0], e[1]);
      if (hit) {
        this.addSymbolInstance({ x, y, z });
        this.setInstanceParam({ x, y, z });
      }
    },
    onDbClick (e) {
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", this.onMouseMove);
    },
    onKeyDown (e) {
      let keyCode = e.keyCode || e.which || e.charCode;
      let ctrlKey = e.ctrlKey || e.metaKey;
      if (ctrlKey && keyCode === 37 || ctrlKey && keyCode === 38 || ctrlKey && keyCode === 39 || ctrlKey && keyCode === 40) {
        // l37 t38 r39 b40
        let { x, y, z, scale, roateAngle } = this.getInstanceParam();
        scale = Number(scale);
        roateAngle  = Number(roateAngle);
        switch (keyCode) {
          case 37:// 旋转角度 -
            roateAngle -= 1;
            break;
          case 38:// 拉伸系数 +
            scale += 0.1;
            break;
          case 39: // 旋转角度+
            roateAngle += 1;
            break;
          case 40:// 拉伸系数 -
            scale -= 0.1;
            break;
        }
        if (scale<=0) {
          scale = 0.1;
        }
        scale = scale.toFixed(1);
        this.addSymbolInstance({ x, y, z, scale, roateAngle });
        this.setInstanceParam({ x, y, z, scale, roateAngle });
      }
    },
    onInstanceSelected (e) {
      const [symbolName, instanceName, [hit, x, y, z]] = e;
      if (symbolName && instanceName && hit) {
        message.info(`当前选中的模型实例名：${instanceName}`);
      }
    },
    getSymbolInstanceList: function() {
      // 删除实例列表
      if ($('#instancePanel').length) $('#instancePanel').remove();
      // 渲染模板
      const symbolInstanceList = this.symbolInstanceList;
      $('body').append(_.template(instanceListTpl)({symbolInstanceList}));

      $('#instancePanel ul li').click(function() {
        var item = JSON.parse($(this).attr('data-val'));
        const { x, y, z } = item;
        bt_Util.executeScript(`Render\\CameraControl\\FlyTo ${x} ${y} ${Number(z) + 10} ${x} ${y} ${Number(z) + 5};`);
      });
    },
    addSymbolInstance: function (data, isIntersect = 0) {
      const { name, x, y, z, scale = 1, roateX = 0, roateY = 0, roateZ = 1, roateAngle = 0, symbolName } = data;
      bt_Util.executeScript(`Render\\RenderDataContex\\ModelScene\\ModelScene\\${this.pathname}\\SetInstance ${name ? name : 'customizeModelInstaceTmpName'} 0 ${symbolName ? symbolName : this.curSymbolName} 0 ${scale} ${scale} ${scale} ${roateX} ${roateY} ${roateZ} ${roateAngle*Math.PI/180} ${x} ${y} ${z} ${isIntersect};`);
      
    },
    removeSymbolInstance: function(data, isIntersect = 0) {
      const { name, x, y, z, scale = 1, roateX = 0, roateY = 0, roateZ = 1, roateAngle = 0, symbolName } = data;
      bt_Util.executeScript(`Render\\RenderDataContex\\ModelScene\\ModelScene\\${this.pathname}\\SetInstance ${name ? name : 'customizeModelInstaceTmpName'} 1 ${symbolName ? symbolName : this.curSymbolName}  0 ${scale} ${scale} ${scale} ${roateX} ${roateY} ${roateZ} ${roateAngle*Math.PI/180} ${x} ${y} ${z} ${isIntersect};`);
    },
    setInstanceToSence: function() {
      const data = this.getInstanceParam();
      this.addSymbolInstance(data);
    },
    saveInstance: function() {
      const data = this.getInstanceParam();
      const { name, x, y, z, scale , roateX, roateY, roateZ, roateAngle } = data;
      if (!(name!==''&&x!=''&&y!==''&&z!==''&&scale!==''&&roateX!==''&&roateY!==''&&roateZ!==''&&roateAngle!=='')) {
        message.warning('实例名和实例参数不能为空！');
        return;
      }

      if (this.symbolInstanceList.find(item => item.name === name)) {
        message.warning('实例名重复，请重新的输入！');
        return;
      }

      // 删除临时实例
      this.removeSymbolInstance({x, y, z, scale, roateAngle});
      // 保存实例
      this.addSymbolInstance(data, 1);
      data.symbolName = this.curSymbolName;
      this.symbolInstanceList.push(data);
      message.success(`新增实例-${name}！`);
      // 初始化
      this.reset();
    },
    getInstanceParam: function() {
      const name = $('#symbolInstanceName').val();
      const x = $('#symbolInstanceX').val();
      const y = $('#symbolInstanceY').val();
      const z = $('#symbolInstanceZ').val();
      const scale = $('#symbolInstanceScale').val();
      const roateX = $('#symbolInstanceRotateX').val();
      const roateY = $('#symbolInstanceRotateY').val();
      const roateZ = $('#symbolInstanceRotateZ').val();
      const roateAngle =$('#symbolInstanceRotateAngle').val();

      return {
        name,
        x,
        y,
        z,
        scale,
        roateX,
        roateY,
        roateZ,
        roateAngle,
      }
    },
    setInstanceParam: function(data) {
      const { name = '', x = '', y = '', z = '', scale = 1, roateX = 0, roateY = 0, roateZ = 1, roateAngle = 0 } = data;
      $('#symbolInstanceName').val(name);
      $('#symbolInstanceX').val(x);
      $('#symbolInstanceY').val(y);
      $('#symbolInstanceZ').val(z);
      $('#symbolInstanceScale').val(scale);
      $('#symbolInstanceRotateX').val(roateX);
      $('#symbolInstanceRotateY').val(roateY);
      $('#symbolInstanceRotateZ').val(roateZ);
      $('#symbolInstanceRotateAngle').val(roateAngle);
    },
    reset: function() {
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseClick", this.onClick);
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", this.onMouseMove);
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseDbClick", this.onDbClick);
      $(document).off('keydown', this.onKeyDown);
      
      bt_Util.executeScript("Plugin\\DeactivePlugin ModelInstanceQuery;");
      bt_event.removeEventListener("Plugin\\ModelInstanceQuery\\OnInstanceSelected", this.onInstanceSelected);
      
      this.setInstanceParam({ name: '', x: '', y: '', z: '', scale: '', roateX: '', roateY: '', roateZ: '', roateAngle: '' });
      $('#symbolPanel').find('input[name="symbol_checked"]').prop('checked', false);
      $('#symbolCtrlPanel').hide();
    }
  });
  module.exports = CustomizeModelView;
});