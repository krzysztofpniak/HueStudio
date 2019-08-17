import extractContraints from './extractConstraints';
import constraint from './constraint';

const fn = (...signature) => {
  const [constr, types] = extractContraints(signature);
  return constraint(constr, { kind: 'Function', signature: types });
};

export default fn;
