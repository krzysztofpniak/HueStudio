import extractContraints from '../../../app/hueScript/typeSystem/extractConstraints';
import constraint from '../../../app/hueScript/typeSystem/constraint';
import { scalar } from '../../../app/hueScript/typeSystem';

describe('extractContraints', () => {
  it('should extract', () => {
    expect(
      extractContraints([constraint({ a: ['Number', 'String'] })(scalar('a'))])
    ).toEqual([{ a: ['Number', 'String'] }, [scalar('a')]]);
  });
});
