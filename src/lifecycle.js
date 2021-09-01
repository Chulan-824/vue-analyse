import { patch } from "./vdom/patch";

export function lifecycleMixin(Vue) {
  Vue.prototype._update = function (vnode) {
    // 这里初始化的时候需要调用 更新的时候也需要调用
    const vm = this;

    patch(vm.$el, vnode); // 比较前后虚拟节点的差异
  }
}

export function mountComponent(vm, el) {
  // 挂载只是实现一个更新函数，当之后组件更新的时候可以再次调用该函数
  let updateComponent = () => {
    // 调用render函数 生成 虚拟dom(vnode)
    vm._update(vm._render());  // 后续更新可以调用updateComponent
    // 在index入口文件 单独定义_update()和_render()的模块
    // 用虚拟dom 生成真是dom
   
  } 
  updateComponent(); // 第一次挂载 需要先执行一次
}