import {
  createHSContext,
  putContextVar,
  translateCallExpression
} from '../../../app/hueScript/astToBridgeState';
import { scalar, fn } from '../../../app/hueScript/typeSystem';
import { Right } from '../../../app/sanctuary';
import { parseHue } from '../../../app/hueScript';

const callAst1 = parseHue('hello();').data.body[0].expression;
const callAst2 = parseHue('a(1);').data.body[0].expression;

describe('translateCallExpression', () => {
  it('should translate valid nullary call', () => {
    const context = putContextVar('hello')({
      type: fn([scalar('String')]),
      value: () => 'World!'
    })(createHSContext());
    expect(translateCallExpression(callAst1)(context)).toEqual(
      Right([{ type: scalar('String'), value: 'World!' }, context])
    );
  });
  it('should translate valid unary call', () => {
    const context = putContextVar('a')({
      type: fn([scalar('Number'), scalar('Number')]),
      value: a => a + 1
    })(createHSContext());
    expect(translateCallExpression(callAst2)(context)).toEqual(
      Right([{ type: scalar('Number'), value: 2 }, context])
    );
  });
  it('should translate valid curry call', () => {
    const context = putContextVar('a')({
      type: fn([scalar('a'), scalar('a'), scalar('a')]),
      value: (a, b) => a + b
    })(createHSContext());
    expect(translateCallExpression(callAst2)(context)).toMatchObject(
      Right([{ type: fn([scalar('Number'), scalar('Number')]) }, context])
    );
  });
  it('should fail on non functions callee`s', () => {
    const context = putContextVar('a')({
      type: scalar('Number'),
      value: 1
    })(createHSContext());
    expect(translateCallExpression(callAst2)(context)).toEqual(Right({}));
  });
});
