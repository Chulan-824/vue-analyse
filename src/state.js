import Dep from "./observe/dep.js";
import { observe } from "./observe/index.js";
import Watcher from "./observe/watcher.js";
import { isFunction } from "./utils";


export function stateMixin(Vue) {
  Vue.prototype.$watch = function (key, handler, options = {}) {
    options.user = true; // 给options新增用户属性 表示为用户watcher

    // vm name 用户回调 options.user
    new Watcher(this, key, handler, options);

    // if (options.immediate) { // 立即执行
    //   handler(new Watcher(this, key, handler, options).value);
    // }
  }
}

export function initState(vm) {
  const opts = vm.$options;
  if(opts.data) {
    initData(vm);
  }
  if (opts.computed) {
    initComputed(vm, opts.computed);
  }
  if (opts.watch) { // 初始化watch
    initWatch(vm, opts.watch)
  }
  
}

function proxy(vm, source, key) {
  Object.defineProperty(vm, key, {
    get() {
      return vm[source][key];
    },
    set(newVal) {
      vm[source][key] = newVal
    }
  })
}

function initData(vm) {
  let data = vm.$options.data; // vm.$el  vue内部会对属性进行检测 如果事宜$开头 不会进行代理
  // vue2中会将所有的数据进行数据劫持 Object.defineProperty() (对象)

  // 这个时候vm和data没有任何关系 通过_data进行关联
  data = vm._data = isFunction(data) ? data.call(vm) : data;  // 如果data是函数(return {}形式)，就要调用函数，并且保证this永远指向当前实例


  // 用户去vm.xx 取值 => vm._data.xx
  for (let key in data) {
    proxy(vm, '_data', key); // 进行一层代理 实现可以直接从实力上获取属性 vm.name = xx 而不是vm._data.name = xx
  }

  observe(data); // 观测数据 单独放observe文件下维护改方法

}

function initWatch(vm, watch) {
  for (let key in watch) { // 此处也可以用Object.key()遍历 这样就不会遍历出原型链的属性
    console.log(key);

    let handler = watch[key]; // handle可能是函数 可能是数组(多个函数) 可能是字符串(直接去method取值 暂时不考虑)

    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}

function createWatcher(vm, key, handler) {
  return vm.$watch(key, handler)
}

function initComputed(vm, computed) {
  const watchers = vm._computedWatchers = {}; // 将计算属性watcher全部放到vm上 方便下面做computed缓存时能够取到属性对应的计算watcher
  for (let key in computed) {
    const userDef = computed[key]; // userDef 可能是函数 可能是对象

    // 依赖的属性变化就重新取值 => 主要是get方法
    let getter = typeof userDef == "function" ? userDef : userDef.get;
    // 将watcher和属性做一个映射 每个计算属性 本质就是watcher
    watchers[key] = new Watcher(vm, getter, () => {}, {lazy:true}); // lazy 默认不执行
    // 将key定义在vm上
    defineComputed(vm, key, userDef);
  }
}

function createComputedGetter(key) {
  return function computedGetter() { // 取计算属性的值走的是这个函数
    // this._computedWatchers 包含所有的计算属性 通过key可以拿到对应watcher
    // watcher中包含了getter(new Watcher的时候已经将getter存到watcher中)
    let watcher = this._computedWatchers[key];
    // 脏就是需要调用用户的getter 不脏就不调用
    if (watcher.dirty) { // 如果当前wacher的值是脏的 就进行一次取值操作(值如果是最新的 那么就不是脏的 也就被缓存下来)
      watcher.evaluate();
    }

    // 如果当前取完值后 Dep.target还有值 需要继续向上收集
    if (Dep.target) {
      // 计算属性watcher 内部 有两个dep firstName和lastName
      watcher.depend(); // watcher 里 对应了 多个dep
    }

    return watcher.value
  }
}

function defineComputed(vm, key, userDef) {
  let sharedProperty = {}; 
  if (typeof userDef == "function") {
    sharedProperty.get = userDef
  } else {
    sharedProperty.get = createComputedGetter(key); // computed需要缓存数据 所以取值操作需要单独包装一层
    sharedProperty.set = userDef.set;
  }
  Object.defineProperty(vm, key, sharedProperty); // computed 就是一个defineProperty
}