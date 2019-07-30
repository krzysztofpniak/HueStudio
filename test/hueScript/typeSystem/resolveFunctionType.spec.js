import { resolveFunctionType } from '../../../app/hueScript/resolveType';
import { scalar, fn, array } from '../../../app/hueScript/typeSystem';

describe('resolveFunctionType', () => {
  it('should resolve (Number), (Number -> Number) into (Number -> Number)', () => {
    expect(
      resolveFunctionType(
        fn(scalar('Number')),
        fn(scalar('Number'), scalar('Number'))
      )
    ).toEqual(fn(scalar('Number'), scalar('Number')));
  });

  it('should resolve (Number), (a -> a -> a) into (Number -> Number -> Number)', () => {
    expect(
      resolveFunctionType(
        fn(scalar('Number')),
        fn(scalar('a'), scalar('a'), scalar('a'))
      )
    ).toEqual(fn(scalar('Number'), scalar('Number'), scalar('Number')));
  });

  it('should resolve ([Number]), (a -> a -> a) into ([Number] -> [Number] -> [Number])', () => {
    expect(
      resolveFunctionType(
        fn(array(scalar('Number'))),
        fn(scalar('a'), scalar('a'), scalar('a'))
      )
    ).toEqual(
      fn(
        array(scalar('Number')),
        array(scalar('Number')),
        array(scalar('Number'))
      )
    );
  });

  it('should resolve (Number), (a -> (a -> b) -> a) into (Number -> (Number -> b) -> Number)', () => {
    expect(
      resolveFunctionType(
        fn(scalar('Number')),
        fn(scalar('a'), fn(scalar('a'), scalar('b')), scalar('a'))
      )
    ).toEqual(
      fn(scalar('Number'), fn(scalar('Number'), scalar('b')), scalar('Number'))
    );
  });

  it('should resolve function args 2', () => {
    expect(
      resolveFunctionType(
        fn(fn(scalar('Number'), scalar('String'))),
        fn(fn(scalar('a'), scalar('b')), scalar('a'), scalar('b'))
      )
    ).toEqual(
      fn(
        fn(scalar('Number'), scalar('String')),
        scalar('Number'),
        scalar('String')
      )
    );
  });
});
