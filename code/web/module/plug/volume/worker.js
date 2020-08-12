/**
 * 使用Worker实现土方量的后台计算
 * Seajs不一定支持Worker,我们通过模拟Seajs的功能来实现兼容
 */
class _Module {
    constructor(name) {
        this.exports = {};
    }
}
let modules = {};
/** 注册插件 */
function register(name_script, module) {
    modules[name_script] = module;
}
/** 解析依赖脚本名称 */
function resolve(path_script, name_require_script) {
    if (name_require_script.match(/^\//)) return name_require_script; // 绝对路径
    // 相对路径
    let path = path_script.replace(/(.*\/).*/, '$1') + name_require_script.replace(/^\.\//, '');
    if (!path.match(/.*\.js$/)) {
        path += '.js';
    }
    return path;
}
/**
 * 注册或执行模块
 * @param {*} path_script 
 * @param {*} callback 
 */
function seajs_use(path_script, callback) {
    /**
     * 注册模块
     * @param {() => {}} callback 
     */
    function define(callback) {
        if (modules[path_script]) {
            return modules[path_script];
        }
        const module = new _Module();
        callback(require, module.exports, module);
        register(path_script, module);
    }
    /**
     * 模拟require()函数,根据name_script解析name_requrie_script
     */
    function require(name_require_script) {
        let resolved_name = resolve(path_script, name_require_script);
        let module = modules[resolved_name];
        if (!module) {
            seajs_use(resolved_name);
            module = modules[resolved_name];
        }
        return module.exports;
    }
    self.define = define;
    self.require = require;
    self.window = {};
    importScripts(path_script);
    callback && callback(modules[path_script].exports);
}

// 监听消息
self.onmessage = event => {
    if (event.data.msg === 'calc') {
        // seajs_use('./module/plug/volume/polygon.js', ({ Point, Line, Polygon }) => {
        seajs_use('./polygon.js', ({ Point, Line, Polygon }) => {
            // seajs_use('./module/plug/volume/util.js', ({ parsePolygon }) => {
            seajs_use('./util.js', ({ parsePolygon }) => {
                let polygon = parsePolygon(event.data.json_polygon);
                polygon.calcVolume(event.data.height, event.data.precision, (crt, count) => {
                    let percent = (crt/count*100).toFixed(2);
                    self.postMessage({
                        msg: 'progress',
                        percent,
                    });
                }).then(data => { // polygon.calcVolume() 返回Promise数据
                    console.log('消息分发完毕');
                    self.postMessage({
                        msg: 'succeed',
                        data,
                    });
                })
            });
        });
    } // msg: 'calc'
    if (event.data.msg === 'resolved') { // 主线程完成一次解析
        self.postNextXY && self.postNextXY();
    } // msg: 'resolved'
};