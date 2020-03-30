define(function(require, exports, module){
  const html = require('./tpl.html');
  $('body').append('<div id="messageBoxContainer"></div>')
  let MessageBox=Backbone.View.extend({
    el:'#messageBoxContainer',
    modalId:'msgbox',
    events:{
      'click [data-mydata=msgbox_cancel]':'handelCancel',
      'click [data-mydata=msgbox_confirm]': 'handleConfirm'
    },
    template:_.template(html),
    initialize:function(){
      // console.log(this);
      // this.render();
      // $('body').append('<div id="messageBoxContainer"></div>')
    },
    render:function(data){      
      this.$el.html(this.template({data,modalId:this.modalId}));
      $('#'+this.modalId).on('hidden.bs.modal',function(){        
        $(this).remove();
      })
    },
    confirm:function(message,title,{cancelButtonText='取消',confirmButtonText='确定',backdrop=true,keyboard=true}={}){      
      this.render({message,title,cancelButtonText,confirmButtonText});
      $('#'+this.modalId).modal({backdrop,keyboard});
      return new Promise((resolve,reject)=>{        
        this.resolve=resolve;
        this.reject=reject;
      });
    },
    handleConfirm:function(){
      console.log(this);
      $('#'+this.modalId).modal('hide');
      this.resolve();
    },
    handelCancel:function(){
      $('#'+this.modalId).modal('hide');
      this.reject();
    },
    
  });  
  const msgbox=new MessageBox();  
  module.exports=msgbox;
})