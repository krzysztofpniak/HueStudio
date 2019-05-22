import {
  applyTo,
  compose,
  contains,
  find,
  length,
  map,
  mapAccum,
  nth,
  prop,
  propEq,
  when
} from 'ramda';
import Immutable from 'seamless-immutable';
import { convertFromRaw } from 'draft-js';

const isNewLine = c => c === '\r' || c === '\n';

const isDigit = c => c >= '0' && c <= '9';

const isAlpha = c =>
  (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '$';

const isAlphanum = c =>
  (c >= 'a' && c <= 'z') ||
  (c >= 'A' && c <= 'Z') ||
  (c >= '0' && c <= '9') ||
  c === '_' ||
  c === '$';

const isWhiteSpace = c => c === ' ' || c === '\t' || isNewLine(c);

let pos = 0;
let buf = null;
let buflen = 0;
let line = 0;
let column = 0;

const processWhiteSpace = () => {
  let endpos = pos;
  let endLine = line;
  let endColumn = column;

  while (endpos < buflen && isWhiteSpace(buf.charAt(endpos))) {
    if (isNewLine(buf.charAt(endpos))) {
      endLine++;
      endColumn = 1;
    } else {
      endColumn++;
    }
    endpos++;
  }

  const tok = {
    name: 'WHITESPACE',
    value: buf.substring(pos, endpos),
    pos: pos,
    line: line,
    column: column
  };
  pos = endpos;
  line = endLine;
  column = endColumn;

  return tok;
};

const processNumber = () => {
  let endpos = pos;
  while (endpos < buflen && isDigit(buf.charAt(endpos))) {
    endpos++;
  }

  const tok = {
    name: 'NUMBER',
    value: buf.substring(pos, endpos),
    pos: pos,
    line: line,
    column: column
  };
  pos = endpos;
  column += tok.value.length;
  return tok;
};

const getToken = ({ blocks, keywords, operators }) => {
  if (pos >= buflen) {
    return null;
  }

  const c = buf.charAt(pos);

  if (isWhiteSpace(c)) {
    return processWhiteSpace();
  } else if (c === '/') {
    const next_c = buf.charAt(pos + 1);
    if (next_c === '/') {
      return processComment();
    } else {
      return { name: 'DIVIDE', value: '/', pos: pos++, column: column++ };
    }
  } else {
    // Look it up in the table of operators
    const op = operators[c];
    if (op !== undefined) {
      return { name: op, value: c, pos: pos++, column: column++ };
    } else {
      // Not an operator - so it's the beginning of another token.
      if (isAlpha(c)) {
        return processIdentifier(keywords);
      } else if (isDigit(c)) {
        return processNumber();
      } else if (map(prop('terminator'), blocks).includes(c)) {
        const quoteBlock = find(propEq('terminator', c), blocks);
        return processQuote(quoteBlock);
      } else {
        return processUnknown();
      }
    }
  }
};

const getEOF = () => {
  return {
    name: 'EOF',
    value: ' ',
    pos: pos,
    line: line,
    column: column
  };
};

const processComment = () => {
  let endpos = pos + 2;
  while (endpos < buflen && !isNewLine(buf.charAt(endpos))) {
    endpos++;
  }

  const tok = {
    name: 'COMMENT',
    value: buf.substring(pos, endpos),
    pos: pos,
    line: line,
    column: column
  };
  pos = endpos + 1;
  return tok;
};

const processIdentifier = keywords => {
  let endpos = pos + 1;
  while (endpos < buflen && isAlphanum(buf.charAt(endpos))) {
    endpos++;
  }

  const value = buf.substring(pos, endpos);
  const name = keywords.includes(value.toUpperCase())
    ? 'KEYWORD'
    : 'IDENTIFIER';

  const tok = {
    name,
    value: name === 'KEYWORD' ? value.toUpperCase() : value,
    pos: pos,
    line: line,
    column: column
  };
  pos = endpos;
  column += tok.value.length;
  return tok;
};

const processQuote = ({ terminatorEnd, type }) => {
  let end_index = buf.indexOf(terminatorEnd, pos + 1);

  if (end_index === -1) {
    end_index = buflen - 1;
  }

  const tok = {
    name: type,
    value: buf.substring(pos, end_index + 1),
    pos: pos,
    line: line,
    column: column
  };
  pos = end_index + 1;
  column += tok.value.length;
  return tok;
};

const processUnknown = () => {
  return {
    name: 'UNKNOWN',
    value: buf.substring(pos, pos + 1),
    pos: pos++,
    column: column++
  };
};

const tokenizeBuilder = config => text => {
  buflen = length(text);
  pos = 0;
  line = 1;
  column = 1;
  buf = text;

  const result = [];
  let token;
  while ((token = getToken(config))) {
    result.push(token);
  }
  result.push(getEOF());
  return result;
};

const getContext = (token, context) => {
  if (token.name === 'KEYWORD') {
    return token.value;
  } else {
    return context;
  }
};

const addContext = compose(
  nth(1),
  mapAccum(
    (context, token) => [
      getContext(token, context),
      {
        ...token,
        context
      }
    ],
    {
      fragment: 'NONE'
    }
  )
);

const getPlainText = value =>
  convertFromRaw(
    Immutable.asMutable(value.content, { deep: true })
  ).getPlainText();

const wrapText = text => `\`${text}\``;

const escapeColumn = when(contains(' '), wrapText);

const getTokenEnd = token => token.pos + token.value.length;

const getTokenAt = (pos, tokens) =>
  find(
    t =>
      t.pos <= pos &&
      ((t.name === 'IDENTIFIER' && pos <= getTokenEnd(t)) ||
        (pos.name !== 'IDENTIFIER' && pos < getTokenEnd(t))),
    tokens
  );

export { tokenizeBuilder, addContext, getPlainText, escapeColumn, getTokenAt };
