require('@babel/register');
const path = require('path');
const fs = require('fs');
const peg = require('pegjs');
const R = require('ramda');
const P = require('./app/parserHelpers');

module.exports = {
  process(src, filename, config, options) {
    var parser = peg.generate(fs.readFileSync(filename, 'utf8'), {
      output: 'source',
      format: 'commonjs',
      dependencies: {
        R: 'ramda',
        P: './parserHelpers.js'
      }
    });

    return parser;
  }
};
