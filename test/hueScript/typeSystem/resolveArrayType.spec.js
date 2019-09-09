import { resolveArrayType } from '../../../app/hueScript/resolveType';
import { scalar, fn, array } from '../../../app/hueScript/typeSystem';
import { Left, Right, on, Nothing } from '../../../app/sanctuary';
import typeMismatchError from '../../../app/hueScript/typeSystem/typeMismatchError';
import typeToTypeResolution from '../../../app/hueScript/typeSystem/typeToTypeResolution';

const number = scalar('Number');
const string = scalar('String');
const arNumber = array(number);
const arNumberR = typeToTypeResolution(arNumber);
const arString = array(string);
const arStringR = typeToTypeResolution(arString);
const scalarA = scalar('a');
const arA = array(scalarA);
const arAR = typeToTypeResolution(arA);
const ararNumber = array(arNumber);
const ararNumberR = typeToTypeResolution(ararNumber);
const ararA = array(arA);
const ararAR = typeToTypeResolution(ararA);

describe('resolveArrayType', () => {
  it('should resolve [Number], [Number] into [Number]', () => {
    expect(resolveArrayType(arNumberR)(arNumberR)).toEqual(
      Right({ type: arNumber, resolutions: {} })
    );
  });
  it('should resolve [Number], [a] into [Number]', () => {
    expect(resolveArrayType(arNumberR)(arAR)).toEqual(
      Right({ type: arNumber, resolutions: { a: number } })
    );
  });
  it('should resolve [a], [a] into [a]', () => {
    expect(resolveArrayType(arAR)(arAR)).toEqual(
      Right({ type: arA, resolutions: { a: scalarA } })
    );
  });
  it('should resolve [[Number]], [[a]] into [[Number]]', () => {
    expect(resolveArrayType(ararNumberR)(ararAR)).toEqual(
      Right({ type: ararNumber, resolutions: { a: number } })
    );
  });

  it('should resolve [([Number] -> String)], [(a -> b)] into [([Number] -> String)]', () => {
    expect(
      resolveArrayType(
        typeToTypeResolution(
          array(fn([array(scalar('Number')), scalar('String')]))
        )
      )(typeToTypeResolution(array(fn([scalar('a'), scalar('b')]))))
    ).toEqual(
      Right({
        type: array(fn([array(scalar('Number')), scalar('String')])),
        resolutions: { a: arNumber, b: string }
      })
    );
  });

  it('should throw on unmatched 1', () => {
    expect(resolveArrayType(arNumberR)(arStringR)).toEqual(
      Left(
        typeMismatchError(array(scalar('String')))(array(scalar('Number')))(
          Nothing
        )
      )
    );
  });
  it('should throw on unmatched 2', () => {
    expect(
      on(resolveArrayType)(typeToTypeResolution)(fn([array(scalar('a'))]))(
        array(scalar('String'))
      )
    ).toEqual(
      Left(
        typeMismatchError(array(scalar('String')))(fn([array(scalar('a'))]))(
          Nothing
        )
      )
    );
  });
  it('should throw on unmatched 3', () => {
    expect(
      on(resolveArrayType)(typeToTypeResolution)(array(fn([scalar('a')])))(
        array(scalar('String'))
      )
    ).toEqual(
      Left(
        typeMismatchError(array(scalar('String')))(array(fn([scalar('a')])))(
          Nothing
        )
      )
    );
  });
});
