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
  // if (opts.computed) {
    
  // }
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