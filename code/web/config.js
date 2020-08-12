var config = {};

config.totalMemory=1500*1024*1024;
config.clientCacheSize=512; // 设置客户端缓存大小 单位MB
config.nodeLodFactor=1.5; // 设置节点LOD级别系数 默认1.2
config.maxClientRequest=4; // 设置最大同时发起请求的数量
config.aa = 2; //反走样设置 1表示关闭反走样，2表示开启2x反走样

// 底图设置
config.pbUrls = [
  'http://192.168.0.250:12305/qibin/ terrain/terrain.osgb.pb',
  'http://192.168.0.250:12305/qibin/ pb/index.pb'
];
config.cameraParam='524716.835164 3957042.622109 9542.109018 524691.050344 3958982.083228 136.673102 0 1 0';

// 图层管理
config.wmsManageConf = {
  wmsUrl: "http://192.168.0.250:6080/arcgis/services/qibin/qibin/MapServer/WmsServer",
  wfsUrl: "http://192.168.0.250:6080/arcgis/services/qibin/qibin/MapServer/WFSServer",
  geometryName: 'Shape',
  srs: "4547",
  layers: [
    {
      wms: {
        title: "土地类型",
        layer: "0"
      },
      wfs: {
        typename: "qibin_qibin:tudileixin"
      }
    },
    {
      wms: {
        title: "乡镇边界线",
        layer: "1"
      },
      wfs: {
        typename: "qibin_qibin:xiangzhenbianjiexian"
      }
    },
    {
      wms: {
        title: "九州路街道",
        layer: "2"
      },
      wfs: {
        typename: "qibin_qibin:jiuzhoulujiedao"
      }
    },
    {
      wms: {
        title: "金山办事处",
        layer: "3"
      },
      wfs: {
        typename: "qibin_qibin:jinshanbanshichu"
      }
    },
    {
      wms: {
        title: "大赉店镇",
        layer: "4"
      },
      wfs: {
        typename: "qibin_qibin:dalaidianzhen"
      }
    },
    {
      wms: {
        title: "大河涧镇",
        layer: "5"
      },
      wfs: {
        typename: "qibin_qibin:dahejianzhen"
      }
    },
    {
      wms: {
        title: "上峪乡",
        layer: "6"
      },
      wfs: {
        typename: "qibin_qibin:shangyuxiang"
      }
    }
  ]
}

// 缓冲查询
config.bufferQueryConf = {
  url: 'http://192.168.0.250:12307/geoserver/mct6/wfs',
  typename: 'mct6:mct6-d2e50da0-b12e-11ea-a976-99eba35d0dff',
  srs: "4547",
  geometryName: 'geom'
}

// 鹰眼
config.miniMapConf = {
  srs: '4547',
  layers: [
    {
      url: 'http://192.168.0.250:6080/arcgis/services/qibin/qibin/MapServer/WmsServer',
      layer: '1'
    }
  ]
}