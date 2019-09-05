import show from 'sanctuary-show';
import Z from 'sanctuary-type-classes';

var ArrayType$prototype = {
  /* eslint-disable key-spacing */
  //constructor: ArrayType,
  isArrayType: true,
  '@@show': ArrayType$prototype$show,
  'fantasy-land/map': ArrayType$prototype$map,
  'fantasy-land/ap': ArrayType$prototype$ap,
  'fantasy-land/chain': ArrayType$prototype$chain,
  'fantasy-land/reduce': ArrayType$prototype$reduce,
  'fantasy-land/traverse': ArrayType$prototype$traverse
  /* eslint-enable key-spacing */
};

ArrayType$prototype.inspect = ArrayType$prototype$show;

//. `Maybe a` satisfies the following [Fantasy Land][] specifications:
//.
//. ```javascript
//. > const Useless = require ('sanctuary-useless')
//.
//. > S.map (k => k + ' '.repeat (16 - k.length) +
//. .             (Z[k].test (Just (Useless)) ? '\u2705   ' :
//. .              Z[k].test (Nothing)        ? '\u2705 * ' :
//. .              /* otherwise */              '\u274C   '))
//. .       (S.keys (S.unchecked.filter (S.is ($.TypeClass)) (Z)))
//. [ 'Setoid          ✅ * ',  // if ‘a’ satisfies Setoid
//. . 'Ord             ✅ * ',  // if ‘a’ satisfies Ord
//. . 'Semigroupoid    ❌   ',
//. . 'Category        ❌   ',
//. . 'Semigroup       ✅ * ',  // if ‘a’ satisfies Semigroup
//. . 'Monoid          ✅ * ',  // if ‘a’ satisfies Semigroup
//. . 'Group           ❌   ',
//. . 'Filterable      ✅   ',
//. . 'Functor         ✅   ',
//. . 'Bifunctor       ❌   ',
//. . 'Profunctor      ❌   ',
//. . 'Apply           ✅   ',
//. . 'Applicative     ✅   ',
//. . 'Chain           ✅   ',
//. . 'ChainRec        ✅   ',
//. . 'Monad           ✅   ',
//. . 'Alt             ✅   ',
//. . 'Plus            ✅   ',
//. . 'Alternative     ✅   ',
//. . 'Foldable        ✅   ',
//. . 'Traversable     ✅   ',
//. . 'Extend          ✅   ',
//. . 'Comonad         ❌   ',
//. . 'Contravariant   ❌   ' ]
//. ```

//# Maybe :: TypeRep Maybe
//.
//. Maybe [type representative][].

//# Maybe.Nothing :: Maybe a
//.
//. The empty value of type `Maybe a`.
//.
//. ```javascript
//. > Nothing
//. Nothing
//. ```
//# Maybe.Just :: a -> Maybe a
//.
//. Constructs a value of type `Maybe a` from a value of type `a`.
//.
//. ```javascript
//. > Just (42)
//. Just (42)
//. ```
var ArrayType = function(value) {
  var arrayType = Object.create(ArrayType$prototype);
  if (Z.Setoid.test(value)) {
    arrayType['fantasy-land/equals'] = ArrayType$prototype$equals;
  }
  arrayType.value = value;
  return arrayType;
};

//# Maybe.@@type :: String
//.
//. Maybe [type identifier][].
//.
//. ```javascript
//. > type (Just (42))
//. 'sanctuary-maybe/Maybe@1'
//.
//. > type.parse (type (Just (42)))
//. {namespace: 'sanctuary-maybe', name: 'Maybe', version: 1}
//. ```
ArrayType['@@type'] = 'hue-script/ArrayType@1';

//# Maybe.fantasy-land/of :: a -> Maybe a
//.
//.   - `of (Maybe) (x)` is equivalent to `Just (x)`
//.
//. ```javascript
//. > S.of (Maybe) (42)
//. Just (42)
//. ```
ArrayType['fantasy-land/of'] = ArrayType;

//# Maybe#@@show :: Showable a => Maybe a ~> () -> String
//.
//.   - `show (Nothing)` is equivalent to `'Nothing'`
//.   - `show (Just (x))` is equivalent to `'Just (' + show (x) + ')'`
//.
//. ```javascript
//. > show (Nothing)
//. 'Nothing'
//.
//. > show (Just (['foo', 'bar', 'baz']))
//. 'Just (["foo", "bar", "baz"])'
//. ```
function ArrayType$prototype$show() {
  return 'ArrayType (' + show(this.value) + ')';
}

