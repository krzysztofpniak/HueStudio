import {
  scalar,
  array,
  fn,
  getPolyNames,
  constraint
} from '../../../app/hueScript/typeSystem';

describe('getPolyNames', () => {
  it('get from scalar', () => {
    expect(getPolyNames(scalar('a'))).toEqual(['a']);
  });
  it('get from array', () => {
    expect(getPolyNames(array(scalar('a')))).toEqual(['a']);
  });
  it('get from function', () => {
    expect(
      getPolyNames(
        fn([
          scalar('a'),
          scalar('b'),
          scalar('Number'),
          fn([scalar('a'), scalar('d')])
        ])
      )
    ).toEqual(['a', 'b', 'd']);
  });
  it('get from constraint', () => {
    expect(
      getPolyNames(
        constraint({ a: ['Number', 'String'] })(
          fn([
            scalar('a'),
            scalar('b'),
            scalar('Number'),
            fn([scalar('a'), scalar('d')])
          ])
        )
      )
    ).toEqual(['a', 'b', 'd']);
  });
});
