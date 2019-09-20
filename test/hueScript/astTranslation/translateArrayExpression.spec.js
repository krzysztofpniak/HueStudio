import {
  createHSContext,
  translateArrayExpression
} from '../../../app/hueScript/astToBridgeState';
import {
  scalar,
  array,
  typedValue,
  constraint
} from '../../../app/hueScript/typeSystem';
import { fromEither, Right } from '../../../app/sanctuary';
import { parseHue } from '../../../app/hueScript';

const arrayAst1 = fromEither({})(parseHue('[1];')).body[0].expression;
const arrayAst2 = fromEither({})(parseHue('[1, 2, 3];')).body[0].expression;
const arrayAst3 = fromEither({})(parseHue("[1, '2', 3];")).body[0].expression;

const stringValue = typedValue(scalar('String'));
const numberValue = typedValue(scalar('Number'));

describe('translateArrayExpression', () => {
  it('should translate single number array', () => {
    const context = createHSContext({ lights: {}, groups: {} });
    expect(translateArrayExpression(arrayAst1)(context)).toEqual(
      Right([typedValue(array(scalar('Number')))([numberValue(1)]), context])
    );
  });
  it('should translate multi numbers array', () => {
    const context = createHSContext({ lights: {}, groups: {} });
    expect(translateArrayExpression(arrayAst2)(context)).toEqual(
      Right([
        typedValue(array(scalar('Number')))([
          numberValue(1),
          numberValue(2),
          numberValue(3)
        ]),
        context
      ])
    );
  });
  it('should translate mixed array', () => {
    const context = createHSContext({ lights: {}, groups: {} });
    expect(translateArrayExpression(arrayAst3)(context)).toEqual(
      Right([
        typedValue(constraint({ a: ['Number', 'String'] })(array(scalar('a'))))(
          [numberValue(1), stringValue('2'), numberValue(3)]
        ),
        context
      ])
    );
  });
});
