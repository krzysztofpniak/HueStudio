import {
  createHSContext,
  putContextEffects
} from '../../../app/hueScript/astToBridgeState';
import { pipe } from '../../../app/sanctuary';

describe('putContextEffects', () => {
  it('should append effects', () => {
    const context = createHSContext();
    const effect1 = { name: 'delay', params: { ms: 2000 } };
    const effect2 = { name: 'print', params: { text: 'Hello World' } };
    const effect3 = { name: 'on', params: { target: '/lights/1' } };
    expect(
      pipe([
        putContextEffects([effect1]),
        putContextEffects([effect2, effect3])
      ])(context)
    ).toEqual({
      ...context,
      effects: [effect1, effect2, effect3]
    });
  });
});
