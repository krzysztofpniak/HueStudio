import { resolveArrayType } from '../../../app/hueScript/resolveType';
import { scalar, fn, array } from '../../../app/hueScript/typeSystem';
import { Left, Right } from '../../../app/sanctuary';
import typeMismatchError from '../../../app/hueScript/typeSystem/typeMismatchError';

describe('resolveArrayType', () => {
  it('should resolve [Number], [Number] into [Number]', () => {
    expect(
      resolveArrayType(array(scalar('Number')), array(scalar('Number')))
    ).toEqual(Right(array(scalar('Number'))));
  });
  it('should resolve [Number], [a] into [Number]', () => {
    expect(
      resolveArrayType(array(scalar('Number')), array(scalar('a')))
    ).toEqual(Right(array(scalar('Number'))));
  });
  it('should resolve [a], [a] into [a]', () => {
    expect(resolveArrayType(array(scalar('a')), array(scalar('a')))).toEqual(
      Right(array(scalar('a')))
    );
  });
  it('should resolve [[Number]], [[a]] into [[Number]]', () => {
    expect(
      resolveArrayType(
        array(array(scalar('Number'))),
        array(array(scalar('a')))
      )
    ).toEqual(Right(array(array(scalar('Number')))));
  });

  it('should resolve [([Number] -> String)], [(a -> b)] into [(Number -> String)]', () => {
    expect(
      resolveArrayType(
        array(fn(array(scalar('Number')), scalar('String'))),
        array(fn(scalar('a'), scalar('b')))
      )
    ).toEqual(Right(array(fn(array(scalar('Number')), scalar('String')))));
  });

  it('should throw on unmatched 1', () => {
    expect(
      resolveArrayType(array(scalar('Number')), array(scalar('String')))
    ).toEqual(
      Left(typeMismatchError(array(scalar('String')), array(scalar('Number'))))
    );
  });
  it('should throw on unmatched 2', () => {
    expect(
      resolveArrayType(fn(array(scalar('a'))), array(scalar('String')))
    ).toEqual(
      Left(typeMismatchError(array(scalar('String')), fn(array(scalar('a')))))
    );
  });
  it('should throw on unmatched 3', () => {
    expect(
      resolveArrayType(array(fn(scalar('a'))), array(scalar('String')))
    ).toEqual(
      Left(typeMismatchError(array(scalar('String')), array(fn(scalar('a')))))
    );
  });
});
