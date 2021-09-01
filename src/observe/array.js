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

    // 数组的observer.dep 属性
    ob.dep.notify();
  }
})