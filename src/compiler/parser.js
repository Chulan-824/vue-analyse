// 源码部分正则
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // a-123_  标签名 div *零或者多个
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;  // (aa:)xxx => <aa:xx></aa:xx>  用来获取标签名 要取第二个括号里的标签名 所以match后的索引为1 
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配开始标签的
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配闭合标签 </xx  >
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
// 属性有 a=b a="b" a='b' 三种形式  匹配属性的 key 和 value
const startTagClose = /^\s*(\/?)>/;  // 标签结束  />
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;  // 匹配{{}}中间的任意字符

// ast(语法层面的描述 js css html) vnode(dom节点)

// html字符串 解析成 ast树 <div id="app">{{name}}</div>
// 这里不考虑单标签

// 在解析完成之后 要将解析后的记过 组装成一个树结构 可以用栈结构
// 解析到标签之后 放入栈中 新标签再次进入 上次标签则为父节点 
// 如果遇到相同标签闭合标签时 则弹出对应的标签 循环操作

function creatAstElement(tagName, attrs) { // 构建ast树
  return {
    tag: tagName, // 当前标签名
    type: 1,  // 元素类型 为1 文本是3 ...
    children: [], // 子节点
    parent: null, // 父节点 根节点 默认为null
    attrs // 属性
  }
}
let root = null;
let stack = []; // 定义栈
function start(tagName, attribute) {
  let parent = stack[stack.length - 1];
  let element = creatAstElement(tagName, attribute)
  if (!root) {
    root = element  // 第一次解析的元素为根节点
  }
  
  if (parent) {  // 如果是根节点的话 没有父节点 所以不做记录
    element.parent = parent; // 当放入栈中前 记录父节点是谁
    parent.children.push(element); // 双向记录
  }

  stack.push(element);
}

function end(tagName) {
  let last = stack.pop();
  if (last.tag !== tagName) {  // 栈中最后一个元素 和 当前闭合的标签 想匹配
    throw new Error('标签闭合有误');
  }
}

function chars(text) {
  text = text.replace(/\s/g, ""); // 文本可能为空或者多个空格等 这里统一删除(原则上是不应该删除)
  let parent = stack[stack.length - 1];
  if (text) {
    parent.children.push({
      type: 3,
      text
    })
  }
}
 
export function parserHTML(html) { // <div id="app">123123</div> => 123123</div>

  function advance(len) {  // 用来删除已经匹配的字符串长度
    html = html.substring(len);
  }

  function parseStartTag() {
    const start = html.match(startTagOpen);
    if (start) {
      const match = {
        tagName: start[1],
        attrs: []
      }
      advance(start[0].length) // id="app">123123</div> => 123123</div>
      let end;
      let attr;
      // 如果没有遇到标签的结尾 并且 能匹配到属性 就不停的解析
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) { // 匹配完标签之后 匹配属性
        match.attrs.push({name:attr[1], value: attr[3] || attr[4] || attr[5]}) // 如果属性是"" 取分组第3项 如果是'' 取分组第4项
        advance(attr[0].length)
      }
      if (end) {
        advance(end[0].length)
      }
      return match
    }
    return false; // 没匹配到 不是开始标签
  }

  while (html) {  // 循环解析 一个词一个词解析 看要解析的内容是否存在 如果存在就不停的解析
    let textEnd = html.indexOf('<') // 当前解析的 开头
    if (textEnd == 0) { // <div id="app">1231</div> 匹配的第一个<括号

      const startTagMatch = parseStartTag(); // 解析开始标签
      if (startTagMatch) {
        start(startTagMatch.tagName, startTagMatch.attrs)
        continue;
      }

      const endTagMatch = html.match(endTag);
      if (endTagMatch) {  // 在看看匹配的是否是结束标签
        end(endTagMatch[1]);
        advance(endTagMatch[0].length);
      }
    }
    let text; // 123123</div> => </div>
    if (textEnd > 0) {
      text = html.substring(0, textEnd); // 截取文本内容 123123
    }
    if (text) {
      chars(text);
      advance(text.length);
    }
  }

  return root;
}