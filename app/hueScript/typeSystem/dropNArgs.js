import { curry, drop, evolve } from 'ramda';
import $ from 'sanctuary-def';
import { def, HSType } from '../../sanctuary/types';
import { isCallable } from './helpers';

const dropNArgs = def('dropNArgs')({})([$.NonNegativeInteger, HSType, HSType])(
  n => type => {
    if (isCallable(type)) {
      return evolve({ signature: drop(n) }, type);
    }

    return type;
  }
);

export default dropNArgs;
