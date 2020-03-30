define(function(require, exports, module){
  var PlugManagerModel = require('./model');
  var PlugManagerView = Backbone.View.extend({
    plugList: [],
    initialize: function(tpl,plug_tpl) {
      this.template = _.template(tpl);
      this.templateForPlug = _.template(plug_tpl);
      new PlugManagerModel(this);
    },
    render: function() {
      $('body').append(this.template());
    },
    renderPlug: function(data) {
      this.plugList = data.plugList;
      $('#plugManager').html(this.templateForPlug(data));
      this.initEvent();
    },
    initEvent: function() {
      var self = this;
      $('#plugManager button.plug_btn').click(function() {
        var plugName = $(this).attr('data-plugname');
        var plugNameArr = plugName.split(':');

        // 获取当前插件
        var currentPlug = _.find(self.plugList, function(o) {
          return o.name == plugNameArr[0];
        });
        
        self.deactivateOtherPlug(currentPlug);

        if (plugNameArr.length == 1) { // 无子级
          var hasClass = $('button[data-plugname="'+ plugNameArr[0] +'"]').hasClass('active');
          if (hasClass) { //激活
            $('button[data-plugname="'+ plugNameArr[0] +'"]').removeClass('active');
            currentPlug.value.deactivate();
          } else { //未激活
            $('button[data-plugname="'+ plugNameArr[0] +'"]').addClass('active');
            if (currentPlug.isOnce) { // 点击之后状态还原
              $('button[data-plugname="'+ plugNameArr[0] +'"]').removeClass('active');
            }
            currentPlug.value.activate();
          }
        } else { // 有子级
          currentPlug.value.deactivate();
          var hasClass = $('button[data-plugname="'+ plugNameArr[0]+ ':'+ plugNameArr[1]+'"]').hasClass('active')
          if (hasClass) { //激活
            for (var i = 0; i < currentPlug.children.length; i++) {
              var sub = currentPlug.children[i];
              $('button[data-plugname="'+ plugNameArr[0]+ ':'+ sub.type+'"]').removeClass('active');
            }
            $('button[data-plugname="'+ plugNameArr[0] +'"]').removeClass('active');
          } else { //未激活
            for (var i = 0; i < currentPlug.children.length; i++) {
              var sub = currentPlug.children[i];
              $('button[data-plugname="'+ plugNameArr[0]+ ':'+ sub.type+'"]').removeClass('active');
            }
            $('button[data-plugname="'+ plugNameArr[0]+ ':'+ plugNameArr[1]+'"]').addClass('active');
            $('button[data-plugname="'+ plugNameArr[0] +'"]').addClass('active');
            var sub = _.find(currentPlug.children, function(o) {
              return o.type == plugNameArr[1];
            });
            if (sub.isOnce) { // 点击之后状态还原
              $('button[data-plugname="'+ plugNameArr[0]+ ':'+ plugNameArr[1]+'"]').removeClass('active');
            }
            currentPlug.value.activate(plugNameArr[1]);
          }
        }
      })
    },
    deactivateOtherPlug: function(currentPlug) {
      for (let i = 0; i < this.plugList.length; i++) {
        var plug = this.plugList[i];
        if (currentPlug.name == plug.name) continue; // 当前插件状态不改变
        if (currentPlug.isIndependent && currentPlug.isIndependent == true && plug.isIndependent && plug.isIndependent == true) { // 互斥插件
          $('button[data-plugname="'+ plug.name +'"]').removeClass('active');
          if (plug.children && plug.children.length > 0) { // 下拉菜单
            for (let sub of plug.children) {
              $('button[data-plugname="'+ plug.name+ ':'+ sub.type+'"]').removeClass('active');
            }
          }
          plug.value.deactivate();
        }
      }
    },
    deactivateAll: function() {
      for (let i = 0; i < this.plugList.length; i++) {
        var plug = this.plugList[i];
        $('button[data-plugname="'+ plug.name +'"]').removeClass('active');
        if (plug.children && plug.children.length > 0) { // 下拉菜单
          for (let sub of plug.children) {
            $('button[data-plugname="'+ plug.name+ ':'+ sub.type+'"]').removeClass('active');
          }
        }
        plug.value.deactivate();
      }
    }
  });
  module.exports = PlugManagerView;
});