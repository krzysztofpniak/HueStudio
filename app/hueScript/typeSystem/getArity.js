import { isCallable } from './helpers';

const getArity = type => (isCallable(type) ? type.signature.length - 1 : 0);

export default getArity;
