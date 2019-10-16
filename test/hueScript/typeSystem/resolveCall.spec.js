import { resolveCall } from '../../../app/hueScript/resolveType';
import {
  scalar,
  array,
  fn,
  constraint
} from '../../../app/hueScript/typeSystem';
import { Left, Nothing, Right } from '../../../app/sanctuary';
import typeMismatchError from '../../../app/hueScript/typeSystem/typeMismatchError';
import typeToTypeResolution from '../../../app/hueScript/typeSystem/typeToTypeResolution';

const number = scalar('Number');
const group = scalar('Group');
const numberR = typeToTypeResolution(number);
const groupR = typeToTypeResolution(group);
const fnNumber = fn([number]);
const fnNumberR = typeToTypeResolution(fnNumber);
const fnNumberGroup = fn([number, group]);
const fnNumberGroupR = typeToTypeResolution(fnNumberGroup);

describe('resolveCall', () => {
  it('should resolve (), (() -> Number) into Number', () => {
    expect(resolveCall([])(fnNumber)).toEqual(
      Right({ type: number, resolutions: {} })
    );
  });

  it('should resolve (Number), (Number -> Group) into Group', () => {
    expect(resolveCall([number])(fnNumberGroup)).toEqual(
      Right({ type: group, resolutions: {} })
    );
  });

  it('should resolve (Number), (Number -> Group -> Group) into (Group -> Group)', () => {
    expect(
      resolveCall([number])(
        fn([scalar('Number'), scalar('Group'), scalar('Group')])
      )
    ).toEqual(
      Right({ type: fn([scalar('Group'), scalar('Group')]), resolutions: {} })
    );
  });

  it('should resolve (Number), (Number -> a -> a) into (a -> a)', () => {
    expect(
      resolveCall([number])(
        constraint({ a: ['Light', 'Group'] })(
          fn([scalar('Number'), scalar('a'), scalar('a')])
        )
      )
    ).toEqual(
      Right({
        type: constraint({ a: ['Light', 'Group'] })(
          fn([scalar('a'), scalar('a')])
        ),
        resolutions: {
          a: constraint({ a: ['Light', 'Group'] })(scalar('a'))
        }
      })
    );
  });

  it('should resolve (Number, Group), (Number -> a -> a) into Group', () => {
    expect(
      resolveCall([number, group])(
        constraint({ a: ['Light', 'Group'] })(
          fn([scalar('Number'), scalar('a'), scalar('a')])
        )
      )
    ).toEqual(Right({ type: scalar('Group'), resolutions: { a: group } }));
  });

  it('should not resolve (Number, Number), (Number -> a -> a) with constraint', () => {
    expect(
      resolveCall([number, number])(
        constraint({ a: ['Light', 'Group'] })(
          fn([scalar('Number'), scalar('a'), scalar('a')])
        )
      )
    ).toEqual(
      Left({
        ...typeMismatchError(
          constraint({ a: ['Light', 'Group'] })(scalar('a'))
        )(scalar('Number'))(Nothing),
        argIdx: 1
      })
    );
  });

  it('should resolve (Number -> Group), ((a -> b) -> [a] -> [b]) into ([Number] -> [Group])', () => {
    expect(
      resolveCall([fn([scalar('Number'), scalar('Group')])])(
        fn([
          fn([scalar('a'), scalar('b')]),
          array(scalar('a')),
          array(scalar('b'))
        ])
      )
    ).toEqual(
      Right({
        type: fn([array(scalar('Number')), array(scalar('Group'))]),
        resolutions: {
          a: number,
          b: group
        }
      })
    );
  });
});
