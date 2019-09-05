import {
  createHSContext,
  putContextVar,
  translateVariableDeclaration
} from '../../../app/hueScript/astToBridgeState';
import { pipe, Right } from '../../../app/sanctuary';
import { scalar } from '../../../app/hueScript/typeSystem';
import { parseHue } from '../../../app/hueScript';

const varDeclarationAst = parseHue('const x = 1, y = 8;').data.body[0];

describe('translateVariableDeclaration', () => {
  it('should translate const', () => {
    const context = createHSContext();
    expect(translateVariableDeclaration(varDeclarationAst)(context)).toEqual(
      Right(
        pipe([
          putContextVar('y')({ type: scalar('Number'), value: 8 }),
          putContextVar('x')({ type: scalar('Number'), value: 1 })
        ])(context)
      )
    );
  });
});
