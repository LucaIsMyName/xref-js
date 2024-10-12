// rollup.config.mjs
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('./package.json');

const umdName = 'Xref'; // Replace with your library's global name for UMD builds

const commonPlugins = [
  typescript(),
  resolve(),
  commonjs(),
];

export default [
  // ES Module
  {
    input: 'src/xref.ts',
    output: [
      {
        file: packageJson.module,
        format: 'es',
        sourcemap: true,
      },
    ],
    plugins: commonPlugins,
  },
  // CommonJS
  {
    input: 'src/xref.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
    ],
    plugins: commonPlugins,
  },
  // UMD (unminified and minified)
  {
    input: 'src/xref.ts',
    output: [
      {
        file: 'dist/xref.umd.js',
        format: 'umd',
        name: umdName,
        sourcemap: true,
      },
      {
        file: 'dist/xref.umd.min.js',
        format: 'umd',
        name: umdName,
        sourcemap: true,
        plugins: [terser()],
      },
    ],
    plugins: commonPlugins,
  },
  // TypeScript declaration files
  {
    input: 'src/xref.ts',
    output: [{ file: 'dist/xref.d.ts', format: 'es' }],
    plugins: [dts()],
  },
];