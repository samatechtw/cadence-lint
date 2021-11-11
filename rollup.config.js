import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import json from '@rollup/plugin-json'
import { terser } from 'rollup-plugin-terser'
import builtins from 'builtin-modules'

const pkg = require('./package.json')

export default [
  {
    input: 'dist/src/index.js',
    output: [
      {
        exports: 'named',
        file: pkg.main,
        sourcemap: true,
        name: 'cadenceLint',
        format: 'cjs',
      },
    ],
    external: [builtins],
    plugins: [
      json(),
      resolve({ preferBuiltins: true }),
      commonjs({
        ignoreDynamicRequires: true,
        dynamicRequireTargets: [
          'node_modules/glob/*.js',
          'node_modules/fast-glob/*.js',
          'node_modules/shelljs',
        ],
      }),
      sourceMaps(),
      terser(),
    ],
  },
]
