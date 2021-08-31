import { observe } from "./observe/index.js";
import { isFunction } from "./utils";

export function initState(vm) {
  const opts = vm.$options;
  if(opts.data) {
    initData(vm);
  }
  // if (opts.computed) {
    
  // }
  // if (opts.watch) {
    
  // }
  
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