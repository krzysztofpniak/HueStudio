import { getResolution } from '../../../app/hueScript/resolveType';
import { scalar, array } from '../../../app/hueScript/typeSystem';
import constraint from '../../../app/hueScript/typeSystem/constraint';

describe('getResolution', () => {
  it('should resolve PolyScalar to Number', () => {
    expect(getResolution({ a: scalar('Number') })(scalar('a'))).toEqual(
      scalar('Number')
    );
  });
  it('should resolve PolyScalar to Number with transitivity', () => {
    expect(
      getResolution({ a: scalar('Number'), b: scalar('Number') })(scalar('a'))
    ).toEqual(scalar('Number'));
  });
  it('should resolve PolyScalar to PolyScalar with cycle', () => {
    expect(getResolution({ a: scalar('a') })(scalar('a'))).toEqual(scalar('a'));
  });
  it('should resolve Poly Array', () => {
    expect(
      getResolution({ a: constraint({ b: ['Light', 'Group'] })(scalar('b')) })(
        array(scalar('a'))
      )
    ).toEqual(constraint({ b: ['Light', 'Group'] })(array(scalar('b'))));
  });
  it('should pass ConcreteScalar', () => {
    expect(getResolution({ a: scalar('b') })(scalar('Number'))).toEqual(
      scalar('Number')
    );
  });
  it('should pass Concrete Array', () => {
    expect(getResolution({ a: scalar('b') })(array(scalar('Number')))).toEqual(
      array(scalar('Number'))
    );
  });
});
