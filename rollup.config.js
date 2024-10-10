import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/xref.ts',
  output: [
    {
      file: 'dist/xref.js',
      format: 'umd',
      name: 'xref',
    },
    {
      file: 'dist/xref.esm.js',
      format: 'es',
    },
  ],
  plugins: [typescript()],
};