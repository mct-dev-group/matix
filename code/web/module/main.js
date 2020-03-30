// 地图模块
seajs.use('./module/matrix/action', function(action){
  action.start();
});

// seajs.use('./module/ol/action', function(action){
//   action.start();
// });

// 插件管理器
var modules = [
  './module/plug_manager/action',
  './module/plug/measurement/action',
  './module/plug/capture_image/action',
  './module/plug/wms_manage/action',
  './module/plug/buffer_query/action',
  './module/plug/pb_reader/action',
  './module/plug/path/action'
  
  // ol地图
  // './module/plug_ol/draw_vector/action'
];

seajs.use(modules, function(...actions){
  actions.map(function(action){
    action.start();
  });
});

seajs.use('./module/utils/MessageBox/action');
seajs.use('./module/utils/Message/action');

