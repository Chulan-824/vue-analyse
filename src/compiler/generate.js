const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;  // 匹配{{}}中间的任意字符

function getProps(attrs) {  // [{name: "id", value: "app"}]
  let str = '';
  for (let i = 0; i < attrs.length; i++) {
    let attr = attrs[i];

    if (attr.name === 'style') { // color:red;background:blue
      let styleObj = {};
      attr.value.replace(/([^;:]+)\:([^;:]+)/g, function () {
        styleObj[arguments[1]] = arguments[2];
      })
      attr.value = styleObj;
    }

    str += `${attr.name}:${JSON.stringify(attr.value)},` // 属性都是""或者''包裹，所以要stringify转一下
  }
  return `{${str.slice(0, -1)}}` // slice将最后一个逗号删除
}

function gen(el) {
  if (el.type == 1) {
    return generate(el);
  } else {
    let text = el.text;

    if (!defaultTagRE.test(text)) {
      return `_v('${text}')`;
    } else { // hello {{name}} world => 'hello' + name + 'world'
      let tokens = [];
      let match; // 匹配内容
      let lastIndex = defaultTagRE.lastIndex = 0; // 因为exec方法和全局g冲突 需要充值一下索引
     
      while (match = defaultTagRE.exec(text)) {  // 看是否有匹配到
        let index= match.index; // 开始索引
        if (index > lastIndex) {
          tokens.push(JSON.stringify(text.slice(lastIndex, index))) // 匹配的内容为 hello 到{的索引内容
        }

        tokens.push(`_s(${match[1].trim()})`)  // 取出 {{}} 中间的内容  _s原理就是JSON.stringify 避免口号中间的内容是一个对象 [Object Object]

        lastIndex = index + match[0].length; // 结束索引
      }
      if (lastIndex < text.length) {  // 将后面的内容全部取出
        tokens.push(JSON.stringify(text.slice(lastIndex)))
      }
      return `_v(${tokens.join('+')})`
      
    }
    
  }
}

function getChildren(el) {
  let children = el.children; // 获取子节点
  if (children) {
    return children.map(c => gen(c)).join(',');
  }
  return false
}

export function generate(el) {  // _c('div', { id: 'app', a: '1' }, _c('span', {}, 'world'),_v()) 有子节点的情况
  // _c('div', { id: 'app', a: '1' }, 'hello') 将ast拼接成上述字符串 再把字符串转换成函数
  // 遍历树 将树形成字符串
  let children = getChildren(el)
  let code = `_c("${el.tag}",${el.attrs.length ? getProps(el.attrs) : 'undefined'
    }${children ? `,${children}` : ''})`
  return code
}