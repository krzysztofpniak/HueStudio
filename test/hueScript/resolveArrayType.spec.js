import { resolveArrayType } from '../../app/hueScript/resolveType';
import { scalar, fn, array } from '../../app/hueScript/coreLib/signatures';

describe('resolveArrayType', () => {
  it('should resolve [Number], [Number] into [Number]', () => {
    expect(
      resolveArrayType(array(scalar('Number')), array(scalar('Number')))
    ).toEqual(array(scalar('Number')));
  });
  it('should resolve [Number], [a] into [Number]', () => {
    expect(
      resolveArrayType(array(scalar('Number')), array(scalar('a')))
    ).toEqual(array(scalar('Number')));
  });
  it('should resolve [a], [a] into [a]', () => {
    expect(resolveArrayType(array(scalar('a')), array(scalar('a')))).toEqual(
      array(scalar('a'))
    );
  });
  it('should resolve [[Number]], [[a]] into [[Number]]', () => {
    expect(
      resolveArrayType(
        array(array(scalar('Number'))),
        array(array(scalar('a')))
      )
    ).toEqual(array(array(scalar('Number'))));
  });

  it('should resolve [([Number] -> String)], [(a -> b)] into [(Number -> String)]', () => {
    expect(
      resolveArrayType(
        array(fn(array(scalar('Number')), scalar('String'))),
        array(fn(scalar('a'), scalar('b')))
      )
    ).toEqual(array(fn(array(scalar('Number')), scalar('String'))));
  });

  it('should throw on unmatched', () => {
    expect(() =>
      resolveArrayType(array(scalar('Number')), array(scalar('String')))
    ).toThrow('Wrong type, expected [String], Number given');
    expect(() =>
      resolveArrayType(fn(array(scalar('a'))), array(scalar('String')))
    ).toThrow('Wrong type, expected [String], (() → a) given');
    expect(() =>
      resolveArrayType(array(scalar('a')), array(scalar('String')))
    ).toThrow('Wrong type, expected [String], [a] given');
  });
});
