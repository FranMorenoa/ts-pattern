import { match, P } from '../src';
import { Equal, Expect } from '../src/types/helpers';

describe('optional', () => {
  it('should match even if the sub pattern is undefined', () => {
    type Input = { a?: 'cool' } | { b: 'lol' };

    const f = (input: Input) =>
      match(input)
        .with({ b: 'lol' }, (x) => {
          return false;
        })
        .with({ a: P.optional('cool') }, (x) => {
          type t = Expect<Equal<typeof x, { a?: 'cool' | undefined }>>;
          return true;
        })
        .exhaustive();

    expect(f({})).toBe(true);
    expect(f({ a: 'cool' })).toBe(true);
    expect(f({ b: 'lol' })).toBe(false);
  });

  it('should support a nested pattern', () => {
    type Input = { a?: { name: string; age: number } } | { b: '' };

    expect(
      match<Input>({})
        .with({ a: P.optional({ name: 'Hello' }) }, (x) => {
          type t = Expect<
            Equal<typeof x, { a?: { name: string; age: number } }>
          >;
          return true;
        })
        .with({ b: P.string }, (x) => {
          return false;
        })
        .exhaustive()
    ).toBe(true);
  });

  it('should support anonymous select', () => {
    type Input = { a?: { name: string; age: number } } | { b: '' };

    expect(
      match<Input>({})
        .with({ a: P.optional({ name: P.select() }) }, (x) => {
          type t = Expect<Equal<typeof x, string | undefined>>;
          return x;
        })
        .with({ a: P.optional(P.select()) }, (x) => {
          type t = Expect<
            Equal<typeof x, { name: string; age: number } | undefined>
          >;
          return x;
        })
        .with({ b: P.string }, (x) => {
          return '1';
        })
        .with({ a: undefined }, (x) => {
          return '1';
        })
        .with({ a: P.not(undefined) }, (x) => {
          return '1';
        })
        .exhaustive()
    ).toBe(undefined);
  });

  it('should support named select', () => {
    type Input = { a?: { name: string; age: number } } | { b: 'b' };

    expect(
      match<Input>({})
        .with(
          {
            a: P.optional({ name: P.select('name'), age: P.select('age') }),
          },
          ({ name, age }) => {
            type t1 = Expect<Equal<typeof name, string | undefined>>;
            type t2 = Expect<Equal<typeof age, number | undefined>>;
            return name;
          }
        )
        .with({ b: 'b' }, (x) => {
          return '1';
        })
        .with({ a: undefined }, (x) => {
          return '1';
        })
        .with({ a: P.not(undefined) }, (x) => {
          return '1';
        })
        .exhaustive()
    ).toBe(undefined);
  });

  it('should support named select', () => {
    type Input =
      | {
          type: 'a';
          data?: { type: 'img'; src: string } | { type: 'text'; p: string };
        }
      | {
          type: 'b';
          data?: { type: 'video'; src: number } | { type: 'gif'; p: string };
        };

    expect(
      match<Input>({ type: 'a', data: { type: 'text', p: 'paragraph' } })
        .with(
          {
            type: 'a',
            data: P.optional({ type: 'img' }),
          },
          (x) => {
            type t = Expect<
              Equal<
                typeof x,
                { type: 'a'; data?: { type: 'img'; src: string } | undefined }
              >
            >;

            return x;
          }
        )
        .with(
          {
            type: 'a',
            data: P.optional({ type: 'text', p: P.select('p') }),
          },
          (x) => {
            type t = Expect<Equal<typeof x, { p: string | undefined }>>;
            return x.p;
          }
        )
        .with(
          {
            type: 'b',
            data: P.optional({ type: 'video', src: P.select('src') }),
          },
          ({ src }) => {
            type t = Expect<Equal<typeof src, number | undefined>>;
            return src;
          }
        )
        .with(
          {
            type: 'b',
            data: P.optional({ type: 'gif', p: P.select('p') }),
          },
          ({ p }) => {
            type t = Expect<Equal<typeof p, string | undefined>>;
            return p;
          }
        )
        .exhaustive()
    ).toBe('paragraph');
  });

  it('should support list patterns', () => {
    type Input = { maybeList?: { text: string }[] };

    const f = (input: Input) =>
      match(input)
        .with({ maybeList: P.optional(P.array({ text: P.select() })) }, (x) => {
          type t = Expect<Equal<typeof x, string[] | undefined>>;
          return x;
        })
        .exhaustive();

    expect(f({})).toBe(undefined);
    expect(f({ maybeList: [{ text: 'Hello' }, { text: 'Bonjour' }] })).toEqual([
      'Hello',
      'Bonjour',
    ]);
  });
});
