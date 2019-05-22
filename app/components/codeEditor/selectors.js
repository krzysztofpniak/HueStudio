import { createSelector } from 'reselect';
import {
  addIndex,
  always,
  call,
  complement,
  compose,
  concat,
  cond,
  filter,
  findIndex,
  flip,
  isNil,
  length,
  map,
  max,
  nth,
  prop,
  propEq,
  propOr,
  sum,
  T,
  takeWhile
} from 'ramda';
import { convertFromRaw } from 'draft-js';
import { addContext, getPlainText, getTokenAt } from './helpers';

const mapWithKey = addIndex(map);

const tokenizeSelector = (_, { tokenize }) => tokenize;
const valueSelector = (_, { value }) => value;
const contentSelector = (_, { value }) => value.content;
const startKeySelector = (_, { value }) => value.startKey;
const startOffsetSelector = (_, { value }) => value.startOffset;
const suggestionsTransformSelector = (_, { suggestionsTransform }) =>
  suggestionsTransform;
const simpleSuggestionsSelector = (_, { suggestions }) => suggestions;
const selectedIndexSelector = (_, { value }) => value.selectedIndex;
const autoCompleteOpenSelector = (_, { value }) => value.autoCompleteOpen;
const characterWidthSelector = (_, { value }) => value.characterWidth;
const errorsRawSelector = (_, { errors }) => errors;
const customStyleMapSelector = (_, { customStyleMap }) => customStyleMap;

const tokenToInlineStyle = x => ({
  offset: x.pos,
  length: x.value.length,
  style: x.name
});
const findInObj = flip(prop);

const translateTokens = (colorMap, tokens) =>
  compose(
    map(tokenToInlineStyle),
    filter(
      compose(
        findInObj(colorMap),
        prop('name')
      )
    )
  )(tokens);

const getErrorsForLine = (line, errors) => {
  return map(
    e => ({
      offset: e.start.column - 1,
      length: max(e.end.offset - e.start.offset, 1),
      style: 'error'
    }),
    filter(e => e.start.line === line, errors)
  );
};

const colorize = (errors, content, tokenize, customStyles) => ({
  blocks: mapWithKey(
    (t, idx) => ({
      ...t,
      inlineStyleRanges: concat(
        translateTokens(customStyles, tokenize(t.text)),
        getErrorsForLine(idx + 1, errors)
      )
    }),
    content.blocks
  ),
  entityMap: {}
});

const highlightedContentSelector = createSelector(
  errorsRawSelector,
  contentSelector,
  tokenizeSelector,
  customStyleMapSelector,
  compose(
    convertFromRaw,
    colorize
  )
);

const plainTextSelector = createSelector(
  valueSelector,
  getPlainText
);

const currentLineSelector = createSelector(
  startKeySelector,
  contentSelector,
  (startKey, content) => findIndex(propEq('key', startKey), content.blocks)
);

const tokenizedTextSelector = createSelector(
  tokenizeSelector,
  plainTextSelector,
  compose(
    addContext,
    call
  )
);

const absoluteOffsetSelector = createSelector(
  contentSelector,
  startKeySelector,
  startOffsetSelector,
  (content, startKey, startOffset) =>
    compose(
      sum,
      map(x => x.text.length + 1),
      takeWhile(complement(propEq('key', startKey)))
    )(content.blocks) + startOffset
);

const currentTokenSelector = createSelector(
  absoluteOffsetSelector,
  tokenizedTextSelector,
  getTokenAt
);

const currentTokenTypeSelector = createSelector(
  currentTokenSelector,
  propOr('none', 'name')
);

const currentTokenContextSelector = createSelector(
  currentTokenSelector,
  propOr('none', 'context')
);

const currentTokenValueSelector = createSelector(
  currentTokenSelector,
  cond([
    [isNil, always('')],
    [x => x.name === 'IDENTIFIER', prop('value')],
    [T, always('')]
  ])
);

const tokenSelectionOffsetSelector = createSelector(
  currentTokenTypeSelector,
  absoluteOffsetSelector,
  currentTokenSelector,
  (currentTokenType, pos, token) =>
    token && currentTokenType !== 'WHITESPACE' ? pos - token.pos : 0
);

const dropDownPosSelector = createSelector(
  startOffsetSelector,
  currentLineSelector,
  tokenSelectionOffsetSelector,
  characterWidthSelector,
  (startOffset, currentLine, tokenSelectionOffset, characterWidth) => ({
    top: (currentLine === -1 ? 0 : currentLine) * 21 + 21,
    left: (startOffset - tokenSelectionOffset) * characterWidth - 12
  })
);

const isSelectionInsideTokenSelector = createSelector(
  currentTokenSelector,
  token => !!token
);

const suggestionsSelector = createSelector(
  currentTokenSelector,
  currentTokenValueSelector,
  suggestionsTransformSelector,
  simpleSuggestionsSelector,
  (currentToken, currentTokenValue, suggestionsTransform, suggestions) =>
    suggestionsTransform(currentToken, currentTokenValue, suggestions)
);

const suggestionsActiveElementSelector = createSelector(
  selectedIndexSelector,
  suggestionsSelector,
  nth
);

const suggestionsCountSelector = createSelector(
  suggestionsSelector,
  length
);

export {
  startKeySelector,
  startOffsetSelector,
  selectedIndexSelector,
  autoCompleteOpenSelector,
  highlightedContentSelector,
  currentLineSelector,
  dropDownPosSelector,
  currentTokenSelector,
  currentTokenTypeSelector,
  currentTokenContextSelector,
  currentTokenValueSelector,
  tokenSelectionOffsetSelector,
  isSelectionInsideTokenSelector,
  suggestionsSelector,
  suggestionsActiveElementSelector,
  suggestionsCountSelector,
  tokenizedTextSelector,
  absoluteOffsetSelector
};
