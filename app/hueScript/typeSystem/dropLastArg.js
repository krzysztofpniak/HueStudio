import { evolve } from 'ramda';
import { filterIndexed, isCallable } from './helpers';
import $ from 'sanctuary-def';
import { HSType, def } from '../../sanctuary/types';

const dropLastArg = def('dropLastArg')({})([HSType, HSType])(type => {
  if (isCallable(type)) {
    return evolve(
      { signature: s => filterIndexed((si, idx) => idx !== s.length - 2, s) },
      type
    );
  }

  return type;
});

export default dropLastArg;
