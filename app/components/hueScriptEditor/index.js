import React, { forwardRef } from 'react';
import CodeEditor from '../codeEditor';
import { tokenizeBuilder } from '../codeEditor/helpers';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip/Tooltip';
import { map, addIndex } from 'ramda';
const mapWithKey = addIndex(map);

const sqlConfig = {
  keywords: ['IF', 'CONST', 'LET', 'RETURN'],
  operators: {
    '+': 'PLUS',
    '-': 'MINUS',
    //'*': 'MULTIPLY',
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
      terminator: '*',
      terminatorEnd: '*'
    },
    {
      type: 'QUOTE2',
      terminator: '"',
      terminatorEnd: '"'
    },
    {
      type: 'COMMENT',
      terminator: '//',
      terminatorEnd: '\n'
    },
    {
      type: 'COMMENT',
      terminator: '/*',
      terminatorEnd: '*/'
    }
  ]
};

const tokenize = tokenizeBuilder(sqlConfig);

const Identifier = withStyles({
  span: {
    '&:hover': {
      textDecoration: 'underline'
    }
  }
})(({ text, line, column, classes, args }) => {
  const location = `${line}:${column}`;
  const info = args.infos[location] || {};
  const { signature } = info;
  const tooltip = <div>{signature}</div>;

  const inner = (
    <span
      onClick={() =>
        args.editorRef.current.focus(
          args.vars[text].location.start.offset,
          args.vars[text].location.end.offset
        )
      }
      className={classes.span}
    >
      {text}
    </span>
  );

  return signature ? <Tooltip title={tooltip}>{inner}</Tooltip> : inner;
});

const customStyleMap = {
  QUOTE: {
    color: '#7c0000'
  },
  QUOTE2: {
    color: '#7c0000'
  },
  COMMENT: {
    color: '#777'
  },
  NUMBER: {
    color: 'rgba(255, 127, 0, 1.0)'
  },
  KEYWORD: {
    color: 'rgba(0, 0, 255, 1.0)',
    fontWeight: 'bold'
  },
  IDENTIFIER: Identifier,
  error: {
    borderBottom: '#e74c3c solid 2px'
  }
};

const HueScriptEditor = forwardRef((props, ref) => (
  <CodeEditor
    customStyles={customStyleMap}
    tokenize={tokenize}
    style={{
      fontFamily: 'Menlo, "Courier New", serif',
      fontSize: '13px',
      boxShadow: 'inset 0px 0px 10px 3px rgba(0,0,0,0.2)',
      height: '100%',
      boxSizing: 'border-box'
    }}
    ref={ref}
    {...props}
  />
));

export default HueScriptEditor;
