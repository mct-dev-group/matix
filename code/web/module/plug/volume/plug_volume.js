/**
 * 插件: 土方量
 * @author 龙勇
 * @email develon@qq.com
 * @date 2020-08
 */
define((require, exports, module) => {
    const { forceRedraw, parsePolygon, calcVolume, unclipZ } = require('./util');
    const msg = require('../../utils/Message/action'); // 提示框
    const { Point, Line, Polygon } = require('./polygon'); // 加载计算相关类
    const bt_plug_volume = { // 存储计算相关的数据
        fields: {
            data: {
                polygon: new Polygon(),
            },
            pause: false,
            close: false,
        },
        methods: {}
    };
    const DATA = bt_plug_volume.fields['data'];
    const POLYGON = DATA.polygon; // 建立多边形对象的常引用
    const POINTS = POLYGON.points; // 标点数组的常引用
    window.P = POLYGON;
    window.Polygon = Polygon;

    // 初始化 bt_plug_volume 并导出
    function init_plugin_volume() {
        bt_plug_volume.activate = active;
        bt_plug_volume.deactivate = deactive;
        return bt_plug_volume;
    }

    /**
     * 激活测量功能
     */
    function active(isPrevious) {
        if (!isPrevious) {
            DATA.pause = false;
            DATA.close = false;
        }
        show_result(0);
        // 启用插件时的鼠标单击事件
        bt_plug_volume.methods['volume_calculate_click_event'] = ([type, x, y]) => { // type: 0 1 2 分别代表鼠标左中右键  x,y: 代表被单击的屏幕坐标
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
                            // 测试是否可以闭合, 如果可以, 则添加首尾顶点的线段
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
        }; // bt_plug_volume.methods['volume_calculate_click_event'] 事件结束
        bt_event.addEventListener("GUIEvent\\KM\\OnMouseClick", bt_plug_volume.methods['volume_calculate_click_event']);
        bt_plug_volume.methods['volume_calculate_move_event'] = ([x, y]) => { // type: 0 1 2 分别代表鼠标左中右键  x,y: 代表屏幕坐标
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
        bt_event.addEventListener("GUIEvent\\KM\\OnMouseMove", bt_plug_volume.methods['volume_calculate_move_event']);
        // 测量时的键盘事件监听
        $(document).off('keydown').on('keydown', e => {
            let keyCode = e.keyCode || e.which || e.charCode;
            let ctrlKey = e.ctrlKey || e.metaKey;
            if (ctrlKey && keyCode === 90) { // Control + Z
                undo();
                return false;
            } else if (ctrlKey && keyCode === 68) { // Control + D
                // 清除数据, 通过注销后重新启用实现
                deactive(0);
                active();
                return false;
            } else if (keyCode === 32) { // 空格
                if (DATA.pause === false) { // 暂停下点
                    bt_event.removeEventListener("GUIEvent\\KM\\OnMouseClick", bt_plug_volume.methods['volume_calculate_click_event']);
                    bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", bt_plug_volume.methods['volume_calculate_move_event']);
                    bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj test_line_A 8;`);
                    bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj test_line_B 8;`);
                    forceRedraw();
                    DATA.pause = true;
                    $('#volume_switch').text('继续选择');
                } else {
                    bt_event.addEventListener("GUIEvent\\KM\\OnMouseClick", bt_plug_volume.methods['volume_calculate_click_event']);
                    bt_event.addEventListener("GUIEvent\\KM\\OnMouseMove", bt_plug_volume.methods['volume_calculate_move_event']);
                    DATA.pause = false;
                    $('#volume_switch').text('暂停选择');
                }
                return false;
            } else if (keyCode === 70) { // F
                bt_event.addEventListener("GUIEvent\\KM\\OnMouseClick", ([type, x, y]) => {
                    let wp = bt_Util.screenToWorld(x, y); // 屏幕坐标转换到世界坐标
                    let p = new Point(wp.x, wp.y, wp.z);
                    console.log(POLYGON.in(p));
                });
            } else if (e.key === 'v') {
                POLYGON.drawHeight();
                forceRedraw();
            } else if (e.key === 'c') {
                calcVolume(POLYGON, 60, 1);
                // let v = POLYGON.calcVolume(60, 1, (progress, count) => {
                    // console.log({ progress, count });
                // });
                // console.log({ '计算结果': v });
            } else if (e.key === 'Enter') {
                if (DATA.close) {
                    bt_plug_volume.methods['volume-panel-1-btn-next'] && bt_plug_volume.methods['volume-panel-1-btn-next']();
                } else {
                    msg.error("请先选择施工区域");
                }
            }
        });
    } // volume_calculate() 函数结束

    /**
     * 关闭测量功能
     * @param code {Number} -2删除, -1禁用
     */
    function deactive(code) {
        // 移除事件监听
        bt_event.removeEventListener("GUIEvent\\KM\\OnMouseClick", bt_plug_volume.methods['volume_calculate_click_event']);
        bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", bt_plug_volume.methods['volume_calculate_move_event']);
        // 删除注释
        const POINTS = bt_plug_volume.fields['data'].polygon.points;
        while (POINTS.length > 0) {
            bt_Plug_Annotation.removeAnnotation(`annotation${POINTS.length}`);
            bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj line${POINTS.length} 8;`);
            bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj close_line 8;`);
            POINTS.pop(); // 清空了上一次的POLYGON数据
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
     * 测试是否可以闭合, 如果可以, 则添加首尾顶点的线段
     */
    function testClose() {
        const LAST_POINT = POLYGON.getLastPoint();
        const FIRST_POINT = POLYGON.getFirstPoint();
        DATA.close = POLYGON.tryClose();
        // if (POLYGON.points.length > 2 && DATA.close) {
        if (DATA.close) {
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
            // POLYGON.clipZ();
            // POLYGON.drawHeight();
            // forceRedraw();
        } else { // 如果不可以闭合, 那么可能需要删除之前的闭合线和高亮
            bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj close_line 8;`);
            bt_Util.executeScript(`Render\\RenderDataContex\\SetOsgAttribBox 0 0 error_color 0;`);
            // 取消上次的结果显示
            // $('#volume_result').remove();
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
            // $('#volume_result').remove();
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

    let html_template = require('./panel.html');
    /**
     * 刷新控制面板
     * @param result {Number} 面板控制. 特殊值: -2删除控制面板
     */
    function show_result(result) {
        // console.log({ result, old_size });
        let $div_panel = $('#volume-panel');
        switch (result) {
            case -2: {
                return $div_panel.remove();
            }
        }
        let html = _.template(html_template)({ pause: DATA.pause, close: DATA.close });
        if ($div_panel.length < 1) { // 找不到#volume-panel-1,添加
            $(html).appendTo('body');
        } else { // 刷新#volume-panel-1,这会导致display
            $div_panel.html(html);
        }
        if (DATA.close) { // 为按钮"下一步"添加事件
            $('#volume-panel-1-btn-next').off('click').on('click', (bt_plug_volume.methods['volume-panel-1-btn-next'] || (bt_plug_volume.methods['volume-panel-1-btn-next'] = () => {
                $(document).off('keydown'); // 取消按键监听
                // 移除事件监听
                bt_event.removeEventListener("GUIEvent\\KM\\OnMouseClick", bt_plug_volume.methods['volume_calculate_click_event']);
                bt_event.removeEventListener("GUIEvent\\KM\\OnMouseMove", bt_plug_volume.methods['volume_calculate_move_event']);
                // 删除测试线
                bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj test_line_A 8;`);
                bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\DelRenderObj test_line_B 8;`);
                forceRedraw();
                $(`#volume-panel-1, #volume-panel-2`).toggle();

                // 进入下一步: "输入高程", POLYGON确定
                // 为按钮"上一步"添加事件处理
                let $previous = $('#volume-panel-2-btn-previous');
                $previous.off('click').on('click', (bt_plug_volume.methods['volume-panel-2-btn-previous'] || (bt_plug_volume.methods['volume-panel-2-btn-previous'] = () => {
                    active('previous');
                    // 还原压平、高程视觉反馈
                    unclipZ();
                    let cmd = `Render\\RenderDataContex\\DynamicFrame\\DelRenderObj height_a 8;`;
                    bt_Util.executeScript(cmd);
                    cmd = `Render\\RenderDataContex\\DynamicFrame\\DelRenderObj height_a 16;`;
                    bt_Util.executeScript(cmd);
                    cmd = `Render\\RenderDataContex\\DynamicFrame\\DelRenderObj height_b 8;`;
                    bt_Util.executeScript(cmd);
                    cmd = `Render\\RenderDataContex\\DynamicFrame\\DelRenderObj height_b 16;`;
                    bt_Util.executeScript(cmd);
                    POLYGON.highLight();
                    forceRedraw();
                })));

                let $volumePanelHeight = $('#volume-panel-height'); // "输入高程"控制面板

                let $drawHeight = $('#draw-height'); // 高程"视觉反馈"按钮
                $drawHeight.off('click').on('click', () => {
                    let height = $volumePanelHeight.get(0).value; // 用户输入的高程值
                    console.log('绘制高度', height);
                    bt_Util.executeScript(`Render\\RenderDataContex\\SetOsgAttribBox 0 0 error_color 0;`); // 取消区域高亮
                    POLYGON.drawHeight(height);
                    forceRedraw();
                })

                let $clipZ = $('#clip-z'); // "压平"按钮
                $clipZ.off('click').on('click', () => {
                    let height = $volumePanelHeight.get(0).value; // 用户输入的高程值
                    bt_Util.executeScript(`Render\\RenderDataContex\\SetOsgAttribBox 0 0 error_color 0;`); // 取消区域高亮
                    POLYGON.clipZ(height);
                    forceRedraw();
                });

                let $calcPolygonVolume = $('#calc-polygon-volume'); // "开始计算"按钮
                $calcPolygonVolume.off('click').on('click', () => {
                    let height = $volumePanelHeight.get(0).value; // 用户输入的高程值
                    if (height === '') {
                        msg.error("请输入高程值");
                        return;
                    }
                    let precision = $(`#volume-panel-2-precision-text`).attr('value');
                    calcVolume(POLYGON, height * 1, precision * 1);
                });

                let $volumePanelPrecision = $('#volume-panel-2-precision');
                let $info = $("#volume-panel-info");
                $volumePanelPrecision.off('input').on('input', event => {
                    let precision = $(`#volume-panel-2-precision-text`).attr('value');
                    show_precision_info(precision);
                });

                function show_precision_info(precision) {
                    let { width_dx, height_dx, Sd, n } = POLYGON.infoCalcVolume(precision);
                    width_dx *= 100; // 单位换算为cm
                    height_dx *= 100;
                    Sd *= 10000;
                    $info.html(`通过将区域微分为${n}个规格为<br>${width_dx.toFixed(2)}cm x ${height_dx.toFixed(2)}cm = ${Sd.toFixed(2)}cm²<br>的矩形进行积分运算。`);
                }

                show_precision_info(10); // 默认精度为10, 显示相关信息
            })));
        }
    }

    module.exports = {
        init_plugin_volume,
    };
});