import {
  createHSContext,
  putContextEffects,
  putContextVar,
  translateCallExpression
} from '../../../app/hueScript/astToBridgeState';
import { scalar, fn, typedValue } from '../../../app/hueScript/typeSystem';
import { fromEither, Just, Left, Right, id } from '../../../app/sanctuary';
import { parseHue } from '../../../app/hueScript';
import typeMismatchError from '../../../app/hueScript/typeSystem/typeMismatchError';
import {
  hsPureResult,
  hsResult
} from '../../../app/hueScript/typeSystem/helpers';

const callAst1 = fromEither({})(parseHue('hello();')).body[0].expression;
const callAst2 = fromEither({})(parseHue('a(1);')).body[0].expression;
const callAst3 = fromEither({})(parseHue("a('a');")).body[0].expression;

describe('translateCallExpression', () => {
  it('should translate valid nullary call', () => {
    const context = putContextVar('hello')({
      type: fn([scalar('String')]),
      value: () => hsPureResult(scalar('String'))('World!')
    })(createHSContext());
    expect(translateCallExpression(callAst1)(context)).toEqual(
      Right([{ type: scalar('String'), value: 'World!' }, context])
    );
  });
  it('should translate valid unary call', () => {
    const context = putContextVar('a')({
      type: fn([scalar('Number'), scalar('Number')]),
      value: a => hsPureResult(scalar('Number'))(a.value + 1)
    })(createHSContext());
    expect(translateCallExpression(callAst2)(context)).toEqual(
      Right([{ type: scalar('Number'), value: 2 }, context])
    );
  });
  it('should translate valid curry call', () => {
    //arrange
    const context = putContextVar('a')({
      type: fn([scalar('a'), scalar('a'), scalar('a')]),
      value: (a, b) => hsPureResult(scalar('Number'))(a.value + b.value)
    })(createHSContext());
    //act
    const [rValue, rContext] = fromEither({})(
      translateCallExpression(callAst2)(context)
    );
    //assert
    expect(rValue.type).toEqual(fn([scalar('Number'), scalar('Number')]));
    expect(rValue.value(typedValue(scalar('Number'))(2))).toEqual(
      typedValue(scalar('Number'))(3)
    );
  });
  it('should translate side effects call', () => {
    const context = putContextVar('a')({
      type: fn([scalar('Number'), scalar('Void')]),
      value: a =>
        hsResult(scalar('Void'))(null)([
          { name: 'delay', params: { ms: a.value } }
        ])
    })(createHSContext());
    expect(translateCallExpression(callAst2)(context)).toEqual(
      Right([
        { type: scalar('Void'), value: null },
        putContextEffects([{ name: 'delay', params: { ms: 1 } }])(context)
      ])
    );
  });
  it('should fail on non functions callee`s', () => {
    const context = putContextVar('a')({
      type: scalar('Number'),
      value: 1
    })(createHSContext());
    expect(translateCallExpression(callAst2)(context)).toEqual(
      Left(
        typeMismatchError(fn([]))(scalar('Number'))(
          Just(callAst2.callee.location)
        )
      )
    );
  });
  it('should fail wrong arg type', () => {
    const context = putContextVar('a')({
      type: fn([scalar('Number'), scalar('Number')]),
      value: a => a + 1
    })(createHSContext());
    expect(translateCallExpression(callAst3)(context)).toEqual(
      Left(
        typeMismatchError(scalar('Number'))(scalar('String'))(
          Just(callAst3.arguments[0].location)
        )
      )
    );
  });
});
