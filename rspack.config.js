import { resolve } from 'node:path';
import { TsCheckerRspackPlugin } from 'ts-checker-rspack-plugin';

export default (options) => ({
  entry: {
    'api/main': resolve('src/api/main.ts'),
    'worker/main': resolve('src/worker/main.ts'),
  },
  output: {
    ...options.output,
    filename: '[name].js',
    path: resolve('build'),
  },
  plugins: [...options.plugins, new TsCheckerRspackPlugin()],
});
