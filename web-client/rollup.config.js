import vuePlugin from 'rollup-plugin-vue'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import {terser} from 'rollup-plugin-terser'
import css from 'rollup-plugin-css-only'
import inject from '@rollup/plugin-inject'
import injectProcessEnv from 'rollup-plugin-inject-process-env'
import json from '@rollup/plugin-json'
import nodePolyfills from 'rollup-plugin-node-polyfills'

const production = !!process.env.PRODUCTION

export default {
  input: 'src/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'static/bundle.js'
  },
  plugins: [
    vuePlugin({
      include: /\.html$/,
      preprocessStyles: true
    }),
    commonjs(),
    nodePolyfills(),

    css({output: 'static/bundle.css'}),


    json({
      // exclude: '**/bip39/src/wordlists/!(english).json',
      indent: ''
    }),

    resolve({
      browser: true,
      preferBuiltins: false
    }),


    inject({
      Buffer: ['buffer', 'Buffer']
    }),

    injectProcessEnv({
      NODE_ENV: production ? 'production' : 'development'
    }),

    production && terser()
  ]
}
