// output.pathに絶対パスを指定する必要があるため、pathモジュールを読み込んでおく
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/js/app.js',
  watch: true,
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'public/js')
  },
  devServer: {
  	host: '0.0.0.0',
    disableHostCheck: true
  }
};
