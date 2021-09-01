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