import { Pow, Rational } from "../../types";

export interface Integer extends Rational {
  readonly q: 1n;
}

export interface Zero extends Integer {
  readonly p: 0n;
}

export interface One extends Integer {
  readonly p: 1n;
}

export interface NegOne extends Integer {
  readonly p: -1n;
}

export interface Half extends Rational {
  readonly p: 1n;
  readonly q: 2n;
}

export interface Sqrt extends Pow {
  readonly exp: Half;
}

export interface Inverse extends Pow {
  readonly exp: NegOne;
}

export type Rat = {
  p: bigint;
  q: bigint;
};
