 /**
  * 查看pb文件
  */
 define(function(require, exports, module){
  var eventBus = require('../../utils/event_bus');
  var PbReaderView = Backbone.View.extend({
    initialize: function(tpl) {
      this.template = _.template(tpl);
    },
    render: function() {
      var self = this;
      $('body').append(this.template());
      $("#pbreader").change(function() {
        debugger;
        self.readPb($(this)[0].files[0]);
      });
    },
    initPlug: function() {
      eventBus.trigger('addPlug',{
        name: 'plug_pbReader',
        title: '查看pb模型',
        value: this,
        icon: '',
        isIndependent: true, // 是否是单独的功能
        isOnce: false //if true 点击之后状态还原
      });
      this.render();
    },
    activate: function() {
      this.fastReader();
    },
    deactivate: function() {
      this.closePb();
    },
    fastReader: function() {
      $("#pbreader").click();
    },
    readPb: function(pbFile) {
      if (pbFile.name.indexOf('.pb') < 0) {
        alert('选择的不是pb文件，请重试！！！');
        return false;
      }
      this.closePb();
      const url = URL.createObjectURL(pbFile);

      const pb_url = url.substring(0, url.lastIndexOf("/") + 1);
      const pb_name = url.substring(url.lastIndexOf("/") + 1);
      bt_Util.executeScript("Render\\RenderDataContex\\ModelScene\\OpenModelScene mc://" + pb_url + " " + pb_name + " 1;");
      this.pbName = pb_name;
      bt_Util.executeScript("Render\\ForceRedraw;");
    },
    closePb: function() {
      if (this.pbName) {
        bt_Util.executeScript(`Render\\RenderDataContex\\ModelScene\\CloseModelScene ${this.pbName};`);
        bt_Util.executeScript('Render\\ForceRedraw;');
        this.pbName = null;
      }
    },
  });
  module.exports = PbReaderView;
});