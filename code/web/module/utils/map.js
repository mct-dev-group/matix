define(function() {
  var Map = {
    create: function (option) {
      var viewOpt = {};
      if (option.epsg) {
        viewOpt.projection = ol.proj.get(option.epsg);
      }
      if (option.center) {
        viewOpt.center = option.center;
      }
      if (option.zoom) {
        viewOpt.zoom = option.zoom;
      }
      this.map = new ol.Map({
        controls: ol.control.defaults({
          zoom: false,
        }),
        // interactions: ol.interaction.defaults().extend([
        //   new ol.interaction.DragRotateAndZoom()
        // ]),
        view: new ol.View(viewOpt),
        target: option.target
      });
      return this.map;
    },
    getMap: function() {
      return this.map;
    }
  }
  return Map;
});