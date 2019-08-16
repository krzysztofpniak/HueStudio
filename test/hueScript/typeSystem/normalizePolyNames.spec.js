import {
  normalizePolyNames,
  scalar,
  array,
  fn
} from '../../../app/hueScript/typeSystem';

describe('normalizePolyNames', () => {
  describe('with Scalar', () => {
    it('should leave a', () => {
      expect(normalizePolyNames(scalar('a'))).toEqual(scalar('a'));
    });

    it('should leave Number', () => {
      expect(normalizePolyNames(scalar('Number'))).toEqual(scalar('Number'));
    });

    it('should rename b to a', () => {
      expect(normalizePolyNames(scalar('b'))).toEqual(scalar('a'));
    });
  });

  describe('with Array', () => {
    it('should leave [a]', () => {
      expect(normalizePolyNames(array(scalar('c')))).toEqual(
        array(scalar('a'))
      );
    });
  });

  describe('with Function', () => {
    it('should rename [x] -> (x -> y) -> [y] to [a] -> (a -> b) -> [b]', () => {
      expect(
        normalizePolyNames(
          fn(
            array(scalar('x')),
            fn(scalar('x'), scalar('y')),
            array(scalar('y'))
          )
        )
      ).toEqual(
        fn(array(scalar('a')), fn(scalar('a'), scalar('b')), array(scalar('b')))
      );
    });
  });
});
