import type * as symbols from '../symbols';
import type { Cast, Equal, IsAny, UnionToIntersection } from './helpers';
import type { Matchable, Pattern } from './Pattern';

type SelectionsRecord = Record<string, [unknown, unknown[]]>;

export type ListPatternSelection<p extends Pattern<any>> = {
  type: 'listPattern';
  pattern: p;
};

export type OptionalPatternSelection<p extends Pattern<any>> = {
  type: 'optionalPattern';
  pattern: p;
};

export type SomeSelection<ps extends Pattern<any>[]> = {
  type: 'someSelection';
  patterns: ps;
};

export type EverySelection<ps extends Pattern<any>[]> = {
  type: 'everySelection';
  patterns: ps;
};

export type NoneSelection = {
  type: 'none';
};
export type Select<key extends string> = {
  type: 'select';
  key: key;
};

export type SelectionType =
  | OptionalPatternSelection<any>
  | ListPatternSelection<any>
  | NoneSelection
  | SomeSelection<any>
  | EverySelection<any>
  | Select<string>;

type MapOptional<selections> = {
  [k in keyof selections]: selections[k] extends [infer v, infer subpath]
    ? [v | undefined, subpath]
    : never;
};

type MapList<selections> = {
  [k in keyof selections]: selections[k] extends [infer v, infer subpath]
    ? [v[], subpath]
    : never;
};

type ReduceFindSelectionUnion<
  i,
  ps extends any[],
  output = never
> = ps extends [infer head, ...infer tail]
  ? ReduceFindSelectionUnion<i, tail, output | FindSelectionUnion<i, head>>
  : output;

export type FindSelectionUnion<
  i,
  p,
  // path just serves as an id, to identify different anonymous patterns which have the same type
  path extends any[] = []
> = IsAny<i> extends true
  ? never
  : p extends Matchable<any, any, infer matcherType, infer sel>
  ? sel extends NoneSelection
    ? never
    : sel extends Select<infer k>
    ? { [kk in k]: [i, path] }
    : sel extends OptionalPatternSelection<infer pattern>
    ? MapOptional<FindSelectionUnion<i, pattern>>
    : sel extends ListPatternSelection<infer pattern>
    ? i extends (infer ii)[]
      ? MapList<FindSelectionUnion<ii, pattern>>
      : never
    : sel extends SomeSelection<infer patterns>
    ? MapOptional<ReduceFindSelectionUnion<i, patterns>>
    : sel extends EverySelection<infer patterns>
    ? ReduceFindSelectionUnion<i, patterns>
    : never
  : p extends readonly (infer pp)[]
  ? i extends readonly (infer ii)[]
    ? [i, p] extends [
        readonly [infer i1, infer i2, infer i3, infer i4, infer i5],
        readonly [infer p1, infer p2, infer p3, infer p4, infer p5]
      ]
      ?
          | FindSelectionUnion<i1, p1, [...path, 1]>
          | FindSelectionUnion<i2, p2, [...path, 2]>
          | FindSelectionUnion<i3, p3, [...path, 3]>
          | FindSelectionUnion<i4, p4, [...path, 4]>
          | FindSelectionUnion<i5, p5, [...path, 5]>
      : [i, p] extends [
          readonly [infer i1, infer i2, infer i3, infer i4],
          readonly [infer p1, infer p2, infer p3, infer p4]
        ]
      ?
          | FindSelectionUnion<i1, p1, [...path, 1]>
          | FindSelectionUnion<i2, p2, [...path, 2]>
          | FindSelectionUnion<i3, p3, [...path, 3]>
          | FindSelectionUnion<i4, p4, [...path, 4]>
      : [i, p] extends [
          readonly [infer i1, infer i2, infer i3],
          readonly [infer p1, infer p2, infer p3]
        ]
      ?
          | FindSelectionUnion<i1, p1, [...path, 1]>
          | FindSelectionUnion<i2, p2, [...path, 2]>
          | FindSelectionUnion<i3, p3, [...path, 3]>
      : [i, p] extends [
          readonly [infer i1, infer i2],
          readonly [infer p1, infer p2]
        ]
      ?
          | FindSelectionUnion<i1, p1, [...path, 1]>
          | FindSelectionUnion<i2, p2, [...path, 2]>
      : FindSelectionUnion<ii, pp, [...path, 1]>
    : never
  : p extends object
  ? i extends object
    ? {
        [k in keyof p]: k extends keyof i
          ? FindSelectionUnion<i[k], p[k], [...path, k]>
          : never;
      }[keyof p]
    : never
  : never;

export type SeveralAnonymousSelectError<
  a = 'You can only use a single anonymous selection (with `select()`) in your pattern. If you need to select multiple values, give them names with `select(<name>)` instead'
> = {
  __error: never;
} & a;

export type MixedNamedAndAnonymousSelectError<
  a = 'Mixing named selections (`select("name")`) and anonymous selections (`select()`) is forbiden. Please, only use named selections.'
> = {
  __error: never;
} & a;

// SelectionToArgs :: [number | string, value][] -> [...args]
export type SelectionToArgs<selections extends SelectionsRecord, i> = [
  keyof selections
] extends [never]
  ? i
  : symbols.anonymousSelectKey extends keyof selections
  ? // If the path is never, it means several anonymous patterns were `&` together
    [selections[symbols.anonymousSelectKey][1]] extends [never]
    ? SeveralAnonymousSelectError
    : keyof selections extends symbols.anonymousSelectKey
    ? selections[symbols.anonymousSelectKey][0]
    : MixedNamedAndAnonymousSelectError
  : { [k in keyof selections]: selections[k][0] };

export type Selections<i, p> = Cast<
  UnionToIntersection<{} | FindSelectionUnion<i, p>>,
  SelectionsRecord
>;

export type FindSelected<i, p> =
  // This happens if the provided pattern didn't extend Pattern<i>,
  // Because the compiler falls back on the general `Pattern<i>` type
  // in this case.
  Equal<p, Pattern<i>> extends true ? i : SelectionToArgs<Selections<i, p>, i>;
