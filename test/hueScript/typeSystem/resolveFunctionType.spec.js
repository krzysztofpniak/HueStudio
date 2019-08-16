import { resolveFunctionType } from '../../../app/hueScript/resolveType';
import { scalar, fn, array } from '../../../app/hueScript/typeSystem';
import { Right } from '../../../app/sanctuary';

describe('resolveFunctionType', () => {
  it('should resolve (Number), (Number -> Number) into (Number -> Number)', () => {
    expect(
      resolveFunctionType(
        fn(scalar('Number')),
        fn(scalar('Number'), scalar('Number'))
      )
    ).toEqual(Right(fn(scalar('Number'), scalar('Number'))));
  });

  it('should resolve (Number, b, b), (a -> a -> a) into (Number -> Number -> Number)', () => {
    expect(
      resolveFunctionType(
        fn(scalar('Number'), scalar('b'), scalar('b')),
        fn(scalar('a'), scalar('a'), scalar('a'))
      )
    ).toEqual(Right(fn(scalar('Number'), scalar('Number'), scalar('Number'))));
  });

  it('should resolve ([Number]), (a -> a -> a) into ([Number] -> [Number] -> [Number])', () => {
    expect(
      resolveFunctionType(
        fn(array(scalar('Number'))),
        fn(scalar('a'), scalar('a'), scalar('a'))
      )
    ).toEqual(
      Right(
        fn(
          array(scalar('Number')),
          array(scalar('Number')),
          array(scalar('Number'))
        )
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
      Right(
        fn(
          scalar('Number'),
          fn(scalar('Number'), scalar('b')),
          scalar('Number')
        )
      )
    );
  });

  it('should resolve (Number -> String), ((a -> b) -> a -> b) into ((Number -> String) -> Number -> String)', () => {
    expect(
      resolveFunctionType(
        fn(fn(scalar('Number'), scalar('String'))),
        fn(fn(scalar('a'), scalar('b')), scalar('a'), scalar('b'))
      )
    ).toEqual(
      Right(
        fn(
          fn(scalar('Number'), scalar('String')),
          scalar('Number'),
          scalar('String')
        )
      )
    );
  });

  it('should resolve (Number -> String), ((a -> b) -> [a] -> [b]) into ((Number -> String) -> [Number] -> [String])', () => {
    expect(
      resolveFunctionType(
        fn(fn(scalar('Number'), scalar('String'))),
        fn(fn(scalar('a'), scalar('b')), array(scalar('a')), array(scalar('b')))
      )
    ).toEqual(
      Right(
        fn(
          fn(scalar('Number'), scalar('String')),
          array(scalar('Number')),
          array(scalar('String'))
        )
      )
    );
  });

  it('should resolve (c), ((a -> b) -> [a] -> [b]) into ((a -> b) -> [a] -> [a])', () => {
    const resolved = {};
    expect(
      resolveFunctionType(
        fn(scalar('c')),
        fn(
          fn(scalar('a'), scalar('b')),
          array(scalar('a')),
          array(scalar('b'))
        ),
        resolved
      )
    ).toEqual(
      Right(
        fn(fn(scalar('a'), scalar('b')), array(scalar('a')), array(scalar('b')))
      )
    );
    //TODO: usunąć rozwiązania typu: a: a
    //expect(resolved).toEqual({ c: fn(scalar('a'), scalar('b')) });
  });

  it('should resolve function args 2', () => {
    expect(
      resolveFunctionType(
        fn(fn(scalar('Number'), scalar('String'))),
        fn(fn(scalar('a'), scalar('b')), scalar('a'), scalar('b'))
      )
    ).toEqual(
      Right(
        fn(
          fn(scalar('Number'), scalar('String')),
          scalar('Number'),
          scalar('String')
        )
      )
    );
  });
});
