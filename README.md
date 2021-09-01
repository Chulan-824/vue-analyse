# vue 源码分析

## vue响应式原理

### 1.初始化数据

给原型定义一个初始化_init()方法，将实例传入的选项挂到vm实例上
```js
new vue({
  el: '#app',
  data: {
    name: 'chulan'
  }
})

Vue.prototype._init = function(options) {
    const vm = this; // this指向Vue实例 类似于 var self = this 方便后续实例的使用
    vm.$options = options // 将options挂到vm实例上  后续会对options选项进行扩展
    // 对数据进行初始化 props data computed  watch ... 对数据操作单独提取到state.js文件里
    initState(vm)
}

function initState(vm) {
  const opts = vm.$options;
  if(opts.data) {
    initData(vm);
  }
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
```

### 2.递归属性劫持

通过observe方法，返回一个Observer观察者实例，通过Object.defineProperty递归重新定义属性的get和set方法

```js
function observe(data) {
  
  // 如果是对象才观测
  if (!isObject(data)) {  // 基本类型不监控
    return;
  }
  if (data.__ob__) {  // 每个被观测过的属性就会有Ob实例 就不需要在观测了
    return;
  }
  // 默认最外层的data必须是一个对象  这里就不做具体判断
  return new Observer(data) // 返回一个观测者实例
}

class Observer {
  constructor(data) {  // 对对象重的所有属性 进行劫持
    Object.defineProperty(data, '__ob__', {
      value: this,
      enumerable: false  // 不可枚举的 防止对每个__ob__属性再次进行观测 避免栈溢出
    })
    // data.__ob__ = this;  // 所有被劫持过的属性 都有__ob__  这里的this指向当前类的实例
  }

  walk(data) {
    Object.keys(data).forEach(key => {
      defineReactive(data, key, data[key]);
    })
  }
}

// vue2 会对对象进行遍历 将每个属性 用defineProperty 重新定义 所以性能差
function defineReactive(data, key, value) {  // 定义响应式 value 有可能是对象
  
  observe(value); // 本身用户默认值是对象套对象的情况 需要递归处理 性能差 (所以用vue2时 对象尽可能扁平化)

  Object.defineProperty(data, key, {
    get() {
      return value
    },
    set(newVal) {
      observe(newVal); // 如果用户赋值一个新对象，需要对这个对象进行劫持  vm._data.a = {b:1}
      value = newVal
     }
  })
}


```

### 3.数组方法的劫持

对于最外层属性是数组的数据，采用对能够改变原数组的7个方法进行劫持，重写方法后返回给该属性的原型，在数组调用7个方法后，直接执行我们重写后的方法，如果有新增的值 在进行劫持 需要观察的是数组的每一项

```js
Observer中新增对数组的属性判断和单独观测数组的方法
constructor(data) {  // 对对象重的所有属性 进行劫持
    Object.defineProperty(data, '__ob__', {
      value: this,
      enumerable: false  // 不可枚举的 防止对每个__ob__属性再次进行观测 避免栈溢出
    })
    // data.__ob__ = this;  // 所有被劫持过的属性 都有__ob__  这里的this指向当前类的实例

    if (Array.isArray(data)) { // 数组劫持的逻辑(方法劫持)
      // 对数组原来的方法进行改写 切片编程 类似于高阶函数
      data.__proto__ = arrayMethods;
      // 若果数组重的数据是对象类型 需要监控对象的变化
      this.observeArray(data);
    } else {
      this.walk(data); // 对象劫持逻辑(数据劫持)
    }
  }

  observeArray(data) { // 对数组中的数组 和 数组中的对象再次劫持 递归
    data.forEach(item => observe(item));
  }

let oldArrayPrototype = Array.prototype
export let arrayMethods = Object.create(oldArrayPrototype);
// arrayMethods.__proto__ = Array.prototype 继承 将原有的数组原型方法先保存一份

let methods = [
  'push',
  'shiift',
  'unshift',
  'pop',
  'reverse',
  'sort',
  'splice',
]

methods.forEach(method => {
  // 用户调用时 若果是以上7个方法 会用我自己重写的 否则会用原来的数组方法
  arrayMethods[method] = function (...args) {
    oldArrayPrototype[method].call(this, ...args)

    // arr.push({a: 1},{b: 1}) 
    let ob = this.__ob__;  // 根据当前数组 获取Observer实例

    let inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args; // 这是新增的方法
        break;
      case 'splice': // arr.splice(0,1,xxx)
        inserted = args.slice(2) // 返回xxx 去掉0和1的参数
        break;
      default:
        break;
    }
    if (inserted) {  //  如果有新增的值 在进行劫持 需要观察的是数组的每一项
      ob.observeArray(inserted)
    }
  }
})
```

### 4.数据代理

很多时候操作需要直接从实例上去属性 如 vm.name = xxx 而不是vm.$option.name = xxx  
所以需要对实例data中的属性进行一层代理  

```js 
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
  let data = vm.$options.data; 
  data = vm._data = isFunction(data) ? data.call(vm) : data; 

  // 用户去vm.xx 取值 => vm._data.xx
  for (let key in data) {
    proxy(vm, '_data', key); // 进行一层代理 实现可以直接从实力上获取属性 vm.name = xx 而不是vm._data.name = xx
  }

  observe(data);

}
```

>  并在观测数据前循环代理数据

## 模板编译

> 数据初始化之后要讲data挂载到el上，所以就需要对el进行模板编译  
> 把模板转换成渲染函数 => 虚拟dom概念 vnode => diff算法 更新虚拟dom => 产生真实节点 更新  
> 以下不考虑用户自写的render函数和template模板，直接解析#app根节点  
### 1.解析标签和内容

```js

```
### 2.形成ast语法树
### 3.生成代码
### 4.生成render函数
