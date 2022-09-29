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
      contentTypes: path.resolve(__dirname, './src/contentTypes/index.ts'),
      dynamo: path.resolve(__dirname, './src/dynamoDb/index.ts'),
      migrateSlugs: path.resolve(__dirname, './src/migration/migrateSlug'),
      migrateCmsTags: path.resolve(__dirname, './src/migration/migrateCmsTags'),
      migrateCompanyBrand: path.resolve(__dirname, './src/migration/migrateCompanyBrand'),
      migrateIsVisible: path.resolve(__dirname, './src/migration/migrateIsVisible'),
      migrateTouringType: path.resolve(__dirname, './src/migration/migrateTouringType'),
      migrateMediaTextContent: path.resolve(__dirname, './src/migration/migrateMediaTextContent'),
      publish: path.resolve(__dirname, './src/publish/index.ts'),
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