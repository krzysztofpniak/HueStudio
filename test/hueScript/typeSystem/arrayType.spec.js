import ArrayType from '../../../app/hueScript/typeSystem/arrayType';
import { map, chain } from 'ramda';
import { lift2 } from '../../../app/sanctuary';

describe('ArrayType', () => {
  it('should map', () => {
    expect(map(x => x + 'b', ArrayType('a'))).toEqual(ArrayType('ab'));
  });
  it('should chain', () => {
    expect(chain(x => ArrayType(x + 'b'), ArrayType('a'))).toEqual(
      ArrayType('ab')
    );
  });
});
