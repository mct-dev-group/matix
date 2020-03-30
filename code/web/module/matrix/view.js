define(function(require, exports, module){
  var MatrixView = Backbone.View.extend({
    img: null,
    cav: null,
    initialize: function(tpl) {
      this.template = _.template(tpl);
    },
    render: function() {
      $('body').append(this.template());
      // 初始化地图
      this.initMatrix();
      this.initCompass();
    },
    initMatrix: function() {
      //初始化bt_a
      on_bt_a_post();
      BT_RenderFrame();
      bt_event.canvasgl_GUI_init();
      bt_Util.executeScript("Render\\RenderDataContex\\DataPump\\SetClientCacheSize 0 256;");
      // bt_Util.executeScript("Render\\RenderDataContex\\DataPump\\OsgScene\\OpenOsgScene mc://http://" + window.location.hostname + ":8020/ gwh/GWH.osgb.pb;");
      // bt_Util.executeScript("Render\\Camera\\JumpTo 547300.000000 3374948.750000 431.889771;");

      bt_Util.executeScript("Render\\RenderDataContex\\DataPump\\OsgScene\\OpenOsgScene mc://http://" + window.location.hostname + ":8030/terrain/ wh.osgb.pb;");
      bt_Util.executeScript("Render\\Camera\\JumpTo 539461.366484 3372741.78599 990 539444.87149 3373056.529219 100;");
    },
    initCompass: function() {
      this.img = new Image();
      this.img.src = './../../images/compass.png';

      this.canvas = document.createElement('canvas');
      this.cav = this.canvas.getContext('2d');

      document.getElementById("compassBox").appendChild(this.canvas);

      bt_event.addEventListener("Render\\FinalBlend", this.onRenderFinalBlend.bind(this));
    },
    onRenderFinalBlend: function () {
      this.canvas.width = this.img.width;
      this.canvas.height = this.img.height;

      let cam_param = bt_Util.getCameraParam();
      let dx = cam_param.lookatPt.x - cam_param.cameraPt.x;
      let dy = cam_param.lookatPt.y - cam_param.cameraPt.y;
      let dz = cam_param.lookatPt.z - cam_param.cameraPt.z;
      if (dx == 0 && dy == 0) {
        dx = cam_param.upVec.x;
        dy = cam_param.upVec.y;
        if (dz > 0) {
          dy = -dy;
          dx = -dx;
        }
      }
      let rot = -Math.PI / 2 + Math.atan2(dy, dx);
      
      // this.cav.save();
      // this.cav.translate(this.img.width / 2, this.img.height / 2);
      // this.cav.rotate(rot);
      // this.cav.drawImage(this.img, -this.img.width/2, -this.img.height/2);
      // this.cav.restore();

      this.cav.translate(this.img.width / 2, this.img.height / 2);
      this.cav.rotate(rot);
      this.cav.drawImage(this.img, -this.img.width/2, -this.img.height/2);
    },
  });
  module.exports = MatrixView;
});