let id = 0;
 class Dep { // 每个属性都给他分配一个dep，dep可以来存放watcher 同时 watcher中还要存放这个dep
  constructor() {
    this.id = id++;
    this.subs = []; // 用来存放watcher
   }
   depend() {
     // Dep.target就是当前的watcher dep里要存放这个watcher watcher里要存放这个dep 多对多的关系
     if (Dep.target) { // 如果watcher存在
       Dep.target.addDep(this); // watcher 存放当前的dep
     }
   }
   addSub(watcher) {
    this.subs.push(watcher)
   }
   notify() { // 
     this.subs.forEach(watcher => watcher.update())
   }
}

Dep.target = null; // 全局就一份

export function pushTarget(watcher) {
  Dep.target = watcher;
}

export function popTarget() {
  Dep.target = null;
}

export default Dep;