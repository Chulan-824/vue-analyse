import { initState } from "./state";

// 关于初始化的方法扩展，单独放该文件定义
export function initMixin(Vue) {  // 表示在vue的基础上做一次混合操作
  Vue.prototype._init = function(options) {
    const vm = this; // this指向Vue实例 类似于 var self = this 方便后续实例的使用
    vm.$options = options // 将options挂到vm实例上  后续会对options选项进行扩展

    // 对数据进行初始化 props data computed  watch ... 对数据操作单独提取到state.js文件里
    initState(vm)  // 数据劫持

    if (vm.$options.el) {  // 如果有el 要讲数据挂在到el节点上
      vm.$mount(vm.$options.el);
    }
  }

  Vue.prototype.$mount = function (el) {
    const vm = this;
    el = document.querySelector(el);

    // 把模板转换成渲染函数 => 虚拟dom概念 vnode => diff算法 更新虚拟dom => 产生真实节点 更新
    if (!vm.$options.render) {  // 用户可能直接写render方法 暂时是没写的情况
      let template = options.template; // 没有render用template
    }

    console.log(el);
  }
} 
