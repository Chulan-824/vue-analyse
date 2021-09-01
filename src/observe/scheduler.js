/**
 * 该模块专门做页面更新的watcher的调度(防抖——统一更新)
 */

import { nextTick } from "../utils";

let queue = [];
let has = {}; // 做列表的 列表维护存放了哪些watcher

function flushSchedulerQueue() {
  for (let i = 0; i < queue.length; i++) {
    queue[i].run();
  }
  queue = [];
  has = {};
  pending = false;
}

let pending = false

// 要等待同步代码全部执行之后 才执行异步逻辑
export function queueWatcher(watcher) { // 当前执行栈中 代码执行完毕后 会先清空微任务 在清空 宏任务
  // 我希望尽早更新的话 就可以用微任务 (之后如果用户想拿到最新的el元素等内容 可以直接拿到)
  
  const id = watcher.id;
  if (has[id] == null) {
    queue.push(watcher);
    has[id] = true;

    // 开启一次更新操作 批处理 防抖
    if (!pending) {
      nextTick(flushSchedulerQueue, 0)
      // setTimeout(flushSchedulerQueue, 0);
      pending = true;
    }
  }
  

}