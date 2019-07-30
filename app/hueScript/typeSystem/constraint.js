const constraint = (def, type) => {
  if (type.kind === 'Constraint') {
    return {
      kind: 'Constraint',
      of: { ...def, ...type.of },
      in: type.in
    };
  }
  return {
    kind: 'Constraint',
    of: def,
    in: type
  };
};

export default constraint;
