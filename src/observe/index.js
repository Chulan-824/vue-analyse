import { isObject } from "../utils";
import { arrayMethods } from "./array.js";

// 1.如果数据是对象 会将对象不听的递归 进行劫持
// 2.如果数据是数组 会劫持数组的方法 并对数组的中不是基本类型的数据进行检测

// Observer类的作用 检测数据的变化 好处 类有类型 对象无类型 ———— 之后想判断一个对象是否被检测过 只需要判断对象上是否有Observer类的实例就可以
class Observer {
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
      console.log('get', data, key);
      return value
    },
    set(newVal) {
      observe(newVal); // 如果用户赋值一个新对象，需要对这个对象进行劫持  vm._data.a = {b:1}
      value = newVal
     }
  })
}

export function observe(data) {
  
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