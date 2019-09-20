import {
  createHSContext,
  translateConditionalExpression
} from '../../../app/hueScript/astToBridgeState';
import { scalar } from '../../../app/hueScript/typeSystem';
import { fromEither, Just, Left, Nothing, Right } from '../../../app/sanctuary';
import { parseHue } from '../../../app/hueScript';
import typeMismatchError from '../../../app/hueScript/typeSystem/typeMismatchError';

const conditionalAst1 = fromEither({})(parseHue('true ? 1 : 2;')).body[0]
  .expression;
const conditionalAst2 = fromEither({})(parseHue('false ? 1 : 2;')).body[0]
  .expression;
const conditionalAst3 = fromEither({})(parseHue('1 ? 1 : 2;')).body[0]
  .expression;

describe('translateConditionalExpression', () => {
  it('should use consequent value', () => {
    const context = createHSContext({ lights: {}, groups: {} });
    expect(translateConditionalExpression(conditionalAst1)(context)).toEqual(
      Right([{ type: scalar('Number'), value: 1 }, context])
    );
  });
  it('should use alternate value', () => {
    const context = createHSContext({ lights: {}, groups: {} });
    expect(translateConditionalExpression(conditionalAst2)(context)).toEqual(
      Right([{ type: scalar('Number'), value: 2 }, context])
    );
  });
  it('should return Left when test type is not Boolean scalar', () => {
    const context = createHSContext({ lights: {}, groups: {} });
    expect(translateConditionalExpression(conditionalAst3)(context)).toEqual(
      Left(
        typeMismatchError(scalar('Boolean'))(scalar('Number'))(
          Just(conditionalAst3.test.location)
        )
      )
    );
  });
});
