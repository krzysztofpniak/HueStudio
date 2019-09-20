import {
  createHSContext,
  translateLiteral
} from '../../../app/hueScript/astToBridgeState';
import { scalar } from '../../../app/hueScript/typeSystem';
import { fromEither, Right } from '../../../app/sanctuary';
import { parseHue } from '../../../app/hueScript';

const literalAst1 = fromEither({})(parseHue('true;')).body[0].expression;
const literalAst2 = fromEither({})(parseHue('1;')).body[0].expression;
const literalAst3 = fromEither({})(parseHue("'Hello';")).body[0].expression;

describe('translateLiteral', () => {
  it('should translate boolean literal', () => {
    const context = createHSContext({ lights: {}, groups: {} });
    expect(translateLiteral(literalAst1)(context)).toEqual(
      Right([{ type: scalar('Boolean'), value: true }, context])
    );
  });
  it('should translate number literal', () => {
    const context = createHSContext({ lights: {}, groups: {} });
    expect(translateLiteral(literalAst2)(context)).toEqual(
      Right([{ type: scalar('Number'), value: 1 }, context])
    );
  });
  it('should translate string literal', () => {
    const context = createHSContext({ lights: {}, groups: {} });
    expect(translateLiteral(literalAst3)(context)).toEqual(
      Right([{ type: scalar('String'), value: 'Hello' }, context])
    );
  });
});
