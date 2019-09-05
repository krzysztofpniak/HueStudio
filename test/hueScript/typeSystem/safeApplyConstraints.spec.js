import { safeApplyConstraints } from '../../../app/hueScript/resolveType';
import { Right } from '../../../app/sanctuary';
import constraint from '../../../app/hueScript/typeSystem/constraint';
import { scalar } from '../../../app/hueScript/typeSystem';

describe('safeApplyConstraints', () => {
  it('should merge when target has no constraints', () => {
    expect(
      safeApplyConstraints(
        constraint({ a: ['Number', 'String'] })(scalar('a'))
      )(scalar('b'))
    ).toEqual(Right(constraint({ b: ['Number', 'String'] })(scalar('b'))));
  });
});
