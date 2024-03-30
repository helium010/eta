import { cloneDeep, initial, isUndefined, last, List, random, times, zip } from "lodash";
import { ir, repeatSquare } from "../../base/algorithms";
import { Field } from "../../types";
import { alPoly, createPolyFieldOverField } from "./common";

export function rem(n: bigint, m: bigint) {
  return ((n % m) + m) % m;
}

/**
 * @param q a prime number.
 */
export function createFiniteField(q: bigint): Field<bigint> {
  return { cano, add, mul, zero, one, eq, inverse, negate };
  function zero() {
    return 0n;
  }
  function one() {
    return 1n;
  }

  function negate(a: bigint) {
    return cano(-a);
  }

  function inverse(a: bigint) {
    return ir.rsm(q, a, q - 2n);
  }

  function cano(a: bigint) {
    return rem(a, q);
  }
  function eq(a: bigint, b: bigint) {
    return cano(a) === cano(b);
  }
  function add(a: bigint, b: bigint) {
    return cano(a + b);
  }
  function mul(a: bigint, b: bigint) {
    return cano(a * b);
  }
}

/**
 * Distinct-degree factorization
 *
 * Algorithm 14.3 in P381 of MCA
 */
export function ddfactor(q: bigint, _f: alPoly<bigint>) {
  const cf = createFiniteField(q);
  const pf = createPolyFieldOverField(cf);

  _f = pf.cano(_f);
  let h = pf.mono(1);
  let f = _f;

  const g: alPoly<bigint>[] = [];

  while (!pf.eq(f, pf.one())) {
    const hq = times(Number(q), () => cloneDeep(h)).reduce(pf.mul);
    h = pf.dr(hq, _f)[1];
    g.push(pf.gcd(pf.add(h, pf.mul([cf.negate(cf.one())], pf.mono(1))), f));
    f = pf.dr(f, last(g)!)[0];
  }
  return g;
}

/**
 * Equal-degree splitting
 *
 * Algorithm 14.8 in P385 of MCA
 */
export function edsplit(q: bigint, d: number, _f: alPoly<bigint>) {
  const cf = createFiniteField(q);
  const pf = createPolyFieldOverField(cf);

  const f = pf.cano(_f);

  const n = pf.deg(f);

  const a = pf.cano(times(n, () => BigInt(random(Number(q - 1n)))));
  if (a.length < 2) return undefined;

  const g1 = pf.gcd(a, f);
  if (!pf.eq(g1, pf.one())) return g1;

  const e = Number((q ** BigInt(d) - 1n) / 2n);

  const b = repeatSquare(a, BigInt(e), (a, b) => pf.dr(pf.mul(a, b), f)[1]);

  const g2 = pf.gcd(pf.minus(b, pf.one()), f);
  if (!pf.eq(g2, pf.one()) && !pf.eq(g2, f)) return g2;
  return undefined;
}

/**
 * Equal-degree factorization
 *
 * Algorithm 14.10 in p387 of MCA
 */
export function edfactor(q: bigint, d: number, _f: alPoly<bigint>): alPoly<bigint>[] {
  const cf = createFiniteField(q);
  const pf = createPolyFieldOverField(cf);

  const f = pf.cano(_f);

  const n = pf.deg(f);

  if (n === d) return [f];

  let g;
  while (isUndefined((g = edsplit(q, d, f)))) {}

  const fg = pf.dr(f, g)[0];
  return [...edfactor(q, d, g), ...edfactor(q, d, fg)];
}

/**
 * Polynomial factorization over finite fields
 *
 * Algorithm 14.13 in P389 of MCA
 */
export function factor(q: bigint, _f: alPoly<bigint>) {
  const cf = createFiniteField(q);
  const pf = createPolyFieldOverField(cf);
  const f = pf.cano(_f);

  let h = pf.mono(1);
  let v = pf.normal(f);
  let i = 0;
  let U: [alPoly<bigint>, number][] = [];

  while (!pf.eq(v, pf.one())) {
    i++;

    // one distinct-degree factorization step
    h = repeatSquare(h, q, (a, b) => pf.dr(pf.mul(a, b), f)[1]);
    const g = pf.gcd(pf.minus(h, pf.mono(1)), v);

    if (!pf.eq(g, pf.one())) {
      // equal-degree factorization
      const gs = edfactor(q, i, g);

      // determine multiplicities
      for (const gj of gs) {
        let e = 0;

        while (pf.eq(pf.dr(v, gj)[1], pf.zero())) {
          v = pf.dr(v, gj)[0];
          e += 1;
          if (!U.some(([ig, ie]) => pf.eq(ig, gj) && ie === e)) {
            U.push([gj, e]);
          }
        }
      }
    }
  }
  return U;
}
