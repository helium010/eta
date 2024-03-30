import { fromPairs, isUndefined, toPairs } from "lodash";
import { invalidArgument, randUID } from "../utils";
import { stEq } from "./queries";
import { Econ, Expr } from "../types";

export function createExprCreators<
  CT extends {
    [name: string]: (uid: string, ...args: any[]) => Expr;
  }
>(C: CT) {
  type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R
    ? (...args: P) => R
    : never;
  type CrT = {
    [K in keyof CT]: OmitFirstArg<CT[K]>;
  };

  const Cr = fromPairs(
    toPairs(C).map(([k, v]) => [k, (...args: any[]) => (v as any)(randUID(), ...args)])
  ) as CrT;
  return { C, Cr };
}

export function createExprIs<
  IT extends {
    [name: string]: (expr: Expr) => boolean;
  }
>(I: IT): IT {
  return I;
}

export function createExprTrans<
  TT extends {
    [name: string]: (ewis: Econ) => Econ;
  }
>(T: TT) {
  const Tt = fromPairs(
    toPairs(T).map(([k, v]) => [
      k,
      (expr: any) => {
        try {
          return v(expr);
        } catch (error) {
          return expr;
        }
      },
    ])
  ) as TT;
  const Te = fromPairs(
    toPairs(T).map(([k, v]) => [
      k,
      (expr: Expr): Expr => {
        return v({ expr, isyms: [] }).expr;
      },
    ])
  ) as Record<keyof TT, (expr: Expr) => Expr>;

  const Tet = fromPairs(
    toPairs(T).map(([k, v]) => [
      k,
      (expr: Expr): Expr => {
        try {
          return v({ expr, isyms: [] }).expr;
        } catch (error) {
          return expr;
        }
      },
    ])
  ) as Record<keyof TT, (expr: Expr) => Expr>;

  return { T, Tt, Te, Tet };
}

export function createExprTransWithExtraArgs<
  TT extends {
    [name: string]: { fn: (econ: Econ, ...others: Expr[]) => Econ; extraArgCount: number };
  }
>(TwE: TT) {
  return { TwE };
}

export class StEqMap<K extends Expr, V> {
  private values: [K, V][] = [];

  set(k: K, v: V) {
    const index = this.values.findIndex(([ik]) => stEq(ik, k));
    if (index !== -1) this.values[index] = [k, v];
    else this.values.push([k, v]);
  }

  get(k: K, defaultValue: V | undefined = undefined) {
    if (!this.has(k)) {
      if (isUndefined(defaultValue)) {
        invalidArgument(`Key '${k}' doesn't exist. `);
      } else {
        return defaultValue;
      }
    }
    return this.values.find(([ik]) => stEq(k, ik))![1];
  }

  has(k: K) {
    return this.values.some(([ik]) => stEq(ik, k));
  }

  items(): readonly [Readonly<K>, Readonly<V>][] {
    return this.values;
  }
}
