import substitutePolyScalars from '../../../app/hueScript/typeSystem/substitutePolyScalars';
import { scalar, fn, array } from '../../../app/hueScript/typeSystem';

describe('substitutePolyScalars', () => {
  it('should rename simple', () => {
    expect(substitutePolyScalars({ a: scalar('Number') })(scalar('a'))).toEqual(
      scalar('Number')
    );
  });
  it('should rename array', () => {
    expect(
      substitutePolyScalars({ a: scalar('Number') })(array(scalar('a')))
    ).toEqual(array(scalar('Number')));
  });
  it('should rename function', () => {
    expect(
      substitutePolyScalars({ a: scalar('Number') })(
        fn([scalar('a'), scalar('b')])
      )
    ).toEqual(fn([scalar('Number'), scalar('b')]));
  });
  it('should rename function with complex args', () => {
    expect(
      substitutePolyScalars({ a: scalar('Number') })(
        fn([scalar('a'), fn([scalar('b'), array(scalar('a'))])])
      )
    ).toEqual(
      fn([scalar('Number'), fn([scalar('b'), array(scalar('Number'))])])
    );
  });
});
