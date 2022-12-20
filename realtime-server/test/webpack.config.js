const path = require('path')

module.exports = {
  entry: {
    main: path.resolve(__dirname, './client.js'),
  },
  mode: 'development',
  output:{
    filename:'[name].bundle.js',
    path: path.resolve(__dirname, './dist')
  }
}