//# Maybe#fantasy-land/equals :: Setoid a => Maybe a ~> Maybe a -> Boolean
//.
//.   - `Nothing` is equal to `Nothing`
//.   - `Just (x)` is equal to `Just (y)` [iff][] `x` is equal to `y`
//.     according to [`Z.equals`][]
//.   - `Nothing` is never equal to `Just (x)`
//.
//. ```javascript
//. > S.equals (Nothing) (Nothing)
//. true
//.
//. > S.equals (Just ([1, 2, 3])) (Just ([1, 2, 3]))
//. true
//.
//. > S.equals (Just ([1, 2, 3])) (Just ([3, 2, 1]))
//. false
//.
//. > S.equals (Just ([1, 2, 3])) (Nothing)
//. false
//. ```
function ArrayType$prototype$equals(other) {
  return other.isArrayType && Z.equals(this.value, other.value);
}

//# Maybe#fantasy-land/map :: Maybe a ~> (a -> b) -> Maybe b
//.
//.   - `map (f) (Nothing)` is equivalent to `Nothing`
//.   - `map (f) (Just (x))` is equivalent to `Just (f (x))`
//.
//. ```javascript
//. > S.map (Math.sqrt) (Nothing)
//. Nothing
//.
//. > S.map (Math.sqrt) (Just (9))
//. Just (3)
//. ```

function ArrayType$prototype$map(f) {
  return ArrayType(f(this.value));
}

//# Maybe#fantasy-land/ap :: Maybe a ~> Maybe (a -> b) -> Maybe b
//.
//.   - `ap (Nothing) (Nothing)` is equivalent to `Nothing`
//.   - `ap (Nothing) (Just (x))` is equivalent to `Nothing`
//.   - `ap (Just (f)) (Nothing)` is equivalent to `Nothing`
//.   - `ap (Just (f)) (Just (x))` is equivalent to `Just (f (x))`
//.
//. ```javascript
//. > S.ap (Nothing) (Nothing)
//. Nothing
//.
//. > S.ap (Nothing) (Just (9))
//. Nothing
//.
//. > S.ap (Just (Math.sqrt)) (Nothing)
//. Nothing
//.
//. > S.ap (Just (Math.sqrt)) (Just (9))
//. Just (3)
//. ```
function ArrayType$prototype$ap(other) {
  return other.isArrayType ? ArrayType(other.value(this.value)) : other;
}

//# Maybe#fantasy-land/chain :: Maybe a ~> (a -> Maybe b) -> Maybe b
//.
//.   - `chain (f) (Nothing)` is equivalent to `Nothing`
//.   - `chain (f) (Just (x))` is equivalent to `f (x)`
//.
//. ```javascript
//. > const head = xs => xs.length === 0 ? Nothing : Just (xs[0])
//.
//. > S.chain (head) (Nothing)
//. Nothing
//.
//. > S.chain (head) (Just ([]))
//. Nothing
//.
//. > S.chain (head) (Just (['foo', 'bar', 'baz']))
//. Just ('foo')
//. ```
function ArrayType$prototype$chain(f) {
  return f(this.value);
}

//# Maybe#fantasy-land/reduce :: Maybe a ~> ((b, a) -> b, b) -> b
//.
//.   - `reduce (f) (x) (Nothing)` is equivalent to `x`
//.   - `reduce (f) (x) (Just (y))` is equivalent to `f (x) (y)`
//.
//. ```javascript
//. > S.reduce (S.concat) ('abc') (Nothing)
//. 'abc'
//.
//. > S.reduce (S.concat) ('abc') (Just ('xyz'))
//. 'abcxyz'
//. ```
function ArrayType$prototype$reduce(f, x) {
  return f(x, this.value);
}

//# Maybe#fantasy-land/traverse :: Applicative f => Maybe a ~> (TypeRep f, a -> f b) -> f (Maybe b)
//.
//.   - `traverse (A) (f) (Nothing)` is equivalent to `of (A) (Nothing)`
//.   - `traverse (A) (f) (Just (x))` is equivalent to `map (Just) (f (x))`
//.
//. ```javascript
//. > S.traverse (Array) (S.words) (Nothing)
//. [Nothing]
//.
//. > S.traverse (Array) (S.words) (Just ('foo bar baz'))
//. [Just ('foo'), Just ('bar'), Just ('baz')]
//. ```
function ArrayType$prototype$traverse(typeRep, f) {
  return Z.map(ArrayType, f(this.value));
}

//. [Fantasy Land]:             v:fantasyland/fantasy-land
//. [`Z.equals`]:               v:sanctuary-js/sanctuary-type-classes#equals
//. [`Z.lte`]:                  v:sanctuary-js/sanctuary-type-classes#lte
//. [iff]:                      https://en.wikipedia.org/wiki/If_and_only_if
//. [type identifier]:          v:sanctuary-js/sanctuary-type-identifiers
//. [type representative]:      v:fantasyland/fantasy-land#type-representatives

export default ArrayType;
