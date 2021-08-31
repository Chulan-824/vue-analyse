import babel from 'rollup-plugin-babel'

export default {
  input: './src/index.js',
  output: {
    format: 'umd', // 支持amd 和 commonjs规范 windows.vue
    name: 'Vue',
    file: 'dist/vue.js',
    sourcemap: true, // es5 -> es6
  },
  plugins: [
    babel({
      exclude: 'node_modules/**' // ** glob语法 表示任何目录
    })
  ]
}