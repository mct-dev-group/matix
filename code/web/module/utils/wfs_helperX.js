/**
 * WFSHelprX
 * @sp
 */
define(function(require, exports, module){
  // 引入epsg
  var defs = require('./crs-defs.json'); 

  /**
   * WFS助手
   * @param {*} option 
   * @param {string} url
   * @param {string} option.srsName
   */
  var WFSHelperX = function(option) {
    var self = this;
    this.option = option;

    /**
     * 查询features
     * @param {*} params 
     * @param {[string]} params.featureTypes
     * @param {string} params.srsName
     * @param {number} params.startIndex
     * @param {number} params.maxFeatures
     * @param {[string]} params.propertyNames
     * @param {string} params.geometryName
     * @param {ol.extent} params.bbox
     * @param {ol.format.filter} filter 
     */
    this.getFeatures = function (params, callback) {
      wfsQuery(params).then(data => {
        if(data) callback(data);
      });
    }

    /**
     * 根据featureType 分组查询
     * @param {*} params 
     * @param {*} callback 
     */
    this.getFeaturesBySort = function (params, callback) {
      var wfsQueryArr = [];
      var featureTypes = params.featureTypes;
      for (let i = 0; i < featureTypes.length; i++) {
        wfsQueryArr.push(wfsQuery(Object.assign(params, {
          featureTypes: [featureTypes[i]]
        })));
      }
      Promise.all(wfsQueryArr).then(dataArr => {
        if(dataArr) callback(dataArr);
      });
    }

    /**
     * gml3 转 geojson
     * @param {*} xmlStr 
     * @param {*} srsName 
     */
    this.convertGml3ToGeoJSON = function(xmlStr, srsName) {
      xmlStr = xmlStr.replace(/srsName="(.{0,50})"/g, `srsName="${srsName}"`);
      srsName = srsName.toUpperCase();
      if (srsName === 'EPSG:4326') {
        ol.proj.addProjection(new ol.proj.Projection({
          code: 'EPSG:4326',
          axisOrientation: 'enu'}
        ));
      } else {  
        proj4.defs(srsName,defs[srsName]);
        ol.proj.proj4.register(proj4);
      }

      var fg3 = new ol.format.GML3();
      var features = fg3.readFeatures(xmlStr);
      var fg = new ol.format.GeoJSON();
      var geojsonStr = fg.writeFeatures(features);
      return JSON.parse(geojsonStr);
    }

    function wfsQuery(params) {
      return new Promise((resolve, reject) => {
        var frp = {
          featureTypes: params.featureTypes,
          srsName: self.option.srsName,
          outputFormat: 'text/xml; subtype=gml/3.1.1',
          geometryName: self.option.geometryName
        }
        Object.assign(frp, params);
        frp.srsName = frp.srsName.toUpperCase();
  
        var featureRequest = new ol.format.WFS().writeGetFeature(frp);
        var payload = new XMLSerializer().serializeToString(featureRequest);

        $.ajax({
          url: self.option.url,
          type: 'post',
          dataType: 'text',
          contentType: 'text/plain',
          data: payload,
          timeout: 5000,
          success: (data) => {
            resolve(data);
          },
          error: (error) => {
            console.log(`wfs服务请求出错！！！`)
            reject(error);
          }
        })
      });
    }
  }

  return WFSHelperX;
});