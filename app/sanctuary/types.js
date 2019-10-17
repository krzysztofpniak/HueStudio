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

const HSResolutions = $.StrMap(HSType);

const HSTypeResolution = $.NamedRecordType('hs/HSTypeResolution')(
  'http://example.com/hs#HSTypeResolution'
)([])({
  type: HSType,
  resolutions: HSResolutions
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

const HSInfo = $.NamedRecordType('hs/HSInfo')('http://example.com/hs#HSInfo')(
  []
)({
  signature: $.String
});

const HSContext = $.NamedRecordType('hs/HSContext')(
  'http://example.com/hs#HSContext'
)([])({
  vars: $.Array($.StrMap(HSValue)),
  effects: $.Array(HSEffect),
  infos: $.StrMap(HSInfo)
});

const HSError = $.NamedRecordType('hs/HSError')(
  'http://example.com/hs#HSError'
)([])({ name: $.String, message: $.String });

const HSLibFnGuard = $.Fn($.Array(HSValue))($.Fn(HSContext)($.Maybe(HSError)));

const HSLibFnValue = $.NamedRecordType('hs/HSLibFnValue')(
  'http://example.com/hs#HSLibFnValue'
)([])({ fn: $.Unknown, guard: HSLibFnGuard });

const HSLibFn = $.NamedRecordType('hs/HSLibFn')(
  'http://example.com/hs#HSLibFn'
)([])({ type: HSType, value: HSLibFnValue });

const HueBridgeState = $.NamedRecordType('hs/HueBridgeState')(
  'http://example.com/hs#HueBridgeState'
)([])({ lights: $.StrMap($.Unknown), groups: $.StrMap($.Unknown) });

const BridgeAction = $.NamedRecordType('hs/BridgeAction')(
  'http://example.com/hs#BridgeAction'
)([])({
  address: $.String,
  method: $.String,
  body: $.StrMap($.Unknown)
});

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
const def = $.create({ checkTypes: process.env.NODE_ENV === 'test', env });

export {
  HSTypeKind,
  HSType,
  HSResolutions,
  HSTypeResolution,
  RenamesContext,
  HSEffect,
  HSFnResult,
  HSLibFnGuard,
  HSLibFn,
  HSLibFnValue,
  HueBridgeState,
  BridgeAction,
  HSContext,
  HSValue,
  HSError,
  AstNode,
  CodeLocation,
  def,
  env
};
