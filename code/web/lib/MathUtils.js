function DistanceOf3D(a={x:0,y:0,z:0},b={x:0,y:0,z:0}){
  const {x:x1,y:y1,z:z1}=a,{x:x2,y:y2,z:z2}=b;
  return Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2)+Math.pow(z1-z2,2));
}
function DistanceOf2D(a,b){
  let x1,y1,x2,y2;
  if(Array.isArray(a)){    
    x1=a[0];
    y1=a[1];
  }else{    
    x1=a.x;
    y1=a.y
  }
  if(Array.isArray(b)){    
    x2=b[0];
    y2=b[1];
  }else{    
    x2=b.x;
    y2=b.y
  }  
  return Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
}
//点到线段的最短距离以及坐标
function PointToSegmentDistance(p={x,y},p1={x,y},p2={x,y}){
  const {x,y}=p,{x:x1,y:y1}=p1,{x:x2,y:y2}=p2;
  const cross =(x-x1)*(x2-x1)+(y-y1)*(y2-y1);
  if(cross <= 0) return {d:DistanceOf2D(p,p1),p:{x:x1,y:y1}};

  const d2=(x1-x2)*(x1-x2)+(y1-y2)*(y1-y2);
  if(cross >= d2) return {d:DistanceOf2D(p,p2),p:{x:x2,y:y2}};

  const r=cross/d2;
  const px = x1 + (x2 - x1) * r;
  const py = y1 + (y2 - y1) * r;
  return {d:DistanceOf2D(p,{x:px,y:py}),p:{x:Math.floor(px),y:Math.floor(py)}};
}