import {
  createHSContext,
  putContextVar,
  translateMemberExpression
} from '../../../app/hueScript/astToBridgeState';
import { scalar, fn } from '../../../app/hueScript/typeSystem';
import { Left, Right, pipe } from '../../../app/sanctuary';
import { parseHue } from '../../../app/hueScript';
import typeMismatchError from '../../../app/hueScript/typeSystem/typeMismatchError';

const memberAst1 = parseHue('a.hello;').data.body[0].expression;

const hello = {
  type: fn([scalar('String'), scalar('String')]),
  value: name => `Hi ${name}!`
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
    ])(createHSContext());
    expect(translateMemberExpression(memberAst1)(context)).toEqual(
      Right([{ type: scalar('String'), value: 'World!' }, context])
    );
  });
});
