import {
  createHSContext,
  putContextVar,
  translateMemberExpression
} from '../../../app/hueScript/astToBridgeState';
import { scalar, fn } from '../../../app/hueScript/typeSystem';
import { Left, Right, pipe, fromEither, Nothing } from '../../../app/sanctuary';
import { parseHue } from '../../../app/hueScript';
import typeMismatchError from '../../../app/hueScript/typeSystem/typeMismatchError';
import { hsPureResult } from '../../../app/hueScript/typeSystem/helpers';

const memberAst1 = fromEither({})(parseHue('a.hello;')).body[0].expression;

const hello = {
  type: fn([scalar('String'), scalar('String')]),
  value: {
    fn: name => hsPureResult(scalar('String'))(`Hi ${name.value}!`),
    guard: () => () => Nothing
  }
};

const a = {
  type: scalar('String'),
  value: 'John'
};

describe('translateMemberExpression', () => {
  it('should translate valid nullary call', () => {
    const context = pipe([
      putContextVar('hello')(hello),
      putContextVar('a')(a)
    ])(createHSContext({ lights: {}, groups: {} }));
    expect(translateMemberExpression(memberAst1)(context)).toEqual(
      Right([{ type: scalar('String'), value: 'Hi John!' }, context])
    );
  });
});
