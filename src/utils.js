export function isFunction(val) {
  return typeof val === 'function'
}

export function isObject(val) {
  return typeof val == 'object' && val != null  // 注意 typeof null 类型是对象
}