import Watcher from "./observe/watcher";
import { nextTick } from "./utils";
import { patch } from "./vdom/patch";

export function lifecycleMixin(Vue) {
  Vue.prototype._update = function (vnode) {
    // 这里初始化的时候需要调用 更新的时候也需要调用
    const vm = this;

    vm.$el = patch(vm.$el, vnode); // 比较前后虚拟节点的差异
  }

  Vue.prototype.$nextTick = nextTick;
}

// 后续组件渲染的时候都会有一个watcher
export function mountComponent(vm, el) {
  // 挂载只是实现一个更新函数，当之后组件更新的时候可以再次调用该函数
  let updateComponent = () => {
    // 调用render函数 生成 虚拟dom(vnode)
    vm._update(vm._render());  // 后续更新可以调用updateComponent
    // 在index入口文件 单独定义_update()和_render()的模块
    // 用虚拟dom 生成真实dom
  }
  
  // 观察者模式 属性:被观察者 观察者:刷新页面 —— 所以需要创建一个观察者
  // 观察者模式:被动更新 属性变=>更新 发布订阅模式:主动更新 属性变=>需通知更新
  new Watcher(vm, updateComponent, () => {
    console.log('自定义callback 属性更新了!');
  }, true); // 第4个参数为标识 表示是否是一个渲染watcher 后续还会有其他的watcher

  //updateComponent(); // 第一次挂载 需要先执行一次
}