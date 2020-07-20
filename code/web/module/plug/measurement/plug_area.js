/**
 * 插件: 面积测量
 * @author 龙勇
 * @email develon@qq.com
 * @date 2020-07
 */
define((require, exports, module) => {
    const msg = require('../../utils/Message/action'); // 提示框
    const { Point, Line, Polygon } = require('./shoelace'); // 加载面积计算相关类
    const bt_plug_area = { // 存储面积计算相关数据
        fields: {
            data: {
                polygon: new Polygon(),
            },
            pause: false,
        },
        methods: {}
    };
    const DATA = bt_plug_area.fields['data'];
    const POLYGON = DATA.polygon; // 建立多边形对象的常引用
    const POINTS = POLYGON.points; // 标点数组的常引用

    // 初始化 bt_plug_area 并导出
    function init_plugin_area() {
        bt_plug_area.activate = active;
        bt_plug_area.deactivate = deactive;
        return bt_plug_area;
    }

    /**
     * 激活面积测量功能
     */
    function active() {
        DATA.pause = false;
        show_result(0);
        // 启用插件时的鼠标单击事件
        bt_plug_area.methods['area_calculate_click_event'] = ([type, x, y]) => { // type: 0 1 2 分别代表鼠标左中右键  x,y: 代表被单击的屏幕坐标
            // console.log({ type, x, y });
            let wp = bt_Util.screenToWorld(x, y); // 屏幕坐标转换到世界坐标
            if (wp.hit !== 1) return console.log('未命中事物'); // 未命中事物时, 忽略该次点击事件
            switch (type) { // 判断鼠标键, 从而决定是下点还是取消上一次下点
                case 0: { // 单击鼠标左键
                    try {
                        // console.log('当前☞', POLYGON.points.length);
                        const LAST_POINT = POLYGON.getLastPoint();
                        const FIRST_POINT = POLYGON.getFirstPoint();
                        const JOIN = POLYGON.join(new Point(wp.x, wp.y, wp.z)); // 尝试加入该世界坐标为顶点
                        if (!JOIN) {
                            // bt_PlugManager.$message.error("不可与之前的线段相交！请重新下点。");
                            msg.error("不可与之前的线段相交！请重新下点。");
                            return;
                        }
                        // console.log(wp);
                        // 添加标注
                        bt_Plug_Annotation.setAnnotation(`annotation${POLYGON.points.length}`,
                            wp.x, wp.y, wp.z,
                            -8, -16,
                            `<div oncontextmenu='event.preventDefault();' style='background:url(../../../images/DefaultIcon.png); background-position:center left; background-repeat: no-repeat; height:16px;
                            line-height:10px;'><span style='margin-left:16px; font-size:9px; white-space: nowrap; user-select: none; ${LAST_POINT === undefined ? 'color: white;' : ''}'>` +
                            // `${LAST_POINT === undefined ? '起点' : `${POINTS.length}号标`} (${wp.x.toFixed(2)}, ${wp.y.toFixed(2)}, ${wp.z.toFixed(2)})` + "</span></div>",
                            `${LAST_POINT === undefined ? '1' : `${POINTS.length}`}` + "</span></div>",
                            // 遮挡、能见度
                            false, // 10, 100
                        );
                        // 添加线段
                        if (LAST_POINT !== undefined) { // 如果是第一个点, 那么就无需绘制线段
                            // console.log({ LAST_POINT });
                            bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\AddRenderObj line${POLYGON.points.length} 4 1 ` +
                                `(0,0,0) 8 2 2 (${LAST_POINT.x},${LAST_POINT.y},${LAST_POINT.z},255,0,0,255) (${wp.x},${wp.y},${wp.z},255,0,0,255) (0,1) 0;`);
                            // 测试是否可以闭合, 如果可以, 则添加首尾顶点的线段, 并计算出面积显示在屏幕上
                            testClose();
                        }
                    } catch (error) {
                        console.log(error);
                    } // try 结束
                    // 强制重绘
                    forceRedraw();
                    break;
                } // case 0 结束
                case 2: {
                    undo();
                    break;
                } // case 2 结束
            } // switch 结束
        }; // bt_plug_area.methods['area_calculate_click_event'] 事件结束
        bt_event.addEventListener("GUIEvent\\KM\\OnMouseClick", bt_plug_area.methods['area_calculate_click_event']);
        bt_plug_area.methods['area_calculate_move_event'] = ([x, y]) => { // type: 0 1 2 分别代表鼠标左中右键  x,y: 代表屏幕坐标
            let wp = bt_Util.screenToWorld(x, y); // 屏幕坐标转换到世界坐标
            if (POINTS.length < 1) return;
            const LAST_POINT = POLYGON.getLastPoint();
            const FIRST_POINT = POLYGON.getFirstPoint();
            bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\AddRenderObj test_line_A 4 1 ` +
                `(0,0,0) 8 2 2 (${LAST_POINT.x},${LAST_POINT.y},${LAST_POINT.z},255,255,0,255) (${wp.x},${wp.y},${wp.z},255,255,0,255) (0,1) 0;`);
            const TEST_POLYGON = new Polygon(...POINTS);
            if (TEST_POLYGON.join(new Point(wp.x, wp.y, wp.z)) && TEST_POLYGON.tryClose()) {
                bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\AddRenderObj test_line_B 4 1 ` +
                    `(0,0,0) 8 2 2 (${FIRST_POINT.x},${FIRST_POINT.y},${FIRST_POINT.z},255,255,0,255) (${wp.x},${wp.y},${wp.z},255,255,0,255) (0,1) 0;`);
            } else {
                bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj test_line_B 8;`);
            }
            forceRedraw();
        }
        bt_event.addEventListener("GUIEvent\\KM\\OnMouseMove", bt_plug_area.methods['area_calculate_move_event']);
        // 面积测量时的键盘事件监听
        $(document).off('keydown').on('keydown', e => {
            let keyCode = e.keyCode || e.which || e.charCode;
            let ctrlKey = e.ctrlKey || e.metaKey;
            if (ctrlKey && keyCode === 90) { // Control + Z
                undo();
                return false;
            } else if (ctrlKey && keyCode === 68) { // Control + D
                // 清楚数据, 通过注销后重新启用实现
                deactive(0);
                active();
                return false;
            } else if (keyCode === 32) { // 空格
                if (DATA.pause === false) { // 暂停下点
                    bt_event.removeEventListener("GUIEvent\\KM\\OnMouseClick", bt_plug_area.methods['area_calculate_click_event']);
                    bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", bt_plug_area.methods['area_calculate_move_event']);
                    bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj test_line_A 8;`);
                    bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj test_line_B 8;`);
                    forceRedraw();
                    DATA.pause = true;
                    $('#area_switch').text('继续测量');
                } else {
                    bt_event.addEventListener("GUIEvent\\KM\\OnMouseClick", bt_plug_area.methods['area_calculate_click_event']);
                    bt_event.addEventListener("GUIEvent\\KM\\OnMouseMove", bt_plug_area.methods['area_calculate_move_event']);
                    DATA.pause = false;
                    $('#area_switch').text('暂停测量');
                }
                return false;
            }
        });
    } // area_calculate() 函数结束

    /**
     * 关闭测量功能
     * @param code {Number} -2删除, -1禁用
     */
    function deactive(code) {
        // 移除事件监听
        bt_event.removeEventListener("GUIEvent\\KM\\OnMouseClick", bt_plug_area.methods['area_calculate_click_event']);
        bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", bt_plug_area.methods['area_calculate_move_event']);
        // 删除注释
        const POINTS = bt_plug_area.fields['data'].polygon.points;
        while (POINTS.length > 0) {
            bt_Plug_Annotation.removeAnnotation(`annotation${POINTS.length}`);
            bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj line${POINTS.length} 8;`);
            bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj close_line 8;`);
            POINTS.pop();
        }
        // 删除测试线
        bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj test_line_A 8;`);
        bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj test_line_B 8;`);
        // 删除区域高亮
        bt_Util.executeScript(`Render\\RenderDataContex\\SetOsgAttribBox 0 0 error_color 0;`);
        // 删除结果显示
        show_result(code || -2);
        forceRedraw();
        $(document).off('keydown');
    }

    /**
     * 测试是否可以闭合, 如果可以, 则添加首尾顶点的线段, 并计算出面积显示在屏幕上
     */
    function testClose() {
        const LAST_POINT = POLYGON.getLastPoint();
        const FIRST_POINT = POLYGON.getFirstPoint();
        if (POLYGON.points.length > 2 && POLYGON.tryClose()) {
            show_result(POLYGON.calcArea().toFixed(2));
            // 闭合线
            bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\AddRenderObj close_line 4 1 ` +
                `(0,0,0) 8 2 2 (${LAST_POINT.x},${LAST_POINT.y},${LAST_POINT.z},255,0,0,255) (${FIRST_POINT.x},${FIRST_POINT.y},${FIRST_POINT.z},255,0,0,255) (0,1) 0;`);
            // `(0,0,0) 8 2 2 (${wp.x},${wp.y},${wp.z},0,128,0,255) (${FIRST_POINT.x},${FIRST_POINT.y},${FIRST_POINT.z},0,128,0,255) (0,1) 0;`);
            // 建筑高亮
            let height = 0; // 计算最高点的高度
            let c_info_points = ``; // 各顶点坐标信息, 作为脚本参数
            POINTS.forEach(it => {
                if (it.z > height) height = it.z;
                c_info_points += ` (${it.x}, ${it.y}) `;
            });
            bt_Util.executeScript(`Render\\RenderDataContex\\SetOsgAttribBox 0 ${height * 100} #FF00FF ${POINTS.length} ${c_info_points};`);
            // bt_Util.executeScript(`Render\\RenderDataContex\\SetOsgAttribBox 0 ${height * 100} rgb(255,0,255) ${POINTS.length} ${c_info_points};`);
        } else { // 如果不可以闭合, 那么可能需要删除之前的闭合线和高亮
            bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj close_line 8;`);
            bt_Util.executeScript(`Render\\RenderDataContex\\SetOsgAttribBox 0 0 error_color 0;`);
            // 取消上次的结果显示
            // $('#area_result').remove();
            show_result(-1);
        }
    }

    /**
     * 撤销上一个点, 快捷键: 鼠标右键或Ctrl+Z
     */
    function undo() {
        try {
            // console.log('当前☞', POLYGON.points.length);
            bt_Plug_Annotation.removeAnnotation(`annotation${POLYGON.points.length}`);
            bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj line${POLYGON.points.length} 8;`);
            bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj close_line 8;`);
            // 删除区域高亮
            bt_Util.executeScript(`Render\\RenderDataContex\\SetOsgAttribBox 0 0 error_color 0;`);
            // 删除测试线
            bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj test_line_A 8;`);
            bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj test_line_B 8;`);
            // 取消上次的结果显示
            // $('#area_result').remove();
            show_result(-1);
        } catch (error) {
            console.log(error);
        }
        // 确保弹出末端顶点
        POLYGON.points.pop();
        // 强制重绘
        forceRedraw();
        testClose(); // 每次撤销都测试一下闭合
    }

    /**
     * 强制重绘
     */
    function forceRedraw() {
        bt_Util.executeScript("Render\\ForceRedraw;");
    }

    let html_template = require('./area.html');
    let old_size = 0;
    /**
     * 显示计算结果
     * @param result {Number} 面积大小. 特殊值: -2删除显示组件, -1禁用(禁用时显示上一次结果)
     */
    function show_result(result) {
        console.log({ result, old_size });
        let $div_area = $('#div_area');
        switch (result) {
            case -2: {
                old_size = 0;
                return $div_area.remove();
            }
            case -1: {
                result = -1;
                break;
            }
            default: {
                old_size = result;
            }
        }
        let html = _.template(html_template)({ size: result, old_size, pause: DATA.pause});
        if ($div_area.length < 1) {
            $(html).appendTo('body');
        } else {
            $div_area.html(html);
        }
    }

    module.exports = {
        init_plugin_area,
    };
});