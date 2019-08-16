import { constraint, scalar, fn } from '../../../app/hueScript/typeSystem';

const aNumberString = { a: ['Number', 'String'] };
const bNumberString = { b: ['Number', 'String'] };

const abNumberString = { ...aNumberString, ...bNumberString };

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
  it('should remove constraint if not needed', () => {
    expect(constraint(aNumberString, scalar('Number'))).toEqual(
      scalar('Number')
    );
  });
  it('should reduce constraint to minimal set', () => {
    expect(constraint(abNumberString, scalar('a'))).toEqual({
      kind: 'Constraint',
      of: aNumberString,
      in: scalar('a')
    });
  });
});
