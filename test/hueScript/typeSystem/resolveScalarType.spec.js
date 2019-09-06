import { resolveScalarType } from '../../../app/hueScript/resolveType';
import {
  scalar,
  fn,
  array,
  constraint
} from '../../../app/hueScript/typeSystem';
import { Left, Right } from '../../../app/sanctuary';
import typeMismatchError from '../../../app/hueScript/typeSystem/typeMismatchError';
import typeToTypeResolution from '../../../app/hueScript/typeSystem/typeToTypeResolution';

const number = scalar('Number');
const numberR = typeToTypeResolution(number);
const string = scalar('String');
const stringR = typeToTypeResolution(string);
const scalarA = scalar('a');
const scalarAR = typeToTypeResolution(scalarA);
const scalarB = scalar('b');
const scalarBR = typeToTypeResolution(scalarB);
const arrayA = array(scalarA);
const arrayAR = typeToTypeResolution(arrayA);
const fnNumberA = fn([scalar('Number'), scalar('a')]);
const fnNumberAR = typeToTypeResolution(fnNumberA);

describe('resolveScalarType', () => {
  describe('with Scalar', () => {
    it('should resolve (Number), (Number) into (Number)', () => {
      expect(resolveScalarType(numberR)(numberR)).toEqual(
        Right({ type: number, resolutions: {} })
      );
    });
    it('should resolve (Number), (a) into (Number)', () => {
      expect(resolveScalarType(numberR)(scalarAR)).toEqual(
        Right({ type: number, resolutions: { a: number } })
      );
    });
    it('should resolve (a), (Number) into (Number)', () => {
      expect(resolveScalarType(scalarAR)(numberR)).toEqual(
        Right({ type: number, resolutions: { a: number } })
      );
    });
    it('should resolve (a), (b) into (a)', () => {
      expect(resolveScalarType(scalarAR)(scalarBR)).toEqual(
        Right({ type: scalarB, resolutions: { a: scalarB, b: scalarB } })
      );
    });
    it('should resolve (a), (b) into Number', () => {
      expect(
        resolveScalarType({ ...scalarAR, resolutions: { a: number } })(scalarBR)
      ).toEqual(Right({ type: number, resolutions: { a: number, b: number } }));
    });
  });

  describe('with Array', () => {
    it('should resolve ([a]), (b) into ([a])', () => {
      expect(resolveScalarType(arrayAR)(scalarBR)).toEqual(
        Right({ type: array(scalar('a')), resolutions: { b: arrayA } })
      );
    });
  });

  describe('with Function', () => {
    it('should resolve (Number -> a), (b) into (Number -> String)', () => {
      expect(resolveScalarType(fnNumberAR)(scalarBR)).toEqual(
        Right({
          type: fn([scalar('Number'), scalar('a')]),
          resolutions: { b: fnNumberA }
        })
      );
    });
  });

  describe('with Constraint', () => {
    it('should resolve (b E {Number, String} => b), (a) into (a E {Number, String} => a)', () => {
      expect(
        resolveScalarType(
          typeToTypeResolution(
            constraint({ b: ['Number', 'String'] })(scalar('b'))
          )
        )(scalarAR)
      ).toEqual(
        Right({
          type: constraint({ a: ['Number', 'String'] })(scalar('a')),
          resolutions: {
            a: constraint({ a: ['Number', 'String'] })(scalar('a')),
            b: constraint({ a: ['Number', 'String'] })(scalar('a'))
          }
        })
      );
    });
    it('should resolve (a E {Number, String} => a), (Number) into (Number)', () => {
      expect(
        resolveScalarType(
          typeToTypeResolution(
            constraint({ a: ['Number', 'String'] })(scalar('a'))
          )
        )(numberR)
      ).toEqual(Right({ type: scalar('Number'), resolutions: { a: number } }));
    });
  });

  it('should validate constraint', () => {
    expect(
      resolveScalarType(numberR)(
        typeToTypeResolution(constraint({ a: ['Light', 'Group'] })(scalar('a')))
      )
    ).toEqual(
      Left(
        typeMismatchError(
          constraint({ a: ['Light', 'Group'] })(scalar('a')),
          number
        )
      )
    );
  });

  it('should throw on unmatched', () => {
    expect(resolveScalarType(numberR)(stringR)).toEqual(
      Left(typeMismatchError(string, number))
    );
    /*expect(resolveScalarType(fn(scalar('a')), scalar('String'))).toEqual(
      Left(typeMismatchError(scalar('String'), fn(scalar('a'))))
    );
    expect(resolveScalarType(array(scalar('a')), scalar('String'))).toEqual(
      Left(typeMismatchError(scalar('String'), array(scalar('a'))))
    );*/
  });
});
