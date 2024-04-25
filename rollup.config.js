import sass from 'rollup-plugin-sass';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';

export default {
  input: './module/heist.mjs',
  output: {
    file: 'assets/heist.js',
    format: 'es',
  },
  plugins: [
    sass({
      output: true,
      processor: css => postcss([autoprefixer])
        .process(css, { from: './assets/heist.css' })
        .then(result => result.css),
    }),
  ],
  watch: ['module/', 'scss/'],
};
