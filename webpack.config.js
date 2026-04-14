const path = require('path');
const fs = require('fs');

// Dynamic entry discovery: bundles all *.test.ts files in src/tests/
const testFolder = path.resolve(__dirname, 'src/tests');
const entryPoints = fs.readdirSync(testFolder)
  .filter(file => file.endsWith('.test.ts'))
  .reduce((entries, file) => {
    const name = file.replace('.test.ts', '');
    entries[name] = `./src/tests/${file}`;
    return entries;
  }, {});

module.exports = {
  mode: 'production',
  entry: entryPoints,
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs',
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@api': path.resolve(__dirname, 'src/api'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@vendor': path.resolve(__dirname, 'src/vendor'),
    },
  },
  externals: [
    function ({ request }, callback) {
      if (request.indexOf('k6') === 0 || request.indexOf('http') === 0) {
        return callback(null, 'commonjs ' + request);
      }
      callback();
    },
  ],
  stats: {
    colors: true,
  },
};
