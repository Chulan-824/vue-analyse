import { mergeOptions } from "../utils";

export function initGlobalApi(Vue) {
  Vue.options = {}; // 用来存放全局的配置 每个组件初始化的时候都会和options选项进行合并
  // Vue.component
  // Vue.filter
  // Vue.directive
  Vue.mixin = function (options) {
    // 第一次调用 {} {beforCreate:fn1} => {beforCreate:[fn1]}
    // 第二次调用 {beforCreate:[fn1]} {beforCreate:fn2} => {beforCreate:[fn1,fn2]}
    this.options = mergeOptions(this.options, options) // 公共配置 用户传入配置(组件配置)
    console.log(this.options);
    return this;
  }
}