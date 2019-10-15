import {
  createHSContext,
  translateFunctionExpression
} from '../../../app/hueScript/astToBridgeState';
import { scalar, typedValue, fn } from '../../../app/hueScript/typeSystem';
import { fromEither, Just, Left, Nothing, Right } from '../../../app/sanctuary';
import { parseHue } from '../../../app/hueScript';
import typeMismatchError from '../../../app/hueScript/typeSystem/typeMismatchError';

const fnAst1 = fromEither({})(parseHue('() => 1')).body[0].expression;
const fnAst2 = fromEither({})(parseHue('(x) => x')).body[0].expression;

describe('translateFunctionExpression', () => {
  it('should translate nullary fn', () => {
    // arrange
    const context = createHSContext({ lights: {}, groups: {} });
    // act
    const [rValue, rContext] = fromEither([
      typedValue(scalar('Left'))(null),
      createHSContext({ lights: {}, groups: {} })
    ])(translateFunctionExpression(fnAst1)(context));
    // assert
    expect(rValue.type).toEqual(fn([scalar('Number')]));
    expect(rValue.value.fn()).toEqual(1);
  });
  it('should translate unary fn', () => {
    // arrange
    const context = createHSContext({ lights: {}, groups: {} });
    // act
    const [rValue, rContext] = fromEither([
      typedValue(scalar('Left'))(null),
      context
    ])(translateFunctionExpression(fnAst2)(context));
    // assert
    expect(rValue.type).toEqual(fn([scalar('a')]));
    expect(rValue.value.fn(2)).toEqual(2);
  });
});
