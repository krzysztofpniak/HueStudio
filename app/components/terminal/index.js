import React, { useRef, useMemo, useCallback } from 'react';
import { append, evolve, map, addIndex, assoc } from 'ramda';
import {
  createReducer,
  createPayloadReducer,
  withScope,
  createAction,
  useKReducer
} from '@k-frame/core';

const mapWithKey = addIndex(map);

const actions = {
  setText: createAction('setText'),
  addLine: createAction('addLine')
};

const reducer = createReducer({ text: '', lines: [] }, [
  createPayloadReducer(actions.setText, assoc('text')),
  createPayloadReducer(actions.addLine, p => evolve({ lines: append(p) }))
]);

const Terminal = withScope(() => {
  const { text, setText, lines, addLine } = useKReducer(reducer, actions);
  const typer = useRef();
  const blur = useCallback(() => {}, []);

  const acceptLine = useCallback(() => {
    addLine(typer.current.value);
    setText('');
  }, []);

  const keyDown = useCallback(e => {
    // console.log(e.keyCode);
    if (e.keyCode === 13) {
      e.preventDefault();
      acceptLine();
    }
  }, []);
  const change = useCallback(e => {
    setText(e.target.value);
  }, []);
  const paste = useCallback(() => {}, []);

  const focus = useCallback(() => {
    if (!window.getSelection().toString()) {
      typer.current.focus();
    }
  }, []);

  return (
    <div
      role="button"
      onClick={focus}
      tabIndex="0"
      style={{
        height: '100%',
        fontFamily: 'Menlo, courier',
        backgroundColor: 'black',
        color: 'silver',
        overflow: 'scroll'
      }}
    >
      <div>
        {mapWithKey(
          (l, idx) => (
            <div key={idx}>
              {'$>'}
              <span>{l}</span>
            </div>
          ),
          lines
        )}
      </div>
      <div>
        {'$>'}
        {text}
      </div>
      <div style={{ overflow: 'hidden', height: 1, width: 1 }}>
        <textarea
          ref={typer}
          className="react-console-typer"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          style={{
            outline: 'none',
            color: 'transparent',
            backgroundColor: 'transparent',
            border: 'none',
            resize: 'none',
            overflow: 'hidden'
          }}
          onBlur={blur}
          onKeyDown={keyDown}
          onChange={change}
          value={text}
          onPaste={paste}
        />
      </div>
    </div>
  );
});

export default Terminal;
