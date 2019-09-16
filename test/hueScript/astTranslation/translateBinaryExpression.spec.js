import {
  createHSContext,
  translateBinaryExpression
} from '../../../app/hueScript/astToBridgeState';
import { scalar } from '../../../app/hueScript/typeSystem';
import { fromEither, Left, Nothing, Right } from '../../../app/sanctuary';
import { parseHue } from '../../../app/hueScript';
import typeMismatchError from '../../../app/hueScript/typeSystem/typeMismatchError';

const binaryAst1 = fromEither({})(parseHue('a == 2;')).body[0].expression;

describe('translateBinaryExpression', () => {
  it('should use consequent value', () => {
    const context = createHSContext();
    expect(translateBinaryExpression(binaryAst1)(context)).toEqual(
      Right([{ type: scalar('Boolean'), value: true }, context])
    );
  });
});
