import { isObject } from "../utils";
import { arrayMethods } from "./array.js";
import Dep from "./dep";

// 1.如果数据是对象 会将对象不听的递归 进行劫持
// 2.如果数据是数组 会劫持数组的方法 并对数组的中不是基本类型的数据进行检测

// Observer类的作用 检测数据的变化 好处 类有类型 对象无类型 ———— 之后想判断一个对象是否被检测过 只需要判断对象上是否有Observer类的实例就可以

// 如果给对象新增一个属性，不会触发更新
// 所以可以给对象本身增加一个dep dep中存watcher 如果增加一个属性后 就手动出发watcher
class Observer {
  constructor(data) {  // 对对象重的所有属性 进行劫持
    // 给对 象/数组 本身
    this.dep = new Dep(); // 数据可能是数组或者对象

    Object.defineProperty(data, '__ob__', {
      value: this,
      enumerable: false  // 不可枚举的 防止对每个__ob__属性再次进行观测 避免栈溢出
    })
    // data.__ob__ = this;  // 所有被劫持过的属性 都有__ob__  这里的this指向当前类的实例

    if (Array.isArray(data)) { // 数组劫持的逻辑(方法劫持)  我希望数组的变化更新视图
      // 对数组原来的方法进行改写 切片编程 类似于高阶函数
      data.__proto__ = arrayMethods;
      // 若果数组重的数据是对象类型 需要监控对象的变化
      this.observeArray(data);
    } else {
      this.walk(data); // 对象劫持逻辑(数据劫持)
    }
  }

  observeArray(data) { // 对数组中的数组 和 数组中的对象再次劫持 递归
    
    // 如果数组里是对象类型 也做了观测 JSON.stringfy() 也做了收集
    data.forEach(item => observe(item));
  }

  walk(data) {
    Object.keys(data).forEach(key => {
      defineReactive(data, key, data[key]);
    })
  }
}

function dependArray(value) {
  for (let i = 0; i < value.length; i++) {
    let current = value[i] // 里层的数组
    current.__ob__ && current.__ob__.dep.depend();
    if (Array.isArray(current)) {
      dependArray(current);
    }
  }
}

// vue2 会对对象进行遍历 将每个属性 用defineProperty 重新定义 所以性能差
function defineReactive(data, key, value) {  // 定义响应式 value 有可能是对象
  
  let childOb = observe(value); // 本身用户默认值是对象套对象的情况 需要递归处理 性能差 (所以用vue2时 对象尽可能扁平化)

  // console.log(childOb); // 获取数组对应的ob

  let dep = new Dep; // 每个属性都有一个dep属性
  Object.defineProperty(data, key, {
    get() {
      // 取值时 希望将watcher和dep对应起来
      if (Dep.target) { // 此值是在模板中取的
        dep.depend(); // 让dep记住watcher
        if (childOb) {  // 如果数组属性有值 就调用该属性本身的dep的depend方法收集watcher
          // childOb可能是数组可能是对象 都需要在自身属性的dep上收集watcher 为之后$set做准备
          childOb.dep.depend(); // 让数组和对象也记录watcher 让最外层的数组收集依赖

          if (Array.isArray(value)) {  // 去外层数组 要将数组里面的数组也进行收集
            dependArray(value);
          }
        }
      }
      return value
    },
    set(newVal) {
      // 收集完dep之后 更新视图
      if (newVal !== value) {
        observe(newVal); // 如果用户赋值一个新对象，需要对这个对象进行劫持  vm._data.a = {b:1}
        value = newVal
        dep.notify();
      } 
     }
  })
}

export function observe(data) {
  
  // 如果是对象才观测
  if (!isObject(data)) {  // 基本类型不监控
    return;
  }
  if (data.__ob__) {  // 每个被观测过的属性就会有Ob实例 就不需要在观测了
    return data.__ob__;
  }

  // 默认最外层的data必须是一个对象  这里就不做具体判断
  return new Observer(data) // 返回一个观测者实例
}