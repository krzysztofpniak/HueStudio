import { scalar, isConcreteScalar } from '../../../app/hueScript/typeSystem';

describe('isConcreteScalar', () => {
  it('should resolve to true', () => {
    expect(isConcreteScalar(scalar('Number'))).toEqual(true);
    expect(isConcreteScalar(scalar('String'))).toEqual(true);
    expect(isConcreteScalar(scalar('Group'))).toEqual(true);
  });
  it('should resolve to false', () => {
    expect(isConcreteScalar(scalar('a'))).toEqual(false);
  });
});
