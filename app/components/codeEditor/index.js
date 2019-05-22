import React, { Component } from 'react';
import { addIndex, equals, forEach, map, toPairs } from 'ramda';
import { withHandlers, withProps } from 'recompose';
import {
  autoCompleteOpenSelector,
  currentTokenSelector,
  currentTokenValueSelector,
  dropDownPosSelector,
  highlightedContentSelector,
  selectedIndexSelector,
  startKeySelector,
  startOffsetSelector,
  suggestionsActiveElementSelector,
  suggestionsCountSelector,
  suggestionsSelector,
  tokenizedTextSelector
} from './selectors';
import { escapeColumn, getPlainText } from './helpers';
import {
  CompositeDecorator,
  ContentState,
  convertToRaw,
  Editor,
  EditorState,
  getDefaultKeyBinding,
  KeyBindingUtil,
  Modifier,
  SelectionState
} from 'draft-js';
import styles from './styles.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);
const mapWithKey = addIndex(map);
const { isCtrlKeyCommand } = KeyBindingUtil;

const SPACE = 32;

const Suggestion = withHandlers({
  onMouseDown: ({ onClick, value }) => e => {
    e.preventDefault();
    onClick(value);
  }
})(({ onMouseDown, active, template }) => (
  <li className={cx({ active })} onMouseDown={onMouseDown}>
    {template}
  </li>
));

