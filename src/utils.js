export function isFunction(val) {
  return typeof val === 'function'
}

export function isObject(val) {
  return typeof val == 'object' && val != null  // 注意 typeof null 类型是对象
}


const callback = [];
let waiting = false;

function flushCallBacks() {
  callback.forEach(cb => cb());
  waiting = false;
}

function timer(flushCallBacks) {
  let timerFn = () => { }
  if (Promise) {
    timerFn = () => {
      Promise.resolve().then(flushCallBacks);
    }
  } else if (MutationObserver) { // MutationObserver可以监控dom的变化 然后异步执行 微任务
    let textNode = document.createTextNode(1);
    let observe = new MutationObserver(flushCallBacks);
    observe.observe(textNode, {
      characterData: true
    })
    timerFn = () => {
      textNode.textContent = 3;
    }
  } else if (setImmediate) {
    timerFn = () => {
      setImmediate(flushCallBacks);
    }
  } else {
    timerFn = () => {
      setTimeout(flushCallBacks, 0);
    }
  }
  timerFn();
  waiting = false;
}


// 微任务是在页面显然前执行 我取得是内存中的dom 不关心渲染是否完成

export function nextTick(cb) {
  callback.push(cb); // 先渲染 flushSchedulerQueue 在 usercb

  if (!waiting) {
    // setTimeout(flushCallBacks, 0); // vue2 中考虑了兼容性问题 vue3 中不在考虑兼容性问题
    // Promise.resolve().then(flushCallBacks) vue3 写法
    timer(flushCallBacks);
  }
}

let lifeCycleHooks = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'update',
  'beforeDestrory',
  'destroyed'
]

let strats = {}; // 存放各种策略 不同的key会有不同的合并策略

function mergeHook(parentVal,childVal) {
  if (childVal) {
    if (parentVal) { // 子组件有 并且父组件也有 
      // 后续
      return parentVal.concat(childVal); // 合并成数组
    } else {
      // 第一次
      return [childVal]; // 子组件有 父组件没有 直接用子组件 
    }
  } else { // 子组件没有 父组件有 直接用父组件
    return parentVal;
  }
}

lifeCycleHooks.forEach(hook => {
  strats[hook] = mergeHook
})

// 第一次调用 {} {beforCreate:fn1} => {beforCreate:[fn1]}
// 第二次调用 {beforCreate:[fn1]} {beforCreate:fn2} => {beforCreate:[fn1,fn2]}
export function mergeOptions(parent,child) {
  const options = {}; // 合并后的结果
  for (let key in parent) {
    mergeField(key);
   }
  for (let key in child) {
    if (parent.hasOwnProperty(key)) {
      continue; // 如果父亲有对应key则不需要再循环，没有才需要儿子循环(父组件没有 子组件有)
    }
    mergeField(key)
  }
  function mergeField(key) {
    let parentVal = parent[key];
    let childVal = child[key];
    if (strats[key]) { // 如果有对应的策略就调用对应的策略即可
      options[key] = strats[key](parentVal,childVal)
    } else {
      if (isObject(parentVal) && isObject(childVal)) { // 如果选项值为对象，则合并
        options[key] = {...parentVal, ...childVal}
      } else { // 不是对象 合并则以儿子为准(当前组件)
        options[key] = child[key]
      }
    }
    
  }
  return options
}
// console.log(mergeOptions({ beforeCreate: [() => { }]}, { beforeCreate() { }}));