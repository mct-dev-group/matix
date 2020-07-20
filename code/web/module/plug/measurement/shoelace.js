/**
 * 鞋带算法(Shoelace Theorem)
 * 已知平面上任意多边形的各点坐标,以及某一时针顺序(顺时针、逆时针都可),计算该多边形的面积
 * @author 龙勇
 * @email develon@qq.com
 * @date 2020-07
 * @see https://en.wikipedia.org/wiki/Shoelace_formula
 */

define((require, exports, module) => {
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
         * 判断与另一条直线是否平行
         * @param {Line} anotherLine 
         */
        isParallel(anotherLine) {
            const TEST = this.x * anotherLine.y - this.y * anotherLine.x;
            return TEST === 0;
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
        /** 获取各条边的数组 */
        getLines() {
            const RS = [];
            for (let i = 0; i < this.points.length - 1; i++) {
                RS.push(new Line(this.points[i], this.points[i + 1]));
            }
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
        display() {
            console.log(this.points);
        }
        /**
         * 尝试闭合多边形
         * 只有可以闭合才具有计算面积的意义
         * 参考Z型线,首尾与其它线有交点,就无法闭合,计算面积将为0
         */
        tryClose() {
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
            return 0.5 * Math.abs(Sa - Sb);
        }
    }

    module.exports = {
        Point, Line, Polygon
    };
}); // define()