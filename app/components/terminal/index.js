import React, {
  useRef,
  useMemo,
  useCallback,
  useEffect,
  useState
} from 'react';
import {
  append,
  evolve,
  map,
  addIndex,
  assoc,
  propEq,
  filter,
  uniq,
  prop,
  reverse
} from 'ramda';
import {
  createReducer,
  createPayloadReducer,
  withScope,
  createAction,
  useKReducer,
  createStateReducer
} from '@k-frame/core';

const mapWithKey = addIndex(map);

const actions = {
  clear: createAction('clear'),
  setText: createAction('setText'),
  addLine: createAction('addLine'),
  exec: createAction('exec')
};

const reducer = createReducer({ text: '', lines: [] }, [
  createStateReducer(actions.clear, assoc('lines', [])),
  createPayloadReducer(actions.setText, assoc('text')),
  createPayloadReducer(actions.addLine, p =>
    evolve({ lines: append({ text: p, dir: 'out' }) })
  ),
  createPayloadReducer(actions.exec, p =>
    evolve({ lines: append({ text: p, dir: 'in' }) })
  )
]);

const UP = 38;
const DOWN = 40;

const Terminal = withScope(() => {
  const { text, setText, lines, addLine, exec } = useKReducer(reducer, actions);
  const typer = useRef();
  const rootRef = useRef();
  const blur = useCallback(() => {}, []);
  const [currentLine, setCurrentLine] = useState(null);

  const uniqInputLines = useMemo(() =>
    reverse(
      uniq(map(prop('text'), filter(propEq('dir', 'in'), lines), [lines]))
    )
  );

  useEffect(() => {
    rootRef.current.scrollTop = rootRef.current.scrollHeight;
  }, [lines]);

  const acceptLine = useCallback(() => {
    exec(typer.current.value);
    setText('');
  }, []);

  const keyDown = useCallback(
    e => {
      // console.log(e.keyCode);
      if (e.keyCode === 13) {
        e.preventDefault();
        acceptLine();
      } else if (e.keyCode === UP) {
        const newCurrentLine =
          currentLine !== null ? (currentLine + 1) % uniqInputLines.length : 0;
        setCurrentLine(newCurrentLine);
        setText(uniqInputLines[newCurrentLine]);
        setTimeout(() => {
          typer.current.selectionStart = typer.current.selectionEnd =
            typer.current.value.length;
        });
      } else if (e.keyCode === DOWN) {
        const newCurrentLine =
          currentLine !== null
            ? (currentLine + uniqInputLines.length - 1) % uniqInputLines.length
            : uniqInputLines.length - 1;
        setCurrentLine(newCurrentLine);
        setText(uniqInputLines[newCurrentLine]);
        setTimeout(() => {
          typer.current.selectionStart = typer.current.selectionEnd =
            typer.current.value.length;
        });
      }
    },
    [currentLine, uniqInputLines]
  );

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
      ref={rootRef}
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
              {l.dir === 'in' ? '$<' : '$>'}
              <span>{l.text}</span>
            </div>
          ),
          lines
        )}
      </div>
      <div>
        {'$<'}
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

const addLine = actions.addLine;

export { addLine };