class CodeEditor extends Component {
  constructor(props) {
    super(props);
    this.onCanvasMount = this.onCanvasMount.bind(this);
    this.setDomEditorRef = this.setDomEditorRef.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onSuggestionClick = this.onSuggestionClick.bind(this);
    this.getSelection = this.getSelection.bind(this);
    this.onAutoCompleteRequest = this.onAutoCompleteRequest.bind(this);
    this.onClearIdentifier = this.onClearIdentifier.bind(this);
    this.onDownArrow = this.onDownArrow.bind(this);
    this.onUpArrow = this.onUpArrow.bind(this);
    this.handleReturn = this.handleReturn.bind(this);
    this.onEscape = this.onEscape.bind(this);
    this.onKeyBinding = this.onKeyBinding.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
    this.getTokens = this.getTokens.bind(this);

    const customStyleMap = this.props.customStyleMap;
    const customComponentsMap = this.props.customComponentsMap;

    this.decorators = ((customComponentsMap, customStyleMap, getTokens) => {
      const decorators = map(
        ([type, component]) => ({
          strategy: (contentBlock, callback) => {
            forEach(token => {
              if (token.name === type) {
                callback(token.pos, token.pos + token.value.length);
              }
            }, getTokens());
          },
          component: withProps({
            style: customStyleMap[type],
            type
          })(component)
        }),
        toPairs(customComponentsMap)
      );

      return new CompositeDecorator(decorators);
    })(customComponentsMap, customStyleMap, this.getTokens);
    this.getDecorator = this.getDecorator.bind(this);
    this.state = {
      editorState: EditorState.createEmpty()
    };
  }
  onCanvasMount(r) {
    this.canvas = r;
    if (r) {
      const ctx = this.canvas.getContext('2d');
      ctx.font = '15px "Lucida Console", Monaco, monospace';

      this.characterWidth = ctx.measureText('H').width;
    }
  }
  setDomEditorRef(ref) {
    this.domEditor = ref;
    if (this.props.inputRef) {
      this.props.inputRef(ref);
    }
  }
  onChange(editorState) {
    this.setState({ editorState });
    const content = convertToRaw(editorState.getCurrentContent());
    const selection = editorState.getSelection();

    const newTokenValue = currentTokenValueSelector(null, {
      ...this.props,
      value: {
        ...this.props.value,
        content,
        startKey: selection.getStartKey(),
        startOffset: selection.getStartOffset()
      }
    });

    const autoCompleteOpen =
      this.props.value.autoCompleteOpen && selection.getHasFocus();

    const payload = {
      ...this.props.value,
      content,
      startKey: selection.getStartKey(),
      startOffset: selection.getStartOffset(),
      autoCompleteOpen,
      characterWidth: this.characterWidth,
      selectedIndex: 0
    };

    if (!equals(this.props.value, payload)) {
      this.props.onChange(payload);
    }
  }
  onSuggestionClick(item, close = true) {
    const startKey = startKeySelector(null, this.props);
    const startOffset = startOffsetSelector(null, this.props);
    const token = currentTokenSelector(null, this.props);

    const insertPos =
      token.name === 'WHITESPACE' ? startOffset : token.column - 1;
    const insertFocus =
      insertPos +
      (token.name === 'WHITESPACE' ||
      token.name === 'COMMA' ||
      token.name === 'EOF'
        ? 0
        : token.value.length);

    const selectionState = SelectionState.createEmpty(startKey).merge({
      anchorOffset: insertPos,
      focusOffset: insertFocus
    });

    const content = highlightedContentSelector(null, this.props);

    const escapedColumn = item;

    const newContent = convertToRaw(
      Modifier.replaceText(content, selectionState, escapedColumn)
    );

    const selectionAfterClick = SelectionState.createEmpty(startKey).merge({
      anchorOffset: insertPos + escapedColumn.length,
      focusOffset: insertPos + escapedColumn.length
    });

    const payload = {
      ...this.props.value,
      content: newContent,
      startOffset: insertPos + escapedColumn.length,
      autoCompleteOpen: !close
    };
    this.props.onChange(payload);

    this.setState({
      editorState: EditorState.forceSelection(
        this.state.editorState,
        selectionAfterClick
      )
    });
  }
  getSelection() {
    return this.state.editorState.getSelection();
  }
  onAutoCompleteRequest() {
    const payload = {
      ...this.props.value,
      autoCompleteOpen: true,
      selectedIndex: 0
    };
    this.props.onChange(payload);
  }
  onClearIdentifier(e) {
    e.preventDefault();
    this.onSuggestionClick('', false);
  }
  onDownArrow(e) {
    if (autoCompleteOpenSelector(null, this.props)) {
      e.preventDefault();
      const suggestionsCount = suggestionsCountSelector(null, this.props);
      const selectedIndex =
        (this.props.value.selectedIndex + 1) % suggestionsCount;

      const payload = {
        ...this.props.value,
        selectedIndex
      };
      this.props.onChange(payload);
    }
  }
  onUpArrow(e) {
    if (autoCompleteOpenSelector(null, this.props)) {
      e.preventDefault();
      const suggestionsCount = suggestionsCountSelector(null, this.props);
      const selectedIndex =
        (this.props.value.selectedIndex - 1 + suggestionsCount) %
        suggestionsCount;

      const payload = {
        ...this.props.value,
        selectedIndex
      };
      this.props.onChange(payload);
    }
  }
  handleReturn(e) {
    if (autoCompleteOpenSelector(null, this.props)) {
      const activeItem = suggestionsActiveElementSelector(null, this.props);
      this.onSuggestionClick(activeItem[this.props.valueProp]);

      return true;
    }
    return false;
  }
  onKeyBinding(e) {
    if (e.keyCode === SPACE && isCtrlKeyCommand(e)) {
      return 'auto-complete';
    } else if (e.keyCode === SPACE && this.props.value.autoCompleteOpen) {
      const payload = {
        ...this.props.value,
        autoCompleteOpen: false
      };
      this.props.onChange(payload);
      return getDefaultKeyBinding(e);
    }
    return getDefaultKeyBinding(e);
  }
  handleKeyCommand(command) {
    if (command === 'auto-complete') {
      this.onAutoCompleteRequest();
      return 'handled';
    }
    return 'not-handled';
  }
  onEscape() {
    const payload = {
      ...this.props.value,
      autoCompleteOpen: false
    };
    this.props.onChange(payload);
  }
  getTokens() {
    return tokenizedTextSelector(null, this.props);
  }
  getDecorator() {
    const customStyleMap = this.props.customStyleMap;
    const customComponentsMap = this.props.customComponentsMap;

    return this.getDecorators(
      customComponentsMap,
      customStyleMap,
      this.getTokens
    );
  }
  render() {
    const {
      className,
      customStyleMap,
      id,
      suggestionTemplate,
      valueProp
    } = this.props;
    return (
      <div className={className} id={id} onClick={() => this.domEditor.focus()}>
        <div className="autoComplete" style={{ position: 'relative' }}>
          <Editor
            customStyleMap={customStyleMap}
            editorState={EditorState.acceptSelection(
              EditorState.createWithContent(
                highlightedContentSelector(null, this.props),
                this.decorators
              ),
              this.getSelection()
            )}
            readOnly={this.props.readOnly}
            handleReturn={this.handleReturn}
            onChange={this.onChange}
            onEscape={this.onEscape}
            onUpArrow={this.onUpArrow}
            onDownArrow={this.onDownArrow}
            keyBindingFn={this.onKeyBinding}
            handleKeyCommand={this.handleKeyCommand}
            ref={this.setDomEditorRef}
          />
          {autoCompleteOpenSelector(null, this.props) &&
            suggestionsCountSelector(null, this.props) > 0 && (
              <div
                style={{
                  position: 'absolute',
                  ...dropDownPosSelector(null, this.props)
                }}
                className={cx('suggestions')}
              >
                <ul>
                  {mapWithKey(
                    (e, idx) => (
                      <Suggestion
                        active={selectedIndexSelector(null, this.props) === idx}
                        key={idx}
                        value={valueProp ? e[valueProp] : e}
                        template={suggestionTemplate(e)}
                        onClick={this.onSuggestionClick}
                      />
                    ),
                    suggestionsSelector(null, this.props)
                  )}
                </ul>
                <button
                  type="button"
                  className="btn btn-default btn-xs"
                  onMouseDown={this.onClearIdentifier}
                >
                  Clear
                </button>
              </div>
            )}
          <div>
            {false && (
              <pre>
                {JSON.stringify(
                  currentTokenValueSelector(null, this.props),
                  null,
                  2
                )}
              </pre>
            )}
            <canvas style={{ display: 'none' }} ref={this.onCanvasMount} />
          </div>
        </div>
      </div>
    );
  }
}

export default CodeEditor;

const getInitialValue = text => ({
  content: convertToRaw(ContentState.createFromText(text || '')),
  characterWidth: 9,
  startOffset: 0,
  selectedIndex: 0
});

export { getInitialValue, getPlainText };
