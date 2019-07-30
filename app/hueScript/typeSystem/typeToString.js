import { compose, join, map, mapObjIndexed, values } from 'ramda';
import { scalar } from '../typeSystem';

const typeToString = type => {
  switch (type.kind) {
    case 'Scalar':
      return type.name;
    case 'Array':
      return `[${typeToString(type.of)}]`;
    case 'Function':
      return compose(
        s => `(${s})`,
        join(' → '),
        map(typeToString),
        s => (s.length > 1 ? s : [scalar('()'), ...s])
      )(type.signature);
    case 'Constraint':
      return `${join(
        ', ',
        values(mapObjIndexed((v, k) => `${k} ∈ {${join(', ', v)}}`, type.of))
      )} ⇒ ${typeToString(type.in)}`;
  }
};

export default typeToString;
