import { createElement, createTextElement } from "./vdom/index.js";


export function renderMixin(Vue) {
  Vue.prototype._c = function () {  // _c('div',{id:"app", a:"1"},{}) createElement
    return createElement(this, ...arguments);
  }
  Vue.prototype._v = function (text) { // _v("hello"+_s(name)+"world")} createTextElement
    return createTextElement(this, text);
  }
  Vue.prototype._s = function (val) { // _s(name) stringify
    return JSON.stringify(val);
  }
  Vue.prototype._render = function () {
    const vm = this;
    let render = vm.$options.render;  // 这个render就是我们解析出来的rander方法 同时也有可能是用户写的
    // 后续可以在这判断用户自定义的rander 这里暂时不考虑这种情况
    let vnode = render.call(vm); // 这里运行的时候 会出错 因为我们之前编译code的时候里面有自己定义的_c_v_s函数 所以需要在原型上定义一下(同上)
    return vnode
  }
}