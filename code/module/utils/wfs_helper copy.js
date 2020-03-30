define(function() {
  var WFSHelper = function (option) {
    this.option = option;
    this.getFeature = function(typenames,bbox, callback) {
      let funcArr = []
      for (let typename of typenames.split(',')) {
        funcArr.push(wfsQuery(typename,bbox));
      }
      Promise.all(funcArr).then((dataArr) => {
        if(dataArr) callback(dataArr);
      });
    }
    var self = this;
    function wfsQuery(typename,bbox) {
      const { url, version, serverType } = self.option;
      return new Promise((resolve, reject) => {

        let outputformat = '';
        if (serverType && serverType == 'geoserver') outputformat = '&outputFormat=application/json';

        const urlStr = `${url}?service=WFS&request=GetFeature&version=${version}&typename=${typename}&bbox=${bbox}${outputformat}`;

        $.ajax({
          url: urlStr,
          type: 'get',
          dataType: 'text',
          timeout: 5000,
          success: (data) => {
            if (serverType && serverType == 'geoserver') {
              const gj = JSON.parse(data);
              resolve(gj);
            } else {
              const gmlParser = new GMLParser();
              const gj = gmlParser.gml2Geojson(data);
              resolve(gj);
            }
          },
          error: (error) => {
            reject(error);
            console.log(`wfs服务请求出错！！！`)
          }
        })
      })
    }
  }
  return WFSHelper;
});