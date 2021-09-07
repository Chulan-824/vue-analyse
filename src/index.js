// es5中没有类的概念，所以，写原型方法还是要.prototype.=,如果用类写又不符合类的思想(原型方法放在类中定义)

import { initGlobalApi } from "./global-api/index";
import { initMixin } from "./init";
import { lifecycleMixin } from "./lifecycle";
import { renderMixin } from "./render";
import { stateMixin } from "./state";

// 所以使用构造函数定义
function Vue(options) {  // options 为用户传入的选项
  this._init(options); // 初始化操作  之后所有的组件都要初始化，所以扩展为原型方法，之后所有组件可以直接调用该方法进行初始化
  
} 


initMixin(Vue);
renderMixin(Vue);  // _render
lifecycleMixin(Vue);  // _update
stateMixin(Vue); // 状态合并

// 在类上扩展 Vue.mixin
initGlobalApi(Vue)

export default Vue