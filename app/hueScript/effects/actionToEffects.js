import $ from 'sanctuary-def';
import {
  def,
  HSEffect,
  HSError,
  BridgeAction,
  HSValue,
  HSAction
} from '../../sanctuary/types';
import {
  cond,
  Left,
  Right,
  map,
  fst,
  snd,
  pipe,
  prop,
  unchecked,
  pipeK,
  sequence,
  Either
} from '../../sanctuary';
import { startsWith, has, nth, compose, match, toPairs } from 'ramda';
import { scalar, typedValue } from '../typeSystem';

const extractAddressPart = compose(
  nth(0),
  match(/^\/\w+\/\w+/)
);

const addressToTarget = def('addressToTarget')({})([
  $.String,
  $.Either(HSError)(HSValue)
])(
  cond([
    [
      startsWith('/lights/'),
      address => Right(typedValue(scalar('Light'))(extractAddressPart(address)))
    ],
    [
      startsWith('/groups/'),
      address => Right(typedValue(scalar('Group'))(extractAddressPart(address)))
    ],
    [
      startsWith('/sensors/'),
      address =>
        Right(typedValue(scalar('Sensor'))(extractAddressPart(address)))
    ]
  ])(x =>
    Left({
      name: 'NotImplementedYet',
      message: `[addressToTarget]: Not implemented yet ${x}`
    })
  )
);

const singleActionToEffect = def('singleActionToEffect')({})([
  $.String,
  $.String,
  $.Either(HSError)(HSEffect)
])(key => value =>
  cond([
    [
      equals('on'),
      a =>
        map(target => ({ name: 'on', params: { target, on: a.body.on } }))(
          addressToTarget(a.address)
        )
    ],
    [
      equals('scene'),
      a =>
        map(target => ({
          name: 'setScene',
          params: { target, scene: a.body.scene }
        }))(addressToTarget(a.address))
    ],
    [
      equals('state'),
      a =>
        map(target => ({
          name: 'state',
          params: { target, state: a.body.state }
        }))(addressToTarget(a.address))
    ]
  ])(x =>
    Left({
      name: 'NotImplementedYet',
      message: `[singleActionToEffect]: Not implemented yet ${x}`
    })
  )(key)
);

const bridgeActionToHSActions = def('bridgeActionToSimpleActions')({})([
  BridgeAction,
  $.Array(HSAction)
])(a =>
  unchecked.map(([key, value]) => ({
    address: a.address,
    method: a.method,
    key,
    value
  }))(toPairs(a.body))
);

const actionToEffects = def('actionToEffects')({})([
  BridgeAction,
  $.Either(HSError)($.Array(HSEffect))
])(bridgeAction =>
  pipeK([
    ({ bridgeAction }) =>
      Right({ bridgeAction, hsActions: bridgeActionToHSActions(bridgeAction) }),
    ({ bridgeAction, hsActions }) =>
      map(target => ({ bridgeAction, hsActions, target }))(
        addressToTarget(bridgeAction.address)
      ),
    ({ bridgeAction, hsActions, target }) =>
      sequence(Either)(
        map(
          cond([
            [
              a =>
                a.key === 'on' &&
                (startsWith('/lights/', a.address) ||
                  startsWith('/groups/', a.address)),
              a => Right({ name: 'on', params: { target, on: a.value } })
            ],
            [
              a => a.key === 'scene' && startsWith('/groups/', a.address),
              a =>
                Right({
                  name: 'setScene',
                  params: { target, scene: a.value }
                })
            ],
            [
              a =>
                a.key === 'bri' &&
                (startsWith('/lights/', a.address) ||
                  startsWith('/groups/', a.address)),
              a =>
                Right({
                  name: 'bri',
                  params: { target, bri: a.value }
                })
            ],
            [
              a => a.key === 'status' && startsWith('/sensors/', a.address),
              a =>
                Right({
                  name: 'set',
                  params: { target, value: a.value }
                })
            ]
          ])(x =>
            Left({
              name: 'NotImplementedYet',
              message: `[actionToEffects]: Not implemented yet ${JSON.stringify(
                x
              )}`
            })
          )
        )(hsActions)
      )
  ])(Right({ bridgeAction }))
);

export default actionToEffects;
