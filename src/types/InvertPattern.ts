import type { __ } from '../PatternType';
import { IsPlainObject } from './helpers';
import type {
  SelectPattern,
  GuardPattern,
  NotPattern,
  Primitives,
} from './Pattern';

/**
 * ### InvertPattern
 * Since patterns have special wildcard values, we need a way
 * to transform a pattern into the type of value it represents
 */
export type InvertPattern<p> = p extends typeof __.number
  ? number
  : p extends typeof __.string
  ? string
  : p extends typeof __.boolean
  ? boolean
  : p extends SelectPattern<string>
  ? unknown
  : p extends typeof __
  ? unknown
  : p extends GuardPattern<any, infer p1>
  ? p1
  : p extends NotPattern<infer a1>
  ? NotPattern<InvertPattern<a1>>
  : p extends Primitives
  ? p
  : p extends (infer pp)[]
  ? p extends [infer p1, infer p2, infer p3, infer p4, infer p5]
    ? [
        InvertPattern<p1>,
        InvertPattern<p2>,
        InvertPattern<p3>,
        InvertPattern<p4>,
        InvertPattern<p5>
      ]
    : p extends [infer p1, infer p2, infer p3, infer p4]
    ? [
        InvertPattern<p1>,
        InvertPattern<p2>,
        InvertPattern<p3>,
        InvertPattern<p4>
      ]
    : p extends [infer p1, infer p2, infer p3]
    ? [InvertPattern<p1>, InvertPattern<p2>, InvertPattern<p3>]
    : p extends [infer p1, infer p2]
    ? [InvertPattern<p1>, InvertPattern<p2>]
    : InvertPattern<pp>[]
  : p extends Map<infer pk, infer pv>
  ? Map<pk, InvertPattern<pv>>
  : p extends Set<infer pv>
  ? Set<InvertPattern<pv>>
  : IsPlainObject<p> extends true
  ? { [k in keyof p]: InvertPattern<p[k]> }
  : p;

/**
 * ### InvertNotPattern
 * This generic takes the inverted pattern `p` and the input `i`
 * and eliminates `NotPattern`s from `p`.
 *
 * It's separated from InvertPattern<p> because it's
 * expensive to compute, and is only required by `DeepExclude`
 * on exhaustive pattern matching.
 */
export type InvertNotPattern<p, i> = p extends NotPattern<infer p1>
  ? Exclude<i, p1>
  : p extends (infer pp)[]
  ? i extends (infer ii)[]
    ? p extends [infer p1, infer p2, infer p3, infer p4, infer p5]
      ? i extends [infer i1, infer i2, infer i3, infer i4, infer i5]
        ? [
            InvertNotPattern<p1, i1>,
            InvertNotPattern<p2, i2>,
            InvertNotPattern<p3, i3>,
            InvertNotPattern<p4, i4>,
            InvertNotPattern<p5, i5>
          ]
        : p
      : p extends [infer p1, infer p2, infer p3, infer p4]
      ? i extends [infer i1, infer i2, infer i3, infer i4]
        ? [
            InvertNotPattern<p1, i1>,
            InvertNotPattern<p2, i2>,
            InvertNotPattern<p3, i3>,
            InvertNotPattern<p4, i4>
          ]
        : p
      : p extends [infer p1, infer p2, infer p3]
      ? i extends [infer i1, infer i2, infer i3]
        ? [
            InvertNotPattern<p1, i1>,
            InvertNotPattern<p2, i2>,
            InvertNotPattern<p3, i3>
          ]
        : p
      : p extends [infer p1, infer p2]
      ? i extends [infer i1, infer i2]
        ? [InvertNotPattern<p1, i1>, InvertNotPattern<p2, i2>]
        : p
      : InvertNotPattern<pp, ii>[]
    : p
  : p extends Map<infer pk, infer pv>
  ? i extends Map<any, infer iv>
    ? Map<pk, InvertNotPattern<pv, iv>>
    : p
  : p extends Set<infer pv>
  ? i extends Set<infer iv>
    ? Set<InvertNotPattern<pv, iv>>
    : p
  : IsPlainObject<p> extends true
  ? IsPlainObject<i> extends true
    ? {
        [k in keyof p]: k extends keyof i ? InvertNotPattern<p[k], i[k]> : p[k];
      }
    : p
  : p;
