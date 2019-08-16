import { resolveCall } from '../../../app/hueScript/resolveType';
import {
  scalar,
  array,
  fn,
  constraint
} from '../../../app/hueScript/typeSystem';
import { Left, Right } from '../../../app/sanctuary';
import typeMismatchError from '../../../app/hueScript/typeSystem/typeMismatchError';

describe('resolveCall', () => {
  it('should resolve (), (() -> Number) into Number', () => {
    expect(resolveCall([], fn(scalar('Number')))).toEqual(
      Right(scalar('Number'))
    );
  });

  it('should resolve (Number), (Number -> Group) into Group', () => {
    expect(
      resolveCall([scalar('Number')], fn(scalar('Number'), scalar('Group')))
    ).toEqual(Right(scalar('Group')));
  });

  it('should resolve (Number), (Number -> Group -> Group) into (Group -> Group)', () => {
    expect(
      resolveCall(
        [scalar('Number')],
        fn(scalar('Number'), scalar('Group'), scalar('Group'))
      )
    ).toEqual(Right(fn(scalar('Group'), scalar('Group'))));
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
      Right(constraint({ a: ['Light', 'Group'] }, fn(scalar('a'), scalar('a'))))
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
    ).toEqual(Right(scalar('Group')));
  });

  it('should not resolve (Number, Number), (Number -> a -> a) with constraint', () => {
    expect(
      resolveCall(
        [scalar('Number'), scalar('Number')],
        constraint(
          { a: ['Light', 'Group'] },
          fn(scalar('Number'), scalar('a'), scalar('a'))
        )
      )
    ).toEqual(
      Left({
        ...typeMismatchError(
          constraint({ a: ['Light', 'Group'] }, scalar('a')),
          scalar('Number')
        ),
        argIdx: 1
      })
    );
  });

  it('should resolve (Number -> Group), ((a -> b) -> [a] -> [b]) into ([Number] -> [Group])', () => {
    expect(
      resolveCall(
        [fn(scalar('Number'), scalar('Group'))],
        fn(fn(scalar('a'), scalar('b')), array(scalar('a')), array(scalar('b')))
      )
    ).toEqual(Right(fn(array(scalar('Number')), array(scalar('Group')))));
  });
});
