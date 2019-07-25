import { resolveCall } from '../../app/hueScript/resolveType';
import { scalar, fn } from '../../app/hueScript/coreLib/signatures';

describe('resolveCall', () => {
  it('should resolve (), (() -> Number) into Number', () => {
    expect(resolveCall([], fn(scalar('Number')))).toEqual(scalar('Number'));
  });

  it('should resolve (Number), (Number -> Group) into Group', () => {
    expect(
      resolveCall([scalar('Number')], fn(scalar('Number'), scalar('Group')))
    ).toEqual(scalar('Group'));
  });

  it('should resolve (Number), (Number -> Group -> Group) into (Group -> Group)', () => {
    expect(
      resolveCall(
        [scalar('Number')],
        fn(scalar('Number'), scalar('Group'), scalar('Group'))
      )
    ).toEqual(fn(scalar('Group'), scalar('Group')));
  });
});
