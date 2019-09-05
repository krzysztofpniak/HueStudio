import { scalar } from '../../../app/hueScript/typeSystem';
import typeToTypeResolution from '../../../app/hueScript/typeSystem/typeToTypeResolution';

describe('typeToTypeResolution', () => {
  it('should return typeResolution', () => {
    const type = scalar('a');
    expect(typeToTypeResolution(type)).toEqual({ type, resolutions: {} });
  });
});
