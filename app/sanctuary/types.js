import $ from 'sanctuary-def';

// HSTypeKind :: Type
const HSTypeKind = $.EnumType('hs/HSTypeKind')(
  'http://example.com/hs#TypeKind'
)(['Scalar', 'Array', 'Function']);

// HSType :: Type
const HSType = $.NamedRecordType('hs/HSType')('http://example.com/hs#HSType')(
  []
)({
  kind: HSTypeKind,
  constraints: $.StrMap($.Array($.String))
});

const HSTypeResolution = $.NamedRecordType('hs/HSTypeResolution')(
  'http://example.com/hs#HSTypeResolution'
)([])({
  type: HSType,
  resolutions: $.StrMap(HSType)
});

// RenamesContext :: Type
const RenamesContext = $.NamedRecordType('hs/RenamesContext')(
  'http://example.com/hs#RenamesContext'
)([])({ start: $.NonNegativeInteger, renames: $.StrMap($.String) });

const HSValue = $.NamedRecordType('hs/HSValue')(
  'http://example.com/hs#HSValue'
)([])({ value: $.Unknown, type: HSType });

const HSEffect = $.NamedRecordType('hs/HSEffect')(
  'http://example.com/hs#HSEffect'
)([])({ name: $.String, params: $.StrMap($.Unknown) });

const HSFnResult = $.NamedRecordType('hs/HSFnResult')(
  'http://example.com/hs#HSFnResult'
)([])({ result: HSValue, effects: $.Array(HSEffect) });

const HSContext = $.NamedRecordType('hs/HSContext')(
  'http://example.com/hs#HSContext'
)([])({
  vars: $.Array($.StrMap(HSValue)),
  effects: $.Array(HSEffect),
  infos: $.StrMap($.String)
});

const HSError = $.NamedRecordType('hs/HSError')(
  'http://example.com/hs#HSError'
)([])({ name: $.String, message: $.String });

const AstNode = $.NamedRecordType('hs/AstNode')(
  'http://example.com/hs#AstNode'
)([])({ type: $.String });

const CodeLocationAnchor = $.NamedRecordType('hs/CodeLocation')(
  'http://example.com/hs#CodeLocation'
)([])({
  offset: $.NonNegativeInteger,
  line: $.NonNegativeInteger,
  column: $.NonNegativeInteger
});

const CodeLocation = $.NamedRecordType('hs/CodeLocation')(
  'http://example.com/hs#CodeLocation'
)([])({ start: CodeLocationAnchor, end: CodeLocationAnchor });

const PolyArray = $.Array($.Unknown);

const env = $.env.concat([
  HSTypeKind,
  HSType,
  HSTypeResolution,
  RenamesContext,
  HSContext,
  AstNode,
  CodeLocationAnchor,
  CodeLocation,
  PolyArray
]);
const def = $.create({ checkTypes: true, env });

export {
  HSTypeKind,
  HSType,
  HSTypeResolution,
  RenamesContext,
  HSEffect,
  HSFnResult,
  HSContext,
  HSValue,
  HSError,
  AstNode,
  CodeLocation,
  def,
  env
};
