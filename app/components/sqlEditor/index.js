import React, { memo } from 'react';
import { compose } from 'ramda';
import { withProps } from 'recompose';
import classNames from 'classnames/bind';
import CodeEditor, { getInitialValue } from '../codeEditor';
import { tokenizeBuilder } from '../codeEditor/helpers';
import styles from './styles.scss';

const cx = classNames.bind(styles);

const sqlConfig = {
  keywords: ['if'],
  operators: {
    '+': 'PLUS',
    '-': 'MINUS',
    '*': 'MULTIPLY',
    '.': 'PERIOD',
    '\\': 'BACKSLASH',
    ':': 'COLON',
    '%': 'PERCENT',
    '|': 'PIPE',
    '!': 'EXCLAMATION',
    '?': 'QUESTION',
    '&': 'AMPERSAND',
    ';': 'SEMI',
    ',': 'COMMA',
    '(': 'L_PAREN',
    ')': 'R_PAREN',
    '<': 'L_ANG',
    '>': 'R_ANG',
    '{': 'L_BRACE',
    '}': 'R_BRACE',
    '=': 'EQUALS'
  },
  blocks: [
    {
      type: 'QUOTE',
      terminator: "'",
      terminatorEnd: "'"
    }
  ]
};

const tokenize = tokenizeBuilder(sqlConfig);

const customStyleMap = {
  QUOTE: {
    color: '#7c0000'
  },
  NUMBER: {
    color: 'rgba(255, 127, 0, 1.0)'
  },
  green: {
    color: 'rgba(0, 180, 0, 1.0)'
  },
  KEYWORD: {
    color: 'rgba(0, 0, 255, 1.0)',
    fontWeight: 'bold'
  },
  error: {
    borderBottom: '#e74c3c solid 2px'
  }
};

const className = cx('sqlInput');

const sqlEditorProps = compose(
  memo,
  withProps({
    customStyleMap,
    tokenize,
    className
  })
);

const SqlEditor = sqlEditorProps(CodeEditor);

export default SqlEditor;

export { getInitialValue };
