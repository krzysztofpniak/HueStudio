import { resolveCall } from '../../../app/hueScript/resolveType';
import { scalar, fn, constraint } from '../../../app/hueScript/typeSystem';

describe('resolveCall', () => {
  it('should resolve (), (() -> Number) into Number', () => {
    expect(resolveCall([], fn(scalar('Number')))).toEqual(scalar('Number'));
  });

  it('should resolve (Number), (Number -> Group) into Group', () => {
    expect(
      resolveCall([scalar('Number')], fn(scalar('Number'), scalar('Group')))
    ).toEqual(scalar('Group'));
  });

  it('should resolve (Number), (Number -> Group -> Group) into (Group -> Group)', () => {
    expect(
      resolveCall(
        [scalar('Number')],
        fn(scalar('Number'), scalar('Group'), scalar('Group'))
      )
    ).toEqual(fn(scalar('Group'), scalar('Group')));
  });

  it('should resolve (Number), (Number -> a -> a) into (a -> a)', () => {
    expect(
      resolveCall(
        [scalar('Number')],
        constraint(
          { a: ['Light', 'Group'] },
          fn(scalar('Number'), scalar('a'), scalar('a'))
        )
      )
    ).toEqual(
      constraint({ a: ['Light', 'Group'] }, fn(scalar('a'), scalar('a')))
    );
  });

  it('should resolve (Number, Group), (Number -> a -> a) into Group', () => {
    expect(
      resolveCall(
        [scalar('Number'), scalar('Group')],
        constraint(
          { a: ['Light', 'Group'] },
          fn(scalar('Number'), scalar('a'), scalar('a'))
        )
      )
    ).toEqual(scalar('Group'));
  });
});
