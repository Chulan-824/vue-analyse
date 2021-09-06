import { popTarget, pushTarget } from "./dep";
import { queueWatcher } from "./scheduler";

let id = 0;
class Watcher {
  // vm, updateComponent(), () => {console.log('自定义callback 属性更新了!');}, true
  constructor(vm, exprOrFn, cb, options) {
    // exprOrFn 之前传的是updateComponent 现在传的是watch里面的key
    this.vm = vm;
    this.exprOrFn = exprOrFn;
    this.user = !!options.user; // 判断是不是用户watcher
    this.lazy = !!options.lazy; // 判断是否默认执行一次 根据lazy就可以区分是否是计算属性的watcher
    this.dirty = options.lazy; // 如果是计算属性 那么默认值lazy:true => dirty: true
    this.cb = cb;
    this.options = options;
    this.id = id++; // 给watcher增加一个唯一标识

    // 默认应该让exprOrFn执行 exprOrFn 方法执行后 调用了render方法 (去vm上取值了)
    if (typeof exprOrFn === 'string') {
      this.getter = function () { // 需要将表达式转换成函数
        // 当我数据取值时 会进行依赖收集 收集当前用户的用户watcher

        // 假如watch 属性为 'age.n' 需要转换为 vm['age']['n']
        let path = exprOrFn.split('.'); // [age,n]
        let obj = vm;
        for (let i = 0; i < path.length; i++) {
          obj = obj[path[i]];
        }
        return obj; // 这里会取值 走observe的get方法=>然后Dep.target存放的就是当前的watcher实例(pushTarget(this))
      }
    } else {
      this.getter = exprOrFn;
    }
    this.deps = []; // 存放dep
    this.depsId = new Set(); // 创建一个已经存放dep的标识 避免同一模板多次取值
    // 第一次渲染时候的value
    this.value = this.lazy ? undefined : this.get(); // 默认初始化 要取值
  }
  get() { // 稍后用户更新时 可以重新调用getter方法
    // 这里getter执行就会去data里取值，就会走defineProperty.get
    // 一个属性可能在多个组件中用到 比如vuex
    // 所以每个属性都可以收集自己的watcher  一个属性 对应 多个watcher
    // 同时 一个组件有100个属性 那么100个属性 都属于该组件的watcher 一个watcher 对应 多个属性
    // 既 watcher 和 属性 为多对多的关系 —— 用dep类 来收集这种依赖
    pushTarget(this); // Dep.target = watcher 去之前 先把当前watcher放在全局的Dep.target上
    // 
    const value = this.getter.call(this.vm); // render() 会去vm上取值 vm._update(vm._render)
    popTarget(); // Dep.target = null 如果Dep.target有值 说明这个变量在模板中使用了 防止用户取在实例外的值(取data外的值不刷新组件) 在属性get里做判断

    return value;
  }
  update() {
    // this.get()
    // 每次更新时 this指向watcher
    if (this.lazy) { // 计算属性更新
      this.dirty = true;
    } else {
      queueWatcher(this); // 多次调用update 我希望将watcher缓存下来 等一会一起更新
    }
  }
  run() {  // 不同的watcher可能执行的get方法不同 所以单独写一个方法调用
    let newValue = this.get()
    let oldValue = this.value;

    this.value = newValue; // 为了保证下一次更新时 上一次的最新值 是下一次更新的老值
    if (this.user) {
      this.cb.call(this.vm, newValue, oldValue);
    }
  }
  addDep(dep) { // 同一模板多次取值 所以 要存放多个dep
    let id = dep.id;
    if (!this.depsId.has(id)) { // 没有存过dep  watcher 拦截重复dep dep中就不需要拦截重复watcher
      this.depsId.add(id);
      this.deps.push(dep);
      dep.addSub(this);
    }
  }
  evaluate() {
    this.dirty = false; // 为false表示取过值了
    this.value = this.get(); // 用户的getter执行
  }
  depend() {
    let i = this.deps.length;
    while (i--) {
      this.deps[i].depend(); // 取出lastName和firstName的dep 然后再去 收集渲染watcher
    }
  }
}
// watcher 和 dep
// 我们将更新的功能封装成了一个watcher
// 渲染页面前 会将当前watcher放到dep上
// 在vue中页面渲染师使用的属性 需要进行依赖收集 收集对象的渲染watcher
// 渲染时 给每个属性都加了个dep属性 用于存储这个渲染watcher (同一个watcher会对应多个dep)
// 每个属性可能对应多个视图(多个视图肯定是多个watcher) 一个属性对应多个watcher
// dep.depend() => 通知dep存放watcher => Dep.target.addDep() => 通知watcher存放dep
// 双向存储
export default Watcher