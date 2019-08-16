import { resolveScalarType } from '../../../app/hueScript/resolveType';
import {
  scalar,
  fn,
  array,
  constraint
} from '../../../app/hueScript/typeSystem';
import { Left, Right } from '../../../app/sanctuary';
import typeMismatchError from '../../../app/hueScript/typeSystem/typeMismatchError';

describe('resolveScalarType', () => {
  describe('with Scalar', () => {
    it('should resolve (Number), (Number) into (Number)', () => {
      const resolved = {};
      expect(
        resolveScalarType(scalar('Number'), scalar('Number'), resolved)
      ).toEqual(Right(scalar('Number')));

      expect(resolved).toEqual({});
    });
    it('should resolve (Number), (a) into (Number)', () => {
      const resolved = {};
      expect(
        resolveScalarType(scalar('Number'), scalar('a'), resolved)
      ).toEqual(Right(scalar('Number')));
      expect(resolved).toEqual({ a: scalar('Number') });
    });
    it('should resolve (a), (Number) into (Number)', () => {
      const resolved = {};
      expect(
        resolveScalarType(scalar('a'), scalar('Number'), resolved)
      ).toEqual(Right(scalar('Number')));
      expect(resolved).toEqual({ a: scalar('Number') });
    });
    it('should resolve (a), (b) into (a)', () => {
      const resolved = {};
      expect(resolveScalarType(scalar('a'), scalar('b'), resolved)).toEqual(
        Right(scalar('a'))
      );
      expect(resolved).toEqual({ a: scalar('b'), b: scalar('a') });
    });
    it('should resolve (a), (b) into Number', () => {
      const resolved = { a: scalar('Number') };
      expect(resolveScalarType(scalar('a'), scalar('b'), resolved)).toEqual(
        Right(scalar('Number'))
      );
      expect(resolved).toEqual({ a: scalar('Number'), b: scalar('a') });
    });
  });

  describe('with Array', () => {
    it('should resolve ([a]), (b) into ([a])', () => {
      const resolved = {};
      expect(
        resolveScalarType(array(scalar('a')), scalar('b'), resolved)
      ).toEqual(Right(array(scalar('a'))));
      expect(resolved).toEqual({ b: array(scalar('a')) });
    });
  });

  describe('with Function', () => {
    it('should resolve (Number -> a), (b) into (Number -> String)', () => {
      const resolved = {};
      expect(
        resolveScalarType(
          fn(scalar('Number'), scalar('a')),
          scalar('b'),
          resolved
        )
      ).toEqual(Right(fn(scalar('Number'), scalar('a'))));
      expect(resolved).toEqual({ b: fn(scalar('Number'), scalar('a')) });
    });
  });

  describe('with Constraint', () => {
    it('should resolve (a E {Number, String} => a), (a) into (a E {Number, String} => a)', () => {
      expect(
        resolveScalarType(
          constraint({ a: ['Number', 'String'] }, scalar('a')),
          scalar('a')
        )
      ).toEqual(Right(constraint({ a: ['Number', 'String'] }, scalar('a'))));
    });
    it('should resolve (a E {Number, String} => a), (Number) into (Number)', () => {
      expect(
        resolveScalarType(
          constraint({ a: ['Number', 'String'] }, scalar('a')),
          scalar('Number')
        )
      ).toEqual(Right(scalar('Number')));
    });
  });

  it('should throw on unmatched', () => {
    expect(resolveScalarType(scalar('Number'), scalar('String'))).toEqual(
      Left(typeMismatchError(scalar('String'), scalar('Number')))
    );
    expect(resolveScalarType(fn(scalar('a')), scalar('String'))).toEqual(
      Left(typeMismatchError(scalar('String'), fn(scalar('a'))))
    );
    expect(resolveScalarType(array(scalar('a')), scalar('String'))).toEqual(
      Left(typeMismatchError(scalar('String'), array(scalar('a'))))
    );
  });
});
