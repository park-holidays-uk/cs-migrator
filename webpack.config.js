const nodeExternals = require('webpack-node-externals')
const HappyPack = require('happypack')
const path = require('path')

module.exports = (_, argv, configDirs) => {
  const plugins = [
    new HappyPack({
      id: 'tsx',
      threads: 4,
      loaders: [
        {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            configFile: path.resolve(__dirname, '.babelrc'),
          },
        },
      ],
    }),
  ]

  return {
    entry: {
      index: path.resolve(__dirname, './src/index.ts'),
    },
    mode: argv.mode,
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: '[name].js',
    },
    resolve: {
      // Order is important, should use ts files before js files if both exist.
      extensions: ['.mjs', '.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    externals: [
      nodeExternals(),
      {
        'utf-8-validate': 'commonjs utf-8-validate',
        bufferutil: 'commonjs bufferutil',
      },
    ],
    target: 'node',
    node: {
      __dirname: false,
    },
    devtool: 'eval-source-map',
    plugins,
    module: {
      rules: [
        // TODO: Remove the below rule for .mjs, once aws-amplify supports webpack 5
        {
          test: /\.m?js/,
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.(j|t)sx?$/,
          exclude: /(node_modules|bower_components)/,
          use: ['happypack/loader?id=tsx'],
        },
      ],
    },
  }
}