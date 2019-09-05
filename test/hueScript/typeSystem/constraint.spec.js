import {
  constraint,
  scalar,
  fn,
  array
} from '../../../app/hueScript/typeSystem';

const aNumberString = { a: ['Number', 'String'] };
const bNumberString = { b: ['Number', 'String'] };

const abNumberString = { ...aNumberString, ...bNumberString };

describe('constraint', () => {
  it('should add constraint to scalar', () => {
    expect(constraint(aNumberString)(scalar('a'))).toEqual({
      ...scalar('a'),
      constraints: aNumberString
    });
  });
  it('should add constraint to array of scalar', () => {
    expect(constraint(aNumberString)(array(scalar('a')))).toEqual({
      ...array(scalar('a')),
      constraints: aNumberString
    });
  });
  it('should concat constraints', () => {
    expect(
      constraint(bNumberString)(
        constraint(aNumberString)(fn([scalar('a'), scalar('b')]))
      )
    ).toEqual({
      ...fn([scalar('a'), scalar('b')]),
      constraints: { ...aNumberString, ...bNumberString }
    });
  });
  it('should remove constraint if not needed', () => {
    expect(constraint(aNumberString)(scalar('Number'))).toEqual(
      scalar('Number')
    );
  });
  it('should reduce constraint to minimal set', () => {
    expect(constraint(abNumberString)(scalar('a'))).toEqual({
      ...scalar('a'),
      constraints: aNumberString
    });
  });
});
