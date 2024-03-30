export type CastArray<T> = T | T[];

export type Field<T> = Readonly<{
  zero: () => T;
  one: () => T;
  cano: (a: T) => T;
  eq: (a: T, b: T) => boolean;
  add: (a: T, b: T) => T;
  negate: (a: T) => T;
  mul: (a: T, b: T) => T;
  inverse: (a: T) => T;
}>;
