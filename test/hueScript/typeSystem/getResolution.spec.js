import { getResolution } from '../../../app/hueScript/resolveType';
import { scalar, array } from '../../../app/hueScript/typeSystem';

describe('getResolution', () => {
  it('should resolve PolyScalar to Number', () => {
    expect(getResolution({ a: scalar('Number') }, scalar('a'))).toEqual(
      scalar('Number')
    );
  });
  it('should resolve PolyScalar to Number with transitivity', () => {
    expect(
      getResolution({ a: scalar('b'), b: scalar('Number') }, scalar('a'))
    ).toEqual(scalar('Number'));
  });
  it('should resolve PolyScalar to PolyScalar with cycle', () => {
    expect(getResolution({ a: scalar('a') }, scalar('a'))).toEqual(scalar('a'));
  });
  it('should resolve PolyScalar to PolyScalar with transitive cycle', () => {
    expect(
      getResolution(
        { a: scalar('b'), b: scalar('c'), c: scalar('a') },
        scalar('a')
      )
    ).toEqual(scalar('a'));
  });
  it('should pass ConcreteScalar', () => {
    expect(getResolution({ a: scalar('b') }, scalar('Number'))).toEqual(
      scalar('Number')
    );
  });
  it('should pass Array', () => {
    expect(getResolution({ a: scalar('b') }, array(scalar('Number')))).toEqual(
      array(scalar('Number'))
    );
  });
});
