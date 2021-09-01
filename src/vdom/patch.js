import { createElement } from ".";

export function patch(oldVnode, vnode) {
  if (oldVnode.nodeType == 1) {  // 第一次挂载
    // 用vnode 来生成真是dom 替换原本的dom元素
    const parentElm = oldVnode.parentNode; // 找到父节点

    let elm = createElm(vnode); // 根据虚拟节点 创建元素
    console.log(elm);
    parentElm.insertBefore(elm, oldVnode.nextSibling); // 讲新创建的节点放在老节点的下一个节点中(在哪删除 就在哪新增) 此处不能append 不然就让在最后一个节点上
 
    parentElm.removeChild(oldVnode);  // 在父节点中 产出老节点
  }
}

function createElm(vnode) {
  let { tag, data, children, text, vm } = vnode
  if (typeof tag === 'string') { // 元素
    vnode.el = document.createElement(tag); // 虚拟节点会有一个el属性 对应真实节点
    children.forEach(child => { // 遍历子节点 递归创建(深度遍历) 并插入到父节点
      vnode.el.appendChild(createElm(child))
    })
  } else { // 文本
    vnode.el = document.createTextNode(text);
  }
  // 这里暂时不做属性比对
  return vnode.el
}