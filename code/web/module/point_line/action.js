define(function(require, exports, module){
  require('./point.css')
  let PointModel=Backbone.Model.extend({
    defaults: {
      pid:'p',
      count:0,
      points: [],
      lastPoint:null,      
    },
    initialize: function(pid='p') {
      console.log('PointModel');
      this.set('pid',pid);
      this.on('change:lastPoint', function(model,value) {
        let div=value.div;
        $(div).addClass('grab');        
        div.addEventListener('mousedown',this.handleMouseDown.bind(this,value),true);      
        div.addEventListener('mouseup',this.handleMouseUp.bind(this),true);
      });
    },
    handleMouseDown(point,evt){
      console.log(this);      
      let $div=$(evt.currentTarget);
      $div.removeClass('grab').addClass('grabbing');
      $('#bt_container').addClass('grabbing');          
      bt_event.addEventListener("GUIEvent\\KM\\OnMouseMove", this.handleMouseMove.bind(this,{point,ox:evt.offsetX,oy:evt.offsetY,height:$div.height()}));
      evt.stopImmediatePropagation();
    },
    handleMouseUp(evt){
      console.log('mouseup');
      let $div=$(evt.currentTarget);      
      $div.removeClass('grabbing').addClass('grab');
      $('#bt_container').removeClass('grabbing');
      bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", this.handleMouseMove.bind(this));
    },
    handleMouseMove({point,ox,oy,height},ep){
      console.log('move')      
      let {hit,x,y,z}=bt_Util.screenToWorld(ep[0]-ox,ep[1]-oy+height);    
      if(hit===1){
        point.x=x;
        point.y=y;
        point.z=z;
        bt_Util.executeScript(`Render\\ForceRedraw;`);         
      }     
    },
    add({x,y,z},content='<div class="defaultPoint"></div>'){
      let pid=this.get('pid'),count=this.get('count'),points=this.get('points');
      const c=++count,id=pid+'_'+c;      
      bt_Plug_Annotation.setAnnotation(id,x,y,z,-8,-16,content);
      let anno=bt_Plug_Annotation.annotations[id];
      this.set({
        lastPoint:anno,
        points:_.concat(points,anno),
        count:c
      });      
      return {id,anno};
    },
    remove(id){
      let points=this.get('points'),count=this.get('count');
      this.set({
        count:--count,
        points:_.difference(points,[id])
      });
      bt_Plug_Annotation.removeAnnotation(id);
    },
    clear(){
      let points=this.get('points');
      for (const p of points) {
        bt_Plug_Annotation.removeAnnotation(p)
      }
      this.set({
        count:0,
        points:[]
      });
    }
  });
  
 
  let LineModel=PointModel.extend({
    initialize:function(lid='l'){      
      this.set({lid,firstPoint:null})
      console.log('LineModel');   
      this.on('change:firstPoint', function(model,value) {
        console.log(value)
      });
      this.on('change:lastPoint', function(model,value) {
        let div=value.div;
        $(div).addClass('grab');        
        div.addEventListener('mousedown',PointModel.prototype.handleMouseDown.bind(this,value),true);      
        div.addEventListener('mouseup',PointModel.prototype.handleMouseUp.bind(this),true);
      });
    },
    handleMouseMove({point,ox,oy,height},ep){      
      PointModel.prototype.handleMouseMove.call(this,{point,ox,oy,height},ep);
      console.log('move move')
      let points=this.get('points').map(p=>({x:p.x,y:p.y,z:p.z}));      
      // 计算顶点个数
      const vertex_count = points.length;
      // 计算索引个数
      const index_count = vertex_count == 1 ? 1 : 2*(vertex_count -1); 
      // 计算索引
      let indexStr = `(`;
      for (let i = 0; i < vertex_count -1; i++) {        
        const str=(i===vertex_count-2)?`${i},${i+1}`:`${i},${i+1},`;
        indexStr += str;
      }          
      indexStr += `)`;
       // 起始点
      const {x ,y ,z} = points[0];
      let pointStr = ``;
      for (const point of points) {
        pointStr += ` (${point.x - x},${point.y - y},${point.z - z},255,255,0,255)`;
      }
      //渲染线段
      const line_id = 'test_line'
      const scriptStr = `Render\\RenderDataContex\\DynamicFrame\\AddRenderObj ${line_id} 4 1 (${x},${y},${z}) 8 ${vertex_count} ${index_count} ${pointStr} ${indexStr} 0;`;
      bt_Util.executeScript(scriptStr);
      bt_Util.executeScript(`Render\\ForceRedraw;`);

    },
    add({x,y,z},content='<div class="defaultPoint"></div>'){
      console.log(this);
      let fp=this.get('firstPoint');
      let {id,anno}=PointModel.prototype.add.call(this,{x,y,z},content);
      if(fp===null){
        this.set('firstPoint',anno)
      }
      
    }
  });

  module.exports = LineModel;  
})