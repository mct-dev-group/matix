define(function(require, exports, module){
  require('./tpl.css');
  let html=require('./tpl.html');
  $('body').append('<div id="messageContainer"></div>');
  let Message=Backbone.View.extend({
    el:'#messageContainer',
    alertId:'msg',
    template:_.template(html),
    render:function(data){      
      this.$el.html(this.template({data,alertId:this.alertId}));      
      $('#'+this.alertId).fadeIn();
      setTimeout(()=>{
        $('#'+this.alertId).fadeOut(400,()=>{
          $('#'+this.alertId).alert('close');
        });        
      },3000)
    },
    success:function(msg){
      this.render({msg,type:'success',icon:'check-circle'});      
    },
    error:function(msg){
      this.render({msg,type:'danger',icon:'times-circle'});      
    },
    warning:function(msg){
      this.render({msg,type:'warning',icon:'exclamation-circle'});      
    },
    info:function(msg){
      this.render({msg,type:'info',icon:'info-circle'});     
    }
  });
  const message=new Message();
  module.exports=message;
})