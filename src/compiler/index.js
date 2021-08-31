import { generate } from "./generate";
import { parserHTML } from "./parser";

export function compileToFunction(template) {

  let root = parserHTML(template);  // 解析html

  // html => ast(只能描述语法 语法不存在的属性无法描述) => render函数 => 虚拟dom (增加额外的属性) => 生成真实dom

  // 生成代码
  let code = generate(root);
  console.log(code);
  // render() {
  //   console.log(111);
  //   return _c('div', { id: 'app', a: '1' }, 'hello')
  // }
  // 
} 