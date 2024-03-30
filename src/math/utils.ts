import _, { isEqual, range, rearg, tail } from "lodash";
import JSONBigInt from "json-bigint";
import exp from "constants";
import { ISym } from ".";

const json = JSONBigInt({ alwaysParseAsBig: true, useNativeBigInt: true });

export function error(msg: string): never {
  throw Error(msg);
}

/**
 * Throw an error to indice the code block is not implemented yet.
 */
export function notImplemented(msg?: string): never {
  error(`Not Implemented. ${msg ?? ""}`);
}

export function invalidArgument(msg?: string): never {
  error(`Invaliid argument. ${msg ?? ""}`);
}

/**
 * The code containing this function should never be reached.
 */
export function neverReach(): never {
  error("This code should never be reached.");
}

export function notNil<T>(obj: T): asserts obj is NonNullable<T> {
  if (_.isNil(obj)) {
    error(`Not Non Null.`);
  }
}

export function assertEqual<T>(a: unknown, b: T, message?: string | Error): asserts a is T {
  if (a !== b) {
    error(`Not Equal. ${a} is not equal to ${b}. ${message}`);
  }
}

export function JSONStringify(value: any) {
  return json.stringify(value);
}

export function JSONParse(str: string) {
  return json.parse(str);
}

export function randUID(length = 32) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * Determines whether {@link x} equals to one of {@link X}.
 */
export function oneOf<T, K extends T>(x: T, X: readonly K[]): boolean {
  for (const y of X) {
    if (x === y) return true;
  }
  return false;
}

export function switchOn<X extends string, R>(x: X, map: { [key in X]: R }): R {
  return map[x];
}

export class EqualMap<K, V> {
  private values: [K, V][] = [];

  set(k: K, v: V) {
    const index = this.values.findIndex(([ik]) => isEqual(ik, k));
    if (index !== -1) this.values[index] = [k, v];
    else this.values.push([k, v]);
  }

  get(k: K) {
    if (!this.has(k)) invalidArgument(`Key '${k}' doesn't exist. `);
    return this.values.find(([ik]) => isEqual(k, ik))![1];
  }

  has(k: K) {
    return this.values.some(([ik]) => isEqual(ik, k));
  }

  items(): readonly [Readonly<K>, Readonly<V>][] {
    return this.values;
  }
}

export function count<T>(X: readonly T[], fn: (x: T) => boolean) {
  let i = 0;
  X.forEach((x) => (i += fn(x) ? 1 : 0));
  return i;
}

/**
 * Generate Cartesian product of a series of arrays.
 *
 * `[1,2], [3,4], [5,6,7]` => `[1,3,5], [1,3,6], ... , [2,4,7]`.
 */
export function cartesionProduct<T>(...arrays: T[][]): T[][] {
  if (arrays.length === 0) return [];
  if (arrays.length === 1) return arrays[0].map((x) => [x]);

  return _product(
    arrays[0].map((x) => [x]),
    cartesionProduct(...tail(arrays))
  );

  /**
   * `[[a, b],[c]], [[1], [2,3]]` => `[[a,b,1], [a,b,2,3], [c,1], [c,2,3]]`
   */
  function _product(l: T[][], r: T[][]): T[][] {
    const result: T[][] = [];
    for (const x of l) {
      for (const y of r) {
        result.push([...x, ...y]);
      }
    }
    return result;
  }
}

export function assert(condition: boolean): asserts condition {
  if (!condition) throw Error("assertion failed.");
}

// https://docs.python.org/3/library/itertools.html#itertools.combinations
export function combinations(n: number, r: number) {
  assert(r <= n);
  const indices = range(r);
  const res: number[][] = [];

  res.push(indices.slice());
  while (true) {
    let i = -1;
    for (const j of range(r).reverse()) {
      if (indices[j] !== j + n - r) {
        i = j;
        break;
      }
    }
    if (i === -1) {
      break;
    }
    indices[i] += 1;
    for (const j of range(i + 1, r)) {
      indices[j] = indices[j - 1] + 1;
    }
    res.push(indices.slice());
  }
  return res;
}

export function getIsym(isyms: readonly ISym[], suid: string) {
  return isyms.find((iterIsym) => iterIsym.suid === suid);
}
