import { identity, isEqual, random, range, tail } from "lodash";
import { assert, invalidArgument } from "../../utils";
import { Field } from "../types";
import { Rat } from "./types";

/**
 * Integer
 */
export const ir = {
  mod(n: bigint, m: bigint) {
    return ((n % m) + m) % m;
  },

  abs(n: bigint) {
    if (n < 0n) return -n;
    return n;
  },

  gcd(a: bigint, b: bigint): bigint {
    if (b === 0n) return a;
    return ir.gcd(b, ir.mod(a, b));
  },

  lcm(...args: bigint[]): bigint {
    if (args.length < 2) invalidArgument();
    if (args.includes(0n)) return 0n;
    let a = args[0];
    for (const b of args.slice(1)) {
      a = (a / ir.gcd(a, b)) * b;
    }
    return a;
  },

  /**
   * Repeated squaring with modulo.
   *
   * Algorithm 4.8 in P75 of MCA
   */
  rsm(q: bigint, a: bigint, n: bigint) {
    let b = a;
    const nis: bigint[] = [];
    while (n > 0n) {
      nis.push(ir.mod(n, 2n));
      n = n / 2n;
    }
    nis.pop();
    while (nis.length > 0) {
      const ni = nis.pop();
      if (ni === 1n) {
        b = b ** 2n * a;
      } else {
        b = b ** 2n;
      }
      b = ir.mod(b, q);
    }
    return b;
  },

  /**
   * Strong pseudoprimality test
   *
   * Algorithm 18.5 in P521 of MCA
   */
  spt(N: bigint, repeat: number = 100) {
    while (repeat > 0) {
      if (!_spt(N)) return false;
      repeat--;
    }
    return true;

    function _spt(N: bigint) {
      N = ir.abs(N);
      if (N < 2n) return false;
      if (N == 2n) return true;
      if (ir.mod(N, 2n) === 0n) return false;

      const a = ir.random(2n, N - 2n);
      const d = ir.gcd(a, N);
      if (d > 1n) return false;
      let m = N - 1n;
      let v = 0n;
      while (ir.mod(m, 2n) === 0n) {
        m = m / 2n;
        v++;
      }
      let b = ir.rsm(N, a, m);
      if (b === 1n) return true;
      for (; v > 0; v--) {
        const prev = b;
        b = ir.mod(b ** 2n, N);
        if (b === 1n) {
          const g = ir.gcd(prev + 1n, N);
          if (g === 1n || g === N) return true;
          return false;
        }
      }
      return false;
    }
  },

  random(from: bigint, to: bigint): bigint {
    assert(0 <= from);
    assert(from < to);
    const bitLen = ir.bitLength(to);
    while (true) {
      let result = 0n;
      let i = bitLen;
      while (i > 0) {
        i--;
        result *= 2n;
        result += BigInt(random(0, 1));
      }
      if (from <= result && result <= to) {
        return result;
      }
    }
  },

  randomPrime(from: bigint, to: bigint): bigint {
    while (true) {
      const p = ir.random(from, to);
      if (ir.spt(p)) return p;
    }
  },

  bitLength(n: bigint) {
    n = ir.abs(n);
    let i = 0;
    while (n > 0) {
      i++;
      n = n / 2n;
    }
    return i;
  },
};

export function pq(p: bigint | number, q?: bigint | number): Rat {
  return { p: BigInt(p), q: BigInt(q ?? 1) };
}

export const rf = {
  zero: () => pq(0),
  one: () => pq(1),
  cano: ({ p, q }: Rat): Rat => {
    const g = ir.gcd(p, q);
    p = p / g;
    q = q / g;
    if (q < 0n) {
      p = -p;
      q = -q;
    }
    if (p === 0n) q = 1n;
    return { p, q };
  },
  eq: (a: Rat, b: Rat): boolean => {
    return isEqual(rf.cano(a), rf.cano(b));
  },
  add: (a: Rat, b: Rat): Rat => {
    return rf.cano(pq(a.p * b.q + b.p * a.q, a.q * b.q));
  },
  mul: (a: Rat, b: Rat): Rat => {
    return rf.cano(pq(a.p * b.p, a.q * b.q));
  },
  negate: (a: Rat): Rat => {
    return rf.cano(pq(-a.p, a.q));
  },
  inverse: (a: Rat): Rat => {
    return rf.cano(pq(a.q, a.p));
  },
  gcd(a: Rat, b: Rat) {
    return rf.cano(pq(ir.gcd(a.p * b.q, b.p * a.q), a.q * b.q));
  },
};

/**
 * Repeated squaring
 *
 * Algorithm 4.8 in P75 of MCA
 */
export function repeatSquare<T>(a: T, n: bigint, mul: (a: T, b: T) => T) {
  let b = a;
  const nis: bigint[] = [];
  while (n > 0n) {
    nis.push(ir.mod(n, 2n));
    n = n / 2n;
  }
  nis.pop();
  while (nis.length > 0) {
    const ni = nis.pop();
    if (ni === 1n) {
      b = mul(mul(b, b), a);
    } else {
      b = mul(b, b);
    }
  }
  return b;
}
