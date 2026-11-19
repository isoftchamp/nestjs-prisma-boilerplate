import { resolve } from 'node:path';
import { TsCheckerRspackPlugin } from 'ts-checker-rspack-plugin';

export default (options) => ({
  entry: {
    web: resolve('src/web.ts'),
    worker: resolve('src/worker.ts'),
  },
  output: {
    ...options.output,
    filename: '[name].js',
    path: resolve('build'),
  },
  plugins: [...options.plugins, new TsCheckerRspackPlugin()],
});
