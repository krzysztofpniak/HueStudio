import { resolveFunctionType } from '../../../app/hueScript/resolveType';
import { scalar, fn, array } from '../../../app/hueScript/typeSystem';
import { Right } from '../../../app/sanctuary';
import constraint from '../../../app/hueScript/typeSystem/constraint';
import typeToTypeResolution from '../../../app/hueScript/typeSystem/typeToTypeResolution';

const number = scalar('Number');
const fnNumber = fn([number]);
const fnNumberNumber = fn([number, number]);
const fnNumberNumberR = typeToTypeResolution(fnNumberNumber);
const scalarB = scalar('b');
const fnNumberBB = fn([number, scalarB, scalarB]);
const fnNumberBBR = typeToTypeResolution(fnNumberBB);
const scalarA = scalar('a');
const fnAA = fn([scalarA, scalarA]);
const fnAAR = typeToTypeResolution(fnAA);
const fnAAA = fn([scalarA, scalarA, scalarA]);
const fnAAAR = typeToTypeResolution(fnAAA);
const fnNumberNumberNumber = fn([number, number, number]);
const fnNumberNumberNumberR = typeToTypeResolution(fnNumberNumberNumber);
const scalarC = scalar('c');
const fnCC = fn([scalarC, scalarC]);
const fnCCR = typeToTypeResolution(fnCC);
const fnAB = fn([scalarA, scalarB]);
const fnABR = typeToTypeResolution(fnAB);
const fnANumber = fn([scalarA, number]);
const fnANumberR = typeToTypeResolution(fnANumber);

describe('resolveFunctionType', () => {
  it('should resolve (Number -> Number), (Number -> Number) into (Number -> Number)', () => {
    expect(resolveFunctionType(fnNumberNumberR)(fnNumberNumberR)).toEqual(
      Right({ type: fnNumberNumber, resolutions: {} })
    );
  });

  it('should resolve (Number, b, b), (a -> a -> a) into (Number -> Number -> Number)', () => {
    expect(resolveFunctionType(fnNumberBBR)(fnAAAR)).toEqual(
      Right({
        type: fnNumberNumberNumber,
        resolutions: { a: number, b: number }
      })
    );
  });

  it('should resolve ([Number], [Number], [Number]), (a -> a -> a) into ([Number] -> [Number] -> [Number])', () => {
    expect(
      resolveFunctionType(
        typeToTypeResolution(
          fn([
            array(scalar('Number')),
            array(scalar('Number')),
            array(scalar('Number'))
          ])
        )
      )(typeToTypeResolution(fn([scalar('a'), scalar('a'), scalar('a')])))
    ).toEqual(
      Right({
        type: fn([
          array(scalar('Number')),
          array(scalar('Number')),
          array(scalar('Number'))
        ]),
        resolutions: { a: array(scalar('Number')) }
      })
    );
  });

  it('should resolve c E {Light, Group} (c -> c), ((a -> b) -> [a] -> [b]) into c E {Light, Group} ((c -> c) -> [c] -> [c])', () => {
    expect(
      resolveFunctionType(
        typeToTypeResolution(
          constraint({ c: ['Light', 'Group'] })(
            fn([
              fn([scalar('c'), scalar('c')]),
              array(scalar('c')),
              array(scalar('c'))
            ])
          )
        )
      )(
        typeToTypeResolution(
          fn([
            fn([scalar('a'), scalar('b')]),
            array(scalar('a')),
            array(scalar('b'))
          ])
        )
      )
    ).toEqual(
      Right({
        type: constraint({ a: ['Light', 'Group'] })(
          fn([
            fn([scalar('a'), scalar('a')]),
            array(scalar('a')),
            array(scalar('a'))
          ])
        ),
        resolutions: {
          a: constraint({ a: ['Light', 'Group'] })(scalar('a')),
          b: constraint({ a: ['Light', 'Group'] })(scalar('a')),
          c: constraint({ a: ['Light', 'Group'] })(scalar('a'))
        }
      })
    );
  });

  it('should resolve (c -> c), (a -> b) into ((a -> a))', () => {
    expect(resolveFunctionType(fnCCR)(fnABR)).toEqual(
      Right({
        type: fnAA,
        resolutions: {
          a: scalarA,
          b: scalarA,
          c: scalarA
        }
      })
    );
  });

  it('should resolve (a -> b), (c -> c) into ((a -> a))', () => {
    expect(resolveFunctionType(fnABR)(fnCCR)).toEqual(
      Right({
        type: fnCC,
        resolutions: {
          a: scalarC,
          b: scalarC,
          c: scalarC
        }
      })
    );
  });

  it('should resolve (c -> c), (a -> Number) into ((a -> a))', () => {
    expect(resolveFunctionType(fnCCR)(fnANumberR)).toEqual(
      Right({
        type: fnNumberNumber,
        resolutions: {
          a: number,
          c: number
        }
      })
    );
  });

  it('should resolve (c), ((a -> b) -> [a] -> [b]) into ((a -> b) -> [a] -> [a])', () => {
    expect(
      resolveFunctionType(typeToTypeResolution(scalar('c')))(
        typeToTypeResolution(
          fn([
            fn([scalar('a'), scalar('b')]),
            array(scalar('a')),
            array(scalar('b'))
          ])
        )
      )
    ).toEqual(
      Right({
        type: fn([
          fn([scalar('a'), scalar('b')]),
          array(scalar('a')),
          array(scalar('b'))
        ]),
        resolutions: {
          c: fn([
            fn([scalar('a'), scalar('b')]),
            array(scalar('a')),
            array(scalar('b'))
          ])
        }
      })
    );
    //expect(resolved).toEqual({ c: fn(scalar('a'), scalar('b')) });
  });
});
