import { compose, join, map, mapObjIndexed, values, keys } from 'ramda';
import { scalar } from '../typeSystem';
import $ from 'sanctuary-def';
import { def, HSType } from '../../sanctuary/types';

const typeToString = def('typeToString')({})([HSType, $.String])(type => {
  const constraints = keys(type.constraints).length
    ? `${join(
        ', ',
        values(
          mapObjIndexed((v, k) => `${k} ∈ {${join(', ', v)}}`, type.constraints)
        )
      )} ⇒ `
    : '';
  switch (type.kind) {
    case 'Scalar':
      return constraints + type.name;
    case 'Array':
      return `${constraints}[${typeToString(type.of)}]`;
    case 'Function':
      return compose(
        s => `${constraints}(${s})`,
        join(' → '),
        map(typeToString),
        s => (s.length > 1 ? s : [scalar('()'), ...s])
      )(type.signature);
  }
});

export default typeToString;
