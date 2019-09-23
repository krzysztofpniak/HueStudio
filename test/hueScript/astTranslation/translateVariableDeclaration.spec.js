import {
  astToLocIndex,
  createHSContext,
  putContextInfo,
  putContextVar,
  translateVariableDeclaration
} from '../../../app/hueScript/astToBridgeState';
import { fromEither, Just, Left, pipe, Right } from '../../../app/sanctuary';
import { scalar } from '../../../app/hueScript/typeSystem';
import { parseHue } from '../../../app/hueScript';
import typeToString from '../../../app/hueScript/typeSystem/typeToString';

const varDeclarationAst = fromEither({})(parseHue('const x = 1, y = 8;'))
  .body[0];

describe('translateVariableDeclaration', () => {
  it('should translate const', () => {
    const context = createHSContext({ lights: {}, groups: {} });
    expect(translateVariableDeclaration(varDeclarationAst)(context)).toEqual(
      Right(
        pipe([
          putContextVar('y')({ type: scalar('Number'), value: 8 }),
          putContextVar('x')({ type: scalar('Number'), value: 1 }),
          putContextInfo(astToLocIndex(varDeclarationAst.declarations[0].id))({
            signature: typeToString(scalar('Number'))
          }),
          putContextInfo(astToLocIndex(varDeclarationAst.declarations[1].id))({
            signature: typeToString(scalar('Number'))
          })
        ])(context)
      )
    );
  });
  it('should not translate when variable already declared', () => {
    const context = putContextVar('x')({ type: scalar('Number'), value: 1 })(
      createHSContext({ lights: {}, groups: {} })
    );
    expect(translateVariableDeclaration(varDeclarationAst)(context)).toEqual(
      Left({
        name: 'AlreadyDeclared',
        message: 'Variable has been already declared',
        location: Just(varDeclarationAst.declarations[0].id.location)
      })
    );
  });
});
