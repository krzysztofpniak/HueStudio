import {
  normalizePolyNames,
  scalar,
  array,
  fn
} from '../../../app/hueScript/typeSystem';
import { getNewRenamesContext } from '../../../app/hueScript/typeSystem/normalizePolyNames';

describe('normalizePolyNames', () => {
  describe('with Scalar', () => {
    it('should leave a', () => {
      expect(normalizePolyNames(scalar('a'))(getNewRenamesContext())).toEqual([
        scalar('a'),
        { renames: { a: 'a' }, start: 1 }
      ]);
    });

    it('should leave Number', () => {
      expect(
        normalizePolyNames(scalar('Number'))(getNewRenamesContext())[0]
      ).toEqual(scalar('Number'));
    });

    it('should rename b to a', () => {
      expect(
        normalizePolyNames(scalar('b'))(getNewRenamesContext())[0]
      ).toEqual(scalar('a'));
    });
  });

  describe('with Array', () => {
    it('should leave [a]', () => {
      expect(
        normalizePolyNames(array(scalar('c')))(getNewRenamesContext())[0]
      ).toEqual(array(scalar('a')));
    });
  });

  describe('with Function', () => {
    it('should rename [x] -> (x -> y) -> [y] to [a] -> (a -> b) -> [b]', () => {
      expect(
        normalizePolyNames(
          fn([
            array(scalar('x')),
            fn([scalar('x'), scalar('y')]),
            array(scalar('y'))
          ])
        )(getNewRenamesContext())
      ).toEqual([
        fn([
          array(scalar('a')),
          fn([scalar('a'), scalar('b')]),
          array(scalar('b'))
        ]),
        { renames: { x: 'a', y: 'b' }, start: 2 }
      ]);
    });
  });
});
