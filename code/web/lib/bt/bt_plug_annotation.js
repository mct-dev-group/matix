var bt_Plug_Annotation = {
	isActive: true,
	annotations: {},
	anno_iter_count: 0,

	Annotation: function (id, shift_x, shift_y) {
		this.id = id;
		this.shift_x = shift_x;
		this.shift_y = shift_y;
		var div = document.createElement("div");
		
		//参数
		let timer = null;
		let click_times = 0;
		let down_x = -1;
		let down_y = -1;
		let down_key = -1;

		div.addEventListener("mousemove", function (event) {
			var bbox = div.getBoundingClientRect();
			event.clientX += bbox.left;
			event.clientY += bbox.top;
			//bt_canvase_onMouseMove(event);
			let loc = bt_event.getPointOnCanvas(bt_canvasgl, event.clientX, event.clientY);
			if (loc.x != down_x || loc.y != down_y) {
				bt_event.km.onMouseMove(loc.x, loc.y);
				event.preventDefault();
				event.stopImmediatePropagation();
	
				if (click_times === 1) {
					bt_event.km.onMouseClick(down_key, down_x, down_y);
				}
				else if (click_times === 2) {
					bt_event.km.onMouseDbClick(down_key, down_x, down_y);
				}
	
				down_key = -1;
				click_times = 0;
				clearTimeout(timer);
			}
		}, false);
		div.addEventListener("mousedown", function (event) {
			var bbox = div.getBoundingClientRect();
			event.clientX += bbox.left;
			event.clientY += bbox.top;
			//bt_canvase_onMouseDown(event);
			let loc = bt_event.getPointOnCanvas(bt_canvasgl, event.clientX, event.clientY);
			bt_event.km.onMouseButtonDown(event.button, loc.x, loc.y);
			event.preventDefault();
			event.stopImmediatePropagation();
			clearTimeout(timer);
			down_x = loc.x;
			down_y = loc.y;
			down_key = event.button;
		}, false);
		div.addEventListener("mouseup", function (event) {
			var bbox = div.getBoundingClientRect();
			event.clientX += bbox.left;
			event.clientY += bbox.top;
			//bt_canvase_onMouseUp(event);
			let loc = bt_event.getPointOnCanvas(bt_canvasgl, event.clientX, event.clientY);
			bt_event.km.onMouseButtonUp(event.button, loc.x, loc.y);
			event.preventDefault();
			event.stopImmediatePropagation();
			clearTimeout(timer);
			if (down_x === loc.x && down_y === loc.y && event.button === down_key) {
				click_times++;
	
				timer = setTimeout(function () {
					if (click_times === 1) {
						bt_event.km.onMouseClick(down_key, down_x, down_y);
					}
					else if (click_times > 1) {
						bt_event.km.onMouseDbClick(down_key, down_x, down_y);
					}
	
					click_times = 0;
					down_key = -1;
				}, 300);
			}
			else {
				down_key = -1;
				click_times = 0;
			}
		}, false);
		div.addEventListener("mousewheel", function (event) {
			var bbox = div.getBoundingClientRect();
			event.clientX += bbox.left;
			event.clientY += bbox.top;
			//bt_canvase_onMouseWheel(event);
			delta = event.wheelDelta ? (event.wheelDelta / 120) : (-event.detail / 3);
			let loc = bt_event.getPointOnCanvas(event.target, event.clientX, event.clientY);
			bt_event.km.onMouseWheel(delta, loc.x, loc.y);
			event.preventDefault();
			event.stopImmediatePropagation();
		}, false);

		div.className = "bt_ui_element";
		var textNode = document.createElement('div');
		div.appendChild(textNode);

		document.getElementById("bt_container").appendChild(div);
		this.textNode = textNode;
		this.div = div;
		this.visible = true;
	},

	refreshAnnotationPos: function (anno) {
		var loc = bt_Util.worldToScreen(anno.x, anno.y, anno.z);
		if (loc.z > 0 && loc.z < 1 && !anno.occlusive) {
			anno.div.style.display = "block";
			anno.div.style.left = Math.floor(loc.x + anno.shift_x) + "px";
			anno.div.style.top = Math.floor(loc.y + anno.shift_y) + "px";
		}
		else {
			anno.div.style.display = "none";
		}
	},
	
	refreshAnnotationOcclusion: function(anno) {
		var c_pt = bt_Util.getCameraParam().cameraPt;
		
		if (anno.near != undefined && anno.far != undefined && anno.far > anno.near){
			var dx = (c_pt.x - anno.x) * (c_pt.x - anno.x);
			var dy = (c_pt.y - anno.y) * (c_pt.y - anno.y) ;
			var dz = (c_pt.z - anno.z) * (c_pt.z - anno.z);
			var d = Math.sqrt(dx + dy + dz);
			if (d < anno.near || d > anno.far){
				anno.occlusive = true;
				return;
			}
		}
		
		if (anno.occlusable){
			if (0 != bt_Util.lineIntersect(c_pt.x, c_pt.y, c_pt.z, anno.x, anno.y, anno.z).intersected) {
				anno.occlusive = true;
			}
			else {
				anno.occlusive = false;
			}
		}
		else {
			anno.occlusive = false;
		}
	},
	
	refreshOcclusion: function () {
		var iter = 0;
		for (var anno in bt_Plug_Annotation.annotations) {
			if (iter == bt_Plug_Annotation.anno_iter_count) {
				bt_Plug_Annotation.refreshAnnotationOcclusion(bt_Plug_Annotation.annotations[anno]);
			}
		}

		bt_Plug_Annotation.anno_iter_count++;
		if (bt_Plug_Annotation.anno_iter_count >= iter) {
			bt_Plug_Annotation.anno_iter_count = 0;
		}
	},

	setAnnotation: function (id, x, y, z, shift_x, shift_y, inner_text, occlusable, near, far) {
		var anno = bt_Plug_Annotation.annotations[id];
		if (!anno) {
			anno = new bt_Plug_Annotation.Annotation(id, shift_x, shift_y);
		}
		anno.x = x;
		anno.y = y;
		anno.z = z;
		anno.textNode.innerHTML = inner_text;
		anno.occlusive = false;
		anno.occlusable = occlusable;
		anno.near = near;
		anno.far = far;
		bt_Plug_Annotation.refreshAnnotationPos(anno);
		bt_Plug_Annotation.annotations[id] = anno;
	},

	removeAnnotation: function (id) {
		var anno = bt_Plug_Annotation.annotations[id];
		if (anno) {
			document.getElementById("bt_container").removeChild(anno.div);
		}
		delete bt_Plug_Annotation.annotations[id];
	},

	on_Render_BeforeRender: function(event_param) {
		for (var anno in bt_Plug_Annotation.annotations) {
			bt_Plug_Annotation.refreshAnnotationPos(bt_Plug_Annotation.annotations[anno]);
		}
	}
}

setInterval("bt_Plug_Annotation.refreshOcclusion()", 20);

bt_event.addEventListener("Render\\BeforeRender", bt_Plug_Annotation.on_Render_BeforeRender);

//设置标注：
//bt_Plug_Annotation.setAnnotation(标注的唯一ID, 标注的空间坐标x, 标注的空间坐标y, 标注的空间坐标z, 标注在屏幕坐标中的x偏移（以像素为单位）, 标注在屏幕坐标中的y偏移（以像素为单位）, 标注的innerHtml, 标注是否进行遮挡测试, 最近显示距离, 最远显示距离);
//bt_Plug_Annotation.setAnnotation("a1", 26.78, -7.67, 49.5, -8, -16, "<div style='background:url(image/DefaultIcon.png); background-position:center left; background-repeat: no-repeat; height:16px;line-height:10px;'><span style='margin-left:16px; font-size:9px; white-space: nowrap;'>" + "水池" + "</span></div>", true);

//删除标注：
//bt_Plug_Annotation.removeAnnotation(标注的唯一ID);