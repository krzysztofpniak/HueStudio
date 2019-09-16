import { Right } from '../../../app/sanctuary';
import { resolveMember } from '../../../app/hueScript/resolveType';
import { scalar, fn } from '../../../app/hueScript/typeSystem';
import typeToTypeResolution from '../../../app/hueScript/typeSystem/typeToTypeResolution';

const number = scalar('Number');
const numberR = typeToTypeResolution(number);
const fn2Number = fn([number, number]);
const fn2NumberR = typeToTypeResolution(fn2Number);
const fn3Number = fn([number, number, number]);
const fn3NumberR = typeToTypeResolution(fn3Number);

describe('resolveMember', () => {
  it('should resolve unary', () => {
    expect(resolveMember(numberR)(fn2NumberR)).toEqual(
      Right({ type: number, resolutions: {} })
    );
  });
  it('should resolve binary', () => {
    expect(resolveMember(numberR)(fn3NumberR)).toEqual(
      Right({ type: fn2Number, resolutions: {} })
    );
  });
});
