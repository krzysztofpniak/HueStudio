import {
  createHSContext,
  translateIfStatement
} from '../../../app/hueScript/astToBridgeState';
import { scalar } from '../../../app/hueScript/typeSystem';
import { fromEither, Left, Nothing, Right } from '../../../app/sanctuary';
import { parseHue } from '../../../app/hueScript';
import typeMismatchError from '../../../app/hueScript/typeSystem/typeMismatchError';

const ifAst1 = fromEither({})(parseHue('if (true) 1')).body[0];

describe('translateIfStatement', () => {
  it('should use consequent statement', () => {
    const context = createHSContext({ lights: {}, groups: {} });
    expect(translateIfStatement(ifAst1)(context)).toEqual(Right(context));
  });
});
