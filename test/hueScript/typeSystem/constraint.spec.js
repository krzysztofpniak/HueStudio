import { constraint, scalar, fn } from '../../../app/hueScript/typeSystem';

const aNumberString = { a: ['Number', 'String'] };
const bNumberString = { b: ['Number', 'String'] };

describe('constraint', () => {
  it('should add constraint', () => {
    expect(constraint(aNumberString, scalar('a'))).toEqual({
      kind: 'Constraint',
      of: aNumberString,
      in: scalar('a')
    });
  });
  it('should concat constraints', () => {
    expect(
      constraint(
        bNumberString,
        constraint(aNumberString, fn(scalar('a'), scalar('b')))
      )
    ).toEqual({
      kind: 'Constraint',
      of: { ...aNumberString, ...bNumberString },
      in: fn(scalar('a'), scalar('b'))
    });
  });
});
