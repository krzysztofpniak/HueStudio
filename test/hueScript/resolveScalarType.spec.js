import { resolveScalarType } from '../../app/hueScript/resolveType';
import { scalar, fn, array } from '../../app/hueScript/coreLib/signatures';

describe('resolveScalarType', () => {
  it('should resolve (Number), (Number) into (Number)', () => {
    expect(resolveScalarType(scalar('Number'), scalar('Number'))).toEqual(
      scalar('Number')
    );
  });
  it('should resolve (Number), (a) into (Number)', () => {
    expect(resolveScalarType(scalar('Number'), scalar('a'))).toEqual(
      scalar('Number')
    );
  });
  it('should resolve (a), (Number) into (Number)', () => {
    expect(resolveScalarType(scalar('a'), scalar('Number'))).toEqual(
      scalar('Number')
    );
  });
  it('should resolve (a), (a) into (a)', () => {
    expect(resolveScalarType(scalar('a'), scalar('a'))).toEqual(scalar('a'));
  });
  it('should resolve ([a]), (a) into ([a])', () => {
    expect(resolveScalarType(array(scalar('a')), scalar('a'))).toEqual(
      array(scalar('a'))
    );
  });
  it('should throw on unmatched', () => {
    expect(() => resolveScalarType(scalar('Number'), scalar('String'))).toThrow(
      'Wrong type, expected String, Number given'
    );
    expect(() => resolveScalarType(fn(scalar('a')), scalar('String'))).toThrow(
      'Wrong type, expected String, (() → a) given'
    );
    expect(() =>
      resolveScalarType(array(scalar('a')), scalar('String'))
    ).toThrow('Wrong type, expected String, [a] given');
  });
});
