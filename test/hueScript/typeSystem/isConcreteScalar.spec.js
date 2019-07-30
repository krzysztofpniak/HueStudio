import { isConcreteScalar } from '../../../app/hueScript/typeSystem';
import { scalar } from '../../../app/hueScript/coreLib/signatures';

describe('isConcreteScalar', () => {
  it('should resolve to true', () => {
    expect(isConcreteScalar(scalar('Number'))).toEqual(true);
    expect(isConcreteScalar(scalar('String'))).toEqual(true);
    expect(isConcreteScalar(scalar('Group'))).toEqual(true);
  });
  it('should resolve to false', () => {
    expect(isConcreteScalar(1)).toEqual(true);
    expect(isConcreteScalar('a')).toEqual(true);
    expect(isConcreteScalar(scalar('a'))).toEqual(true);
  });
});
