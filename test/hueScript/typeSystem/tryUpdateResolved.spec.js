import { scalar } from '../../../app/hueScript/typeSystem';
import { tryUpdateResolved } from '../../../app/hueScript/resolveType';

const scalarA = scalar('a');
const scalarB = scalar('b');
const number = scalar('Number');

describe('tryUpdateResolved', () => {
  it('should update not existing', () => {
    expect(tryUpdateResolved('a')(scalarB)({})).toEqual({ a: scalarB });
  });
  it('should update existing poly with concrete', () => {
    expect(tryUpdateResolved('a')(number)({ a: scalarB })).toEqual({
      a: number
    });
  });
  it('should update existing poly and its dependencies with concrete', () => {
    expect(tryUpdateResolved('b')(number)({ a: scalarA, b: scalarA })).toEqual({
      a: number,
      b: number
    });
  });
});
