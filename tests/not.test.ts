import { Expect, Equal } from '../src/types/helpers';
import { match, P } from '../src';
import { Option } from './types-catalog/utils';

describe('not', () => {
  it('should work at the top level', () => {
    const get = (x: unknown): string =>
      match(x)
        .with(P.not(P.number), (x) => {
          type t = Expect<Equal<typeof x, unknown>>;
          return 'not a number';
        })
        .with(P.not(P.string), (x) => {
          type t = Expect<Equal<typeof x, unknown>>;
          return 'not a string';
        })
        .run();

    expect(get(20)).toEqual('not a string');
    expect(get('hello')).toEqual('not a number');
  });

  it('should work in a nested structure', () => {
    type DS = { x: string | number; y: string | number };
    const get = (x: DS) =>
      match(x)
        .with({ y: P.number, x: P.not(P.string) }, (x) => {
          type t = Expect<Equal<typeof x, { x: number; y: number }>>;
          return 'yes';
        })
        .with(P.any, () => 'no')
        .run();

    expect(get({ x: 2, y: 2 })).toEqual('yes');
    expect(get({ y: 2, x: 'hello' })).toEqual('no');
  });

  it('should discriminate union types correctly', () => {
    const one = 'one';
    const two = 'two';

    const get = (x: 'one' | 'two') =>
      match(x)
        .with(P.not(one), (x) => {
          type t = Expect<Equal<typeof x, 'two'>>;
          return 'not 1';
        })
        .with(P.not(two), (x) => {
          type t = Expect<Equal<typeof x, 'one'>>;
          return 'not 2';
        })
        .run();

    expect(get('two')).toEqual('not 1');
    expect(get('one')).toEqual('not 2');
  });

  it('should discriminate union types contained in objects correctly', () => {
    const one = 'one';
    const two = 'two';

    const get = (x: 'one' | 'two') =>
      match({ key: x })
        .with({ key: P.not(one) }, (x) => {
          type t = Expect<Equal<typeof x, { key: 'two' }>>;
          return 'not 1';
        })
        .with({ key: P.not(two) }, (x) => {
          type t = Expect<Equal<typeof x, { key: 'one' }>>;
          return 'not 2';
        })
        .run();

    expect(get('two')).toEqual('not 1');
    expect(get('one')).toEqual('not 2');
  });

  it('should discriminate union types correctly', () => {
    type Input =
      | {
          type: 'success';
        }
      | { type: 'error' };

    const get = (x: Input) =>
      match(x)
        .with({ type: P.not('success') }, (x) => {
          type t = Expect<Equal<typeof x, { type: 'error' }>>;
          return 'error';
        })
        .with({ type: P.not('error') }, (x) => {
          type t = Expect<Equal<typeof x, { type: 'success' }>>;
          return 'success';
        })
        .exhaustive();

    expect(get({ type: 'error' })).toEqual('error');
    expect(get({ type: 'success' })).toEqual('success');
  });

  it('should correctly invert the type of a Matcher', () => {
    const nullable = P.when(
      (x: unknown): x is null | undefined => x === null || x === undefined
    );

    expect(
      match<{ str: string } | null>({ str: 'hello' })
        .with(P.not(nullable), ({ str }) => str)
        .with(nullable, () => '')
        .exhaustive()
    ).toBe('hello');

    const untypedNullable = P.when((x) => x === null || x === undefined);

    expect(
      match<{ str: string }>({ str: 'hello' })
        .with(P.not(untypedNullable), ({ str }) => str)
        // @ts-expect-error
        .exhaustive()
    ).toBe('hello');
  });

  it('should correctly exclude unit types with the unit wildcard', () => {
    expect(
      match<{ str: string | null | undefined }>({ str: 'hello' })
        .with({ str: P.not(P.nullish) }, ({ str }) => {
          type t = Expect<Equal<typeof str, string>>;

          return str;
        })
        .with({ str: P.nullish }, ({ str }) => {
          type t = Expect<Equal<typeof str, null | undefined>>;

          return null;
        })
        .exhaustive()
    ).toBe('hello');
  });

  it("shouldn't change a the type if its any or unknown", () => {
    expect(
      match<{ str: any }>({ str: 'hello' })
        .with({ str: P.not(P.nullish) }, (x) => {
          type t = Expect<Equal<typeof x, { str: any }>>;
          return 'hello';
        })
        .otherwise(() => 'no')
    ).toBe('hello');
  });

  it('should successfully exclude cases ', () => {
    const f = (
      optionalNumber: Option<{
        coords: { x: 'left' | 'right'; y: 'top' | 'bottom' };
      }>
    ) =>
      match(optionalNumber)
        .with(
          {
            type: 'some',
            value: {
              coords: P.not({ x: 'left' }),
            },
          },
          (x) => {
            type t = Expect<
              Equal<
                typeof x['value']['coords'],
                {
                  y: 'top' | 'bottom';
                  x: 'right';
                }
              >
            >;

            return 'ok';
          }
        )
        .otherwise(() => 'not ok');
  });

  it('should consider the expression exhaustive if the sub pattern matches something that will never match', () => {
    expect(
      match<{ str: string }>({ str: 'hello' })
        .with(P.not(2), ({ str }) => str)
        .exhaustive()
    ).toBe('hello');

    expect(() =>
      match<number>(1)
        .with(P.not(P.number), (n) => n)
        // @ts-expect-error
        .exhaustive()
    ).toThrow();
  });

  it('Doc example', () => {
    type Input =
      | string
      | number
      | boolean
      | { key: string }
      | string[]
      | [number, number];

    const notMatch = (value: Input) =>
      match(value)
        .with(P.not(P.string), (value) => `value is NOT a string: ${value}`)
        .with(P.not(P.number), (value) => `value is NOT a number: ${value}`)
        .with(P.not(P.boolean), (value) => `value is NOT a boolean: ${value}`)
        .with(
          P.not({ key: P.string }),
          (value) => `value is NOT an object. ${value}`
        )
        .with(
          P.not(P.array(P.string)),
          (value) => `value is NOT an array of strings: ${value}`
        )
        .with(
          P.not([P.number, P.number]),
          (value) => `value is NOT tuple of two numbers: ${value}`
        )
        .exhaustive();

    const inputs: { input: Input; expected: string }[] = [
      { input: 'Hello', expected: 'value is NOT a number: Hello' },
      { input: 20, expected: 'value is NOT a string: 20' },
      { input: true, expected: 'value is NOT a string: true' },
      {
        input: { key: 'value' },
        expected: 'value is NOT a string: [object Object]',
      },
      {
        input: ['bonjour', 'hola'],
        expected: 'value is NOT a string: bonjour,hola',
      },
      { input: [1, 2], expected: 'value is NOT a string: 1,2' },
    ];

    inputs.forEach(({ input, expected }) =>
      expect(notMatch(input)).toEqual(expected)
    );
  });
});
