define((require, exports, module) => {
    /** 强制刷新 */
    function forceRedraw() {
        bt_Util && bt_Util.executeScript("Render\\ForceRedraw;");
    }
    /**
     * 获取水平面上某点的垂直高度
     * 由主线程计算
     * 工作线程不能直接调用
     */
    function getHeightDirect(x, y) {
        let r = bt_Util.executeScript(`Render\\CameraControl\\LineIntersect ${x} ${y} 9999 ${x} ${y} 0;`).toString().split(' ');
        return (r[3] || 0) * 1;
        // return { x: r[1] * 1, y: r[2] * 1, z: r[3] * 1 }; // 交点坐标
    }
    /** 标注空间某点 */
    function mark(x, y, z, text) {
        bt_Plug_Annotation.setAnnotation(`annotation${Math.random()}`,
            x, y, z,
            -8, -16,
            `<div oncontextmenu='event.preventDefault();' style='background:url(../../../images/DefaultIcon.png);
                background-position:center left; background-repeat: no-repeat; height:16px; line-height:10px;'>
                <span style='margin-left:16px; font-size:9px; white-space: nowrap; user-select: none; color: white;'>` +
            `${text || 'P'} (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})` +
            '</span>' +
            '</div>',
            // 遮挡、能见度
            false, // 10, 100
        );
    }
    /** 
     * 工作线程调用,向主线程发送一定数量的Point
     */
    function postXY(msg_points, Sd) {
        self && self.postMessage({ // 耗时0.1ms~0.4ms
            msg: 'resolve',
            msg_points, Sd
        });
    }
    /** 将Polygon # json()返回的字符串解析为Polygon对象 */
    function parsePolygon(json_or_obj) {
        const { Point, Polygon } = require('./polygon');
        let obj = json_or_obj;
        if (typeof json_or_obj === 'string')
            obj = JSON.parse(json_or_obj);
        let points = [];
        obj.points.forEach(it => {
            points.push(new Point(it.x, it.y, it.z));
        });
        return new Polygon(...points);
    }
    /** 还原压平 */
    function unclipZ() {
        let cmd = `Render\\RenderDataContex\\DataPump\\OsgScene\\SetClipZ 0;`;
        bt_Util.executeScript(cmd);
    }
    /** 
     * 计算土方量
     * @param {number} precision 正数,代表分割成100*n^2个微分小矩形来积分,1代表10万,10代表1000万,但是如果这个数字不满足要求(微分面积大于0.25平方米)时,将自动缩放
     */
    function calcVolume(polygon, height, precision) {
        let html_template = require('./modal.html');
        $(_.template(html_template)()).appendTo('body').modal();
        $('.modal-backdrop.fade.show').css({ 'z-index': 99999 });
        $('#volume_progress').css({ 'z-index': 999999 });
        unclipZ();
        forceRedraw();

        setTimeout(() => {
            let onProgress = _.throttle(event => {
                $('#volume_progress_percent').css({ width: `${event.data.percent}%` });
                // $('#volume_progress_percent').attr({ 'aria-valuenow': event.data.percent });
            }, 80, { leading: true, trailing: true });

            seajs.use('./module/plug/volume/polygon.js', ({ Point, Line, Polygon }) => {
                let json_polygon = polygon.json();
                let worker = new Worker('./module/plug/volume/worker.js'); // 启动工作线程
                ['#volume_progress_btn', '#volume_progress_btn_x'].forEach(it => { // 按钮事件
                    $(it).off('click').on('click', event => {
                    // $(it).on('click', event => {
                        console.log('取消');
                        worker.terminate();
                        $('#volume_progress').remove();
                        $('.modal-backdrop.fade.show').remove();
                    });
                    console.log($(it));
                });
                let S_minus = 0; // 挖方
                let S_plus = 0; // 填方
                let getHeight_n = 0;
                worker.onmessage = event => {
                    switch (event.data.msg) {
                        case 'succeed': {
                            $('#volume_progress_label').text(`计算结果`);
                            $('#volume_progress_btn').text('确定');
                            S_minus = Math.abs(S_minus).toFixed(0);
                            S_plus = Math.abs(S_plus).toFixed(0);
                            console.log({ S_minus, S_plus });
                            $('#volume_progress_msg').html(`<h2 class="text-success">挖方量: ${S_minus} m³<br>填方量: ${S_plus} m³</h2>`);
                            console.log('共求取高度', getHeight_n, '次');
                            console.log('微积分面积', parsePolygon(json_polygon).calcArea_v2(precision));
                            console.log('实际面积', parsePolygon(json_polygon).calcArea(precision));
                            worker.terminate();
                            break;
                        }
                        case 'progress': {
                            // $('#volume_progress_percent').css({ width: `${event.data.percent}%` });
                            onProgress(event);
                            $('#volume_progress_label').text(`正在处理数据...... ${event.data.percent}%`);
                            break;
                        }
                        case 'resolve': {
                            const { msg_points, Sd } = event.data;
                            getHeight_n += msg_points.length;
                            // console.time(msg_points.length);
                            msg_points.forEach(it => {
                                const H_point = getHeightDirect(it.x, it.y);
                                const test = H_point - height;
                                test > 0 ? S_minus += Sd * test : S_plus += Sd * test;
                            });
                            // console.timeEnd(msg_points.length);
                            // 向worker发送通知
                            worker.postMessage({
                                msg: 'resolved',
                            });
                            break;
                        }
                    }
                }; // set onmessage
                worker.postMessage({ // 下达计算指令
                    msg: 'calc',
                    json_polygon,
                    height,
                    precision,
                });
            }); // seajs.use()
        }, 200);
    }
    const DEBUG = false;
    if (DEBUG) {
        window.mark = mark;
        window.parsePolygon = parsePolygon;
    }
    module.exports = {
        getHeightDirect, mark, parsePolygon, calcVolume, postXY, forceRedraw, unclipZ
    };
});