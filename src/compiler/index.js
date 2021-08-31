import { parserHTML } from "./parser";

export function compileToFunction(template) {

  let root = parserHTML(template)  // 解析html

  console.log(root);
} 