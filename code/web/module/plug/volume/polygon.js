/**
 * 土方量相关的算法和类
 * @author 龙勇
 * @email develon@qq.com
 * @date 2020-08
 */

define((require, exports, module) => {
    const { forceRedraw, getHeightDirect, postXY } = require('./util'); // 导入工具函数

    /**
     * 多边形角坐标
     * 也用来表示向量坐标
     */
    class Point {
        constructor(x, y, z) {
            [this.x, this.y, this.z] = [x, y, z];
        }
        /**
         * @param {Point} anotherLine 
         */
        calcX(anotherLine) {
            const TEST = this.x * anotherLine.y - this.y * anotherLine.x;
            return TEST === 0;
        }
        /**
         * 比较两个点是否近似重合
         * @param {Point} anotherLine 
         * @param {boolean} z 是否判断z值
         */
        equals(anotherLine, z) {
            function Number$isAppro(a = 0, b = 0) {
                // console.log(`Math.abs(${a} - ${b}) < 0.001 = ${Math.abs(a - b) < 0.001}`);
                return Math.abs(a - b) < 0.001;
            }
            return Number$isAppro(this.x, anotherLine.x) && Number$isAppro(this.y, anotherLine.y) && (!z || Number$isAppro(this.z, anotherLine.z));
        }
    }

    class Line {
        /**
         * @param {Point} start 
         * @param {Point} end 
         */
        constructor(start, end) {
            [this.start, this.end] = [start, end];
            // 计算向量坐标
            [this.x, this.y] = [this.end.x - this.start.x, this.end.y - this.start.y];
        }
        /**
         * 判断与另一条直线是否相交
         * @param {Line} anotherLine 
         */
        isIntersectant(anotherLine) {
            const [a, b, c, d] = [this.start, this.end, anotherLine.start, anotherLine.end];
            const area_abc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x); // 三角形abc 面积的2倍  
            const area_abd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x); // 三角形abd 面积的2倍  
            if (area_abc * area_abd >= 0) // 面积符号相同则两点在线段同侧,不相交(对于点在线段上的情况,当作不相交处理)
                return false;
            const area_cda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x); // 三角形cda 面积的2倍  
            // 不需要再用公式计算面积,而是通过已知的三个面积加减得出
            const area_cdb = area_cda + area_abc - area_abd; // 三角形cdb 面积的2倍  
            if (area_cda * area_cdb >= 0)
                return false;
            return true; // 相交
            /*
            // 计算交点坐标
            const t = area_cda / (area_abd - area_abc);
            const [dx, dy] = [t * (b.x - a.x), t * (b.y - a.y)];
            return { x: a.x + dx, y: a.y + dy };
            */
        }
        /**
         * 判断与另一条直线是否相交,并返回交点坐标
         */
        isIntersectant2(anotherLine) {
            const [a, b, c, d] = [this.start, this.end, anotherLine.start, anotherLine.end];
            const area_abc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x); // 三角形abc 面积的2倍  
            const area_abd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x); // 三角形abd 面积的2倍  
            if (area_abc * area_abd >= 0) // 面积符号相同则两点在线段同侧,不相交(对于点在线段上的情况,当作不相交处理)
                return false;
            const area_cda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x); // 三角形cda 面积的2倍  
            // 不需要再用公式计算面积,而是通过已知的三个面积加减得出
            const area_cdb = area_cda + area_abc - area_abd; // 三角形cdb 面积的2倍  
            if (area_cda * area_cdb >= 0)
                return false;
            // 计算交点坐标
            const t = area_cda / (area_abd - area_abc);
            const [dx, dy] = [t * (b.x - a.x), t * (b.y - a.y)];
            return { x: a.x + dx, y: a.y + dy };
        }
        /**
         * 判断与另一条直线是否平行
         * @param {Line} anotherLine 
         */
        isParallel(anotherLine) {
            const TEST = this.x * anotherLine.y - this.y * anotherLine.x;
            return TEST === 0;
        }
        draw() {
            bt_Util.executeScript(`Render\\RenderDataContex\\DynamicFrame\\AddRenderObj line${Math.random()} 4 1 ` +
                `(0,0,0) 8 2 2 (${this.start.x},${this.start.y},${this.start.z || 70},255,0,0,255) (${this.end.x},${this.end.y},${this.end.z || 70},255,0,0,255) (0,1) 0;`);
            forceRedraw();
        }
    }

    /**
     * 多边形
     */
    class Polygon {
        constructor(...points) {
            points.forEach(it => {
                if (!(it instanceof Point)) {
                    throw '多边形Polygon由3个以上的不在一条直线上的点Point构成';
                }
            });
            this.points = [...points];
        }
        /** 克隆出一个新的对象 */
        clone() {
            return new Polygon(...this.points);
        }
        /** 获取各条边的数组 */
        getLines() {
            const RS = [];
            for (let i = 0; i < this.points.length - 1; i++) {
                RS.push(new Line(this.points[i], this.points[i + 1]));
            }
            RS.push(new Line(this.getLastPoint(), this.getFirstPoint()));
            // console.log(`有${RS.length}条边`);
            return RS;
        }
        getFirstPoint() {
            return this.points[0];
        }
        getLastPoint() {
            return this.points[this.points.length - 1];
        }
        /**
         * 加入末端顶点
         * @param {Point} point 
         */
        join(point) {
            if (this.points.length > 0)
                try {
                    const NEW_LINE = new Line(this.getLastPoint(), point);
                    this.getLines().forEach(it => {
                        if (it.isIntersectant(NEW_LINE)) {
                            // console.log(it);
                            throw '不可相交';
                        }
                    });
                } catch (error) {
                    // console.log({ error });
                    return false;
                }
            this.points.push(point);
            return true;
        }
        /**
         * 配合util.js中的parsePolygon()函数,实现Polygon的序列化与反序列化
         * 可用于在线程间传输Polygon对象等
         */
        json() {
            let json = JSON.stringify(this, null, 2);
            // console.log(json);
            return json;
        }
        /**
          * 尝试闭合多边形
          * 只有可以闭合才具有计算面积的意义
          * 参考Z型线,首尾与其它线有交点,就无法闭合,计算面积将为0
          */
        tryClose() {
            if (this.points.length < 3) return false;
            // 复制一个多边形,并join第一个点就可以测试是否闭合
            const TEST = new Polygon(...this.points);
            return TEST.join(TEST.getFirstPoint());
        }
        /**
         * @returns 计算出多边形面积
         */
        calcArea() {
            let [p, Sa, Sb] = [this.points, 0, 0];
            for (let i = 0; i < p.length; i++) {
                // console.log(p[i]);
                if (i < p.length - 1) {
                    Sa += p[i].x * p[i + 1].y;
                    Sb += p[i + 1].x * p[i].y;
                } else {
                    Sa += p[i].x * p[0].y;
                    Sb += p[0].x * p[i].y;
                }
            }
            // console.log('this.calcESWN() :>> ', this.calcESWN());
            // let cmd = `Render\\RenderDataContex\\DataPump\\OsgScene\\SetClipZ ${this.points.length} 0 ${this.getSequence(false)} 0;`;
            return 0.5 * Math.abs(Sa - Sb);
        }
        /** 计算东南西北四角 */
        calcESWN() {
            let [E, S, W, N] = [];
            this.points.forEach(it => {
                if (E === undefined || it.x > E.x) E = it;
                if (S === undefined || it.y < S.y) S = it;
                if (W === undefined || it.x < W.x) W = it;
                if (N === undefined || it.y > N.y) N = it;
            });
            return { E: new Point(E.x, E.y, E.z), S: new Point(S.x, S.y, S.z), W: new Point(W.x, W.y, W.z), N: new Point(N.x, N.y, N.z) };
        }
        /** 将大矩形作为Polygon返回 */
        getRectangle() {
            return new Polygon(...this.calcRectangle());
        }
        /** 
         * 计算东南西北四角(大矩形) 
         * 返回一个Point数组,依次是左上、左下、右下、右上四个角
         */
        calcRectangle() {
            const ESWN = this.calcESWN();
            const { E, S, W, N } = ESWN;
            // console.log('drawHeight', E, S, W, N);
            return [new Point(W.x, N.y), new Point(W.x, S.y), new Point(E.x, S.y), new Point(E.x, N.y)];
        }
        /**
         * 工具方法: 获取顶点序列
         */
        getSequence(points, addZ, customZ, extra) {
            var sequence = '';
            points.forEach(it => {
                sequence += `(${it.x},${it.y}${addZ ? (',' + it.z) : customZ || ''}${extra || ''}) `;
            });
            return sequence;
        }
        /** 从数字start到n-1的序列字符串 */
        nSeq(start, n) {
            var str = '';
            for (let i = start; i < n; i++) {
                str += i + ' ';
            }
            return str;
        }
        /**
         * 高程视觉反馈
         * @param {boolean} check 深度检测
         */
        drawHeight(height, check = true) {
            // 由于只能画三角形,我们通过画两个三角形,把东南西北这个四边形画出来
            const ESWN = this.calcRectangle();
            const [E, S, W, N] = ESWN;
            // console.log('drawHeight', ESWN);
            let cmd = `Render\\RenderDataContex\\DynamicFrame\\AddRenderObj height_a 1 1 (0 0 0) 16 ` +
                `3 3 ${this.getSequence([E, S, W], false, `,${height}`, ' 255 0 0 128')} ${this.nSeq(0, 3)} ${check ? '1' : '0'};`;
            // console.log('drawHeight', cmd);
            bt_Util.executeScript(cmd);
            cmd = `Render\\RenderDataContex\\DynamicFrame\\AddRenderObj height_b 1 1 (0 0 0) 16 ` +
                `3 3 ${this.getSequence([E, W, N], false, `,${height}`, ' 255 0 0 128')} ${this.nSeq(0, 3)} ${check ? '1' : '0'};`;
            // console.log('drawHeight', cmd);
            bt_Util.executeScript(cmd);
            forceRedraw();
        }
        /** 压平 */
        clipZ(height) {
            let cmd = `Render\\RenderDataContex\\DataPump\\OsgScene\\SetClipZ ${this.points.length} ${height} ${this.getSequence(this.points, false)} 0;`;
            bt_Util.executeScript(cmd);
            forceRedraw();
        }
        clipBox() {
            let cmd = `Render\\RenderDataContex\\SetOsgClipBox 4 58 74 547334 3374983 547387 3374983 547387 3375021 547334 3375021;`;
            forceRedraw();
            bt_Util.executeScript(cmd);
        }
        /** 
         * 计算土方量
         * @param height {number} 设计标高高程
         * @param precision {number} 计算精度1~100+
         */
        calcVolume(height, precision, callback) {
            return this.calcVolume_v3(height, precision, callback);
        }
        /**
         * 通过精确度预估计算参数
         * @param {number} height 
         * @param {number} precision 
         */
        infoCalcVolume(precision) {
            const Z = this.getRectangle(); // 约束矩形
            const area_Z = Z.calcArea(); // 约束矩形的面积
            const O = Z.points[1]; // 左下角,作为原坐标 O
            let [width_Z, height_Z] = [Math.abs(Z.points[2].x - Z.points[1].x), Math.abs(Z.points[0].y - Z.points[1].y)]; // Z的宽和高
            // console.log({ width_Z, height_Z });
            // 确定微分
            let [width_dx, height_dx] = [width_Z / 100 / precision, height_Z / 100 / precision];
            // 微分有上限,不允许太大,导致误差骤增
            // n的数量将发生变化
            // while (width_dx > 0.5 || height_dx > 0.5) { // 微分尺寸过大,按比例缩放
                // [width_dx, height_dx] = [width_dx / 2, height_dx / 2];
            // }
            const Sd = width_dx * height_dx; // 微分面积
            const n = Math.pow(precision, 2);
            return { width_dx, height_dx, Sd, n: n < 10000 ? `${n}万` : '1亿' };
        }
        /**
         * 计算土方量 with Worker
         * @param {number} height 
         * @param {number} precision 
         * @param {(progress: number, count: number) => boolean} callback
         */
        calcVolume_v3(height, precision, callback) {
            const task = new Promise((resolve, reject) => {
                const Z = this.getRectangle(); // 约束矩形
                const area_Z = Z.calcArea(); // 约束矩形的面积
                const O = Z.points[1]; // 左下角,作为原坐标 O
                let [width_Z, height_Z] = [Math.abs(Z.points[2].x - Z.points[1].x), Math.abs(Z.points[0].y - Z.points[1].y)]; // Z的宽和高
                // console.log({ width_Z, height_Z });
                // 确定微分
                let [width_dx, height_dx] = [width_Z / 100 / precision, height_Z / 100 / precision];
                // 微分有上限,不允许太大,导致误差骤增
                console.log({ width_dx, height_dx });
                // while (width_dx > 0.5 || height_dx > 0.5) { // 微分尺寸过大,按比例缩放
                    // [width_dx, height_dx] = [width_dx / 2, height_dx / 2];
                // }
                // console.log({ width_dx, height_dx, Sd: width_dx * height_dx });
                let [dx, dy] = [width_dx / 2, height_dx / 2];
                // console.log({ width_dx, height_dx });
                // console.log({ dx, dy });
                // console.log(width_dx * height_dx);
                const Sd = width_dx * height_dx; // 微分面积
                let S_minus = 0; // 挖方
                let S_plus = 0; // 填方
                function sleep(m) { // 消息休眠,提供UI线程计算并刷新进度条的时间,该值应该与precision有关
                    return new Promise((resolve, reject) => {
                        setTimeout(() => resolve(), m);
                    });
                }
                function awaitResolve() {
                    return new Promise((resolve, reject) => {
                        self && (self.postNextXY = resolve);
                    });
                }
                (async () => {
                    for (let x = O.x + dx; x < O.x + width_Z; x += width_dx) {
                        let msg_points = [];
                        // console.log('步进x', x);
                        for (let y = O.y + dy; y < O.y + height_Z; y += height_dx) {
                            // console.log('步进y', y);
                            // console.log(`(${x}, ${y})`, this.in(new Point(x, y)));
                            if (this.in(new Point(x, y))) {
                                // msg_points.push({ x, y }); // 划分要计算高度的点,最后返回Promise
                                // const H_point = getHeightDirect(x, y);
                                // const test = H_point - height;
                                // test > 0 ? S_minus += Sd * test : S_plus += Sd * test;
                                msg_points.push({ x, y });
                                if (msg_points.length > 98) { // 每次向主线程发送N个要处理的点
                                    // 主线程处理该消息耗时情况: 1耗时1.2ms 10耗时3.2ms 100耗时30ms
                                    postXY(msg_points, Sd);
                                    msg_points = [];
                                    // await sleep(40);
                                    await awaitResolve();
                                }
                            }
                        }
                        if (msg_points.length > 0) { //
                            postXY(msg_points, Sd);
                            // await sleep(36);
                            await awaitResolve();
                        }
                        callback && callback(x - O.x, width_Z); // 报告计算进度
                        await sleep(2);
                    }
                    resolve(); // 消息发送完毕
                })();
            });
            return task;
        }
        /**
         * 计算土方量 with Promise
         * @param {number} height 
         * @param {number} precision 
         * @param {(progress: number, count: number) => boolean} callback
         */
        calcVolume_v2(height, precision, callback) {
            const task = new Promise((resolve, reject) => {
                const Z = this.getRectangle(); // 约束矩形
                const area_Z = Z.calcArea(); // 约束矩形的面积
                const O = Z.points[1]; // 左下角,作为原坐标 O
                let [width_Z, height_Z] = [Math.abs(Z.points[2].x - Z.points[1].x), Math.abs(Z.points[0].y - Z.points[1].y)]; // Z的宽和高
                // console.log({ width_Z, height_Z });
                // 确定微分
                let [width_dx, height_dx] = [width_Z / 100 / precision, height_Z / 100 / precision];
                // 微分有上限,不允许太大,导致误差骤增
                console.log({ width_dx, height_dx });
                // while (width_dx > 0.5 || height_dx > 0.5) { // 微分尺寸过大,按比例缩放
                    // [width_dx, height_dx] = [width_dx / 2, height_dx / 2];
                // }
                // console.log({ width_dx, height_dx, Sd: width_dx * height_dx });
                let [dx, dy] = [width_dx / 2, height_dx / 2];
                // console.log({ width_dx, height_dx });
                // console.log({ dx, dy });
                // console.log(width_dx * height_dx);
                const Sd = width_dx * height_dx; // 微分面积
                let S_minus = 0; // 挖方
                let S_plus = 0; // 填方
                function sleep(m) { // 消息休眠,提供UI线程计算并刷新进度条的时间,该值应该与precision有关
                    return new Promise((resolve, reject) => {
                        setTimeout(() => resolve(), m);
                    });
                }
                (async () => {
                    for (let x = O.x + dx; x < O.x + width_Z; x += width_dx) {
                        let msg_points = [];
                        // console.log('步进x', x);
                        for (let y = O.y + dy; y < O.y + height_Z; y += height_dx) {
                            // console.log('步进y', y);
                            // console.log(`(${x}, ${y})`, this.in(new Point(x, y)));
                            if (this.in(new Point(x, y))) {
                                // msg_points.push({ x, y }); // 划分要计算高度的点,最后返回Promise
                                // const H_point = getHeightDirect(x, y);
                                // const test = H_point - height;
                                // test > 0 ? S_minus += Sd * test : S_plus += Sd * test;
                                msg_points.push({ x, y });
                                if (msg_points.length > 98) { // 每次向主线程发送N个要处理的点
                                    // 主线程处理该消息耗时情况: 1耗时1.2ms 10耗时3.2ms 100耗时30ms
                                    postXY(msg_points, Sd);
                                    msg_points = [];
                                    await sleep(40);
                                }
                            }
                        }
                        if (msg_points.length > 0) { //
                            postXY(msg_points, Sd);
                            await sleep(36);
                        }
                        callback && callback(x - O.x, width_Z); // 报告计算进度
                        await sleep(20);
                    }
                    resolve(); // 消息发送完毕
                })();
            });
            return task;
        }
        /**
         * @param {number} height 
         * @param {number} precision 
         * @param {(progress: number, count: number) => boolean} callback
         */
        calcVolume_v1(height, precision, callback) {
            const Z = this.getRectangle(); // 约束矩形
            const area_Z = Z.calcArea(); // 约束矩形的面积
            const O = Z.points[1]; // 左下角,作为原坐标 O
            let [width_Z, height_Z] = [Math.abs(Z.points[2].x - Z.points[1].x), Math.abs(Z.points[0].y - Z.points[1].y)]; // Z的宽和高
            // console.log({ width_Z, height_Z });
            // 确定微分
            let [width_dx, height_dx] = [width_Z / 100 / precision, height_Z / 100 / precision];
            // 微分有上限,不允许太大,导致误差骤增
            console.log({ width_dx, height_dx });
            while (width_dx > 0.5 || height_dx > 0.5) {
                [width_dx, height_dx] = [width_dx / 2, height_dx / 2];
            }
            console.log({ width_dx, height_dx });
            let [dx, dy] = [width_dx / 2, height_dx / 2];
            // console.log({ width_dx, height_dx });
            // console.log({ dx, dy });
            // console.log(width_dx * height_dx);
            const Sd = width_dx * height_dx; // 微分面积
            let S_minus = 0; // 挖方
            let S_plus = 0; // 填方
            for (let x = O.x + dx; x < O.x + width_Z; x += width_dx) {
                // console.log('步进x', x);
                for (let y = O.y + dy; y < O.y + height_Z; y += height_dx) {
                    // console.log('步进y', y);
                    // console.log(`(${x}, ${y})`, this.in(new Point(x, y)));
                    if (this.in(new Point(x, y))) {
                        const H_point = getHeightDirect(x, y);
                        const test = H_point - height;
                        test > 0 ? S_minus += Sd * test : S_plus += Sd * test;
                    }
                }
                // callback && callback(x - O.x, width_Z); // 报告计算进度
            }
            return { plus: Math.abs(S_plus), minus: Math.abs(S_minus) };
        }
        /**
         * 微积分计算面积
         */
        calcArea_v2(precision) {
            const Z = this.getRectangle(); // 约束矩形
            // const area_Z = Z.calcArea(); // 约束矩形的面积
            const O = Z.points[1]; // 左下角,作为原坐标 O
            // console.log({ area_Z });
            let [width_Z, height_Z] = [Math.abs(Z.points[2].x - Z.points[1].x), Math.abs(Z.points[0].y - Z.points[1].y)]; // Z的宽和高
            // console.log({ width_Z, height_Z });
            let [width_dx, height_dx] = [width_Z / 100 / precision, height_Z / 100 / precision];
            let [dx, dy] = [width_dx / 2, height_dx / 2];
            // console.log({ width_dx, height_dx });
            // console.log({ dx, dy });
            // console.log(width_dx * height_dx);
            const Sd = width_dx * height_dx;
            let S = 0;
            for (let x = O.x + dx; x < O.x + width_Z; x += width_dx) {
                // console.log('步进x', x);
                for (let y = O.y + dy; y < O.y + height_Z; y += height_dx) {
                    // console.log('步进y', y);
                    // console.log(`(${x}, ${y})`, this.in(new Point(x, y)));
                    if (this.in(new Point(x, y))) {
                        S += Sd;
                    }
                }
            }
            console.log({ S });
            return S;
        }
        /**
         * 判断point是否为多边形的顶点 
         * @param {Point} point 
         */
        isVertex(point) {
            return this.points.some(it => it.equals(point));
        }
        /**
         * 判断点是否在多边形中
         * @param {Point} point 要测试的点
         */
        in(point) {
            const Z = this.calcRectangle(); // 约束矩形四点
            let lines = this.getLines(); // 施工区域各边
            for (let i = 0; i < 4; i++) { // 将待测点与约束矩形四点分别构建一条直线,与施工区域各边做交叉检测
                if (this.isVertex(Z[i])) { // Z[i]为施工区域的顶点时,不应作为判断依据,直接continue,四个点都是顶点时,直接true
                    // console.log(`Z${i}是顶点`);
                    continue;
                }
                // console.log(`Z${i}不是顶点`);
                let test_line = new Line(point, Z[i]);
                // test_line.draw();
                let test = 0;
                lines.forEach((it, index) => {
                    // console.log({ it, r: test_line.isIntersectant2(it) });
                    // it.draw();
                    if (test_line.isIntersectant(it))
                        test++;
                });
                // console.log({ test });
                if (test % 2 === 0) return false;
                return true;
            }
            return true;
        }
        /**
        * 判断点是否在多边形中
        * @param {Point} point 要测试的点
        * @bug 算法存在漏洞,修复要点: Z[i]为施工区域的顶点时,不应作为判断依据,直接continue,四个点都是顶点时,直接true
        */
        in_version_alpha_0(point) {
            const Z = this.calcRectangle(); // 约束矩形四点
            let lines = this.getLines(); // 施工区域各边
            let count = 0;
            for (let i = 0; i < 4; i++) { // 将待测点与约束矩形四点分别构建一条直线,与施工区域各边做交叉检测
                let test_line = new Line(point, Z[i]);
                test_line.draw();
                let test = 0;
                lines.forEach((it, index) => {
                    console.log({ it, r: test_line.isIntersectant2(it) });
                    it.draw();
                    if (test_line.isIntersectant(it))
                        test++;
                });
                count += test;
                console.log({ test });
                if (test === 0) continue; // 0没有判断价值
                if (test % 2 === 0) return false;
                // return true; // 由于true存在小概率的误判,通过注释该行代码可以优先判断false从而提高精确度,不过这会导致计算量增加
            }
            console.log({ count });
            if (count < 2) return false;
            return true; // 如果不注释上一行return true,那么这里只有一种情况: 约束矩形和施工区域重合,那么所有的点都在其中
        }
        /**
         * 高亮区域
         */
        highLight() {
            let c_info_points = ``; // 各顶点的xy坐标信息, 作为脚本参数
            this.points.forEach(it => {
                c_info_points += ` (${it.x}, ${it.y}) `;
            });
            bt_Util.executeScript(`Render\\RenderDataContex\\SetOsgAttribBox 0 ${/*高亮高度*/9999} #FF00FF ${this.points.length} ${c_info_points};`);
            forceRedraw();
        }
    }

    module.exports = {
        Point, Line, Polygon
    };
}); // define()