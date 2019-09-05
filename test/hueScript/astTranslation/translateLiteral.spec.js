import {
  createHSContext,
  translateLiteral
} from '../../../app/hueScript/astToBridgeState';
import { scalar } from '../../../app/hueScript/typeSystem';
import { Right } from '../../../app/sanctuary';
import { parseHue } from '../../../app/hueScript';

const literalAst = parseHue('1;').data.body[0].expression;

describe('translateLiteral', () => {
  it('should translate number literal', () => {
    const context = createHSContext();
    expect(translateLiteral(literalAst)(context)).toEqual(
      Right([{ type: scalar('Number'), value: 1 }, context])
    );
  });
});
