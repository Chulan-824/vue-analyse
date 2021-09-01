import { compileToFunction } from "./compiler/index.js";
import { mountComponent } from "./lifecycle.js";
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
    const options = vm.$options
    el = document.querySelector(el);

    // 把模板转换成渲染函数 => 虚拟dom概念 vnode => diff算法 更新虚拟dom => 产生真实节点 更新
    if (!vm.$options.render) {  // 用户可能直接写render方法 暂时是没写的情况
      let template = options.template; // 没有render用template
      if (!template && el) { // 用户也没有传递template 就去el的内容作为模板
        template = el.outerHTML;  // 得到模板的字符串  
        let render = compileToFunction(template)  // 通过编译模块 将得到的模板字符串编译为render函数
        options.render = render
      }
    }
    // options.render 就是渲染函数 调用render方法 渲染成真实dom 替换成页面的内容
    // console.log(options.render);

    // 有了render方法后就要实现组件的挂在 new Vue这个过程就是生成一个组件 组件可以实现一个组件的挂载
    
    mountComponent(vm, el);  // 将vm实例挂载到el上 组件的挂在流程
  }
} 
