import actionToEffects from '../../../app/hueScript/effects/actionToEffects';
import { Right } from '../../../app/sanctuary';
import { scalar, typedValue } from '../../../app/hueScript/typeSystem';

describe('actionToEffect', () => {
  it('should translate on', () => {
    expect(
      actionToEffects({
        address: '/groups/7/action',
        method: 'PUT',
        body: {
          on: true
        }
      })
    ).toEqual(
      Right([
        {
          name: 'on',
          params: { target: typedValue(scalar('Group'))('/groups/7'), on: true }
        }
      ])
    );
  });
  it('should translate setScene', () => {
    expect(
      actionToEffects({
        address: '/groups/7/action',
        method: 'PUT',
        body: {
          scene: 'some-scene-id'
        }
      })
    ).toEqual(
      Right([
        {
          name: 'setScene',
          params: {
            scene: 'some-scene-id',
            target: typedValue(scalar('Group'))('/groups/7')
          }
        }
      ])
    );
  });
  it('should translate many actions', () => {
    expect(
      actionToEffects({
        address: '/lights/2/action',
        method: 'PUT',
        body: {
          on: true,
          bri: 24
        }
      })
    ).toEqual(
      Right([
        {
          name: 'on',
          params: {
            on: true,
            target: typedValue(scalar('Light'))('/lights/2')
          }
        },
        {
          name: 'bri',
          params: {
            bri: 24,
            target: typedValue(scalar('Light'))('/lights/2')
          }
        }
      ])
    );
  });
});
