import { generate } from "./generate";
import { parserHTML } from "./parser";

export function compileToFunction(template) {

  let root = parserHTML(template);  // 解析html

  // html => ast(只能描述语法 语法不存在的属性无法描述) => render函数 => 虚拟dom (增加额外的属性) => 生成真实dom

  // 生成代码
  let code = generate(root);
  // code可能会用到数据 数据在vm上 所以不能直接code生成函数 
  // 需要在外面包一层with 之后调用render时call(vm) 就可以拿到vm上的数据
  let render = new Function(`with(this){return ${code}}`); 
  
  return render;
  // render() {
  //   return 
  // }
  // html => ast树 => render函数 + (with + new Function) => 虚拟dom(增加额外的属性) => 生成真是dom
} 