define(function(require, exports, module){
  const PathView=require('./view');
  let pathView=new PathView();
  let pathAction = {
    start: function(){
      pathView.initPlug();
    }
  };
  module.exports = pathAction;
})