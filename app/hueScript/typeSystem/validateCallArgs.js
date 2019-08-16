import { unwrapConstraint } from './helpers';

const validateCallArgs = (args, type) => {
  const [constr, func] = unwrapConstraint(type);

  for (let i = 0; i < args.length; i++) {
    // TODO
    /*const s = func.signature[i];
    if (
      !(
        (s.kind === 'Scalar' && test(/^[a-z]/, s.name)) ||
        equals(args[i].type, s)
      )
    ) {
      return i;
    }*/
  }
  return null;
};

export default validateCallArgs;
