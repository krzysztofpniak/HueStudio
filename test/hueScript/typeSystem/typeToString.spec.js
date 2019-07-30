import typeToString from '../../../app/hueScript/typeSystem/typeToString';
import { scalar, array, fn } from '../../../app/hueScript/coreLib/signatures';
import constraint from '../../../app/hueScript/typeSystem/constraint';

describe('typeToString', () => {
  it('should format scalar', () => {
    expect(typeToString(scalar('Number'))).toEqual('Number');
  });
  it('should format array', () => {
    expect(typeToString(array(scalar('Number')))).toEqual('[Number]');
  });
  it('should format function', () => {
    expect(typeToString(fn(scalar('Number'), scalar('String')))).toEqual(
      '(Number → String)'
    );
  });
  it('should format constraint', () => {
    expect(
      typeToString(
        constraint(
          { a: ['Group', 'Light'] },
          fn(scalar('Number'), scalar('a'), scalar('a'))
        )
      )
    ).toEqual('a ∈ {Group, Light} ⇒ (Number → a → a)');
  });
});
