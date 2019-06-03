import React, { forwardRef } from 'react';
import CodeEditor from '../codeEditor';
import { tokenizeBuilder } from '../codeEditor/helpers';
import { withStyles } from '@material-ui/core';
import { fns } from '../../parserHelpers';
import Tooltip from '@material-ui/core/Tooltip/Tooltip';

const sqlConfig = {
  keywords: ['IF', 'CONST', 'LET'],
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
})(({ text, classes, args }) => {
  const tooltip = (
    <div>
      <table>
        <tbody>
          <tr>
            <th>Type:</th>
            <td>
              {args.vars[text]
                ? args.vars[text].cls
                : fns[text]
                ? fns[text].returnType
                : ''}
            </td>
          </tr>
          <tr>
            <th>Light type:</th>
            <td>asd</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <Tooltip title={tooltip}>
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
    </Tooltip>
  );
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
    style={{ fontFamily: 'Menlo, "Courier New", serif', fontSize: '13px' }}
    ref={ref}
    {...props}
  />
));

export default HueScriptEditor;
