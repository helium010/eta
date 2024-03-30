import {
  cloneDeep,
  constant,
  initial,
  last,
  max,
  range,
  remove,
  round,
  tail,
  times,
  unary,
  zip,
} from "lodash";
import { assert, combinations } from "../../../utils";

import { ir, pq, rf } from "../../base/algorithms";
import { alPoly, createPolyFieldOverField } from "./common";
import * as Fqx from "./Fqx";
import * as Qx from "./Qx";

export const pz = {
  lc(f: alPoly<bigint>): bigint {
    return last(f)!;
  },
  mono(i: number): alPoly<bigint> {
    const c: bigint[] = times(i, () => 0n);
    c.push(1n);
    return c;
  },
  trim: (f: alPoly<bigint>) => {
    while (f.length > 0 && pz.lc(f) === 0n) f = initial(f);
    return f;
  },
  extend(f: alPoly<bigint>, len: number) {
    while (f.length < len) {
      f = [...f, 0n];
    }
    return f;
  },
  deg: (f: alPoly<bigint>) => {
    return pz.trim(f).length - 1;
  },
  maxNorm: (f: alPoly<bigint>) => {
    return max(f.map(ir.abs))!;
  },
  oneNorm: (f: alPoly<bigint>) => {
    return f.map(ir.abs).reduce((a, b) => a + b, 0n);
  },
  zero() {
    return [];
  },
  one() {
    return [1n];
  },
  cano(a: alPoly<bigint>) {
    return pz.trim(a);
  },
  add(a: alPoly<bigint>, b: alPoly<bigint>) {
    const len = Math.max(a.length, b.length);
    a = pz.extend(a, len);
    b = pz.extend(b, len);
    const c = zip(a, b).map(([x, y]) => x! + y!);
    return pz.trim(c);
  },
  mul(a: alPoly<bigint>, b: alPoly<bigint>) {
    a = pz.cano(a);
    b = pz.cano(b);
    const c: bigint[] = times(a.length + b.length, constant(0n));

    for (const [i, x] of a.entries()) {
      for (const [j, y] of b.entries()) {
        c[i + j] = c[i + j] + x * y;
      }
    }
    return pz.cano(c);
  },
  negate(a: alPoly<bigint>) {
    return pz.mul([-1n], a);
  },
  minus(a: alPoly<bigint>, b: alPoly<bigint>) {
    return pz.add(a, pz.negate(b));
  },
  power(a: alPoly<bigint>, e: number) {
    return times(Number(e), () => cloneDeep(a)).reduce(pz.mul);
  },
  cont(a: alPoly<bigint>): bigint {
    if (a.length === 0) return 1n;
    return a.reduce(ir.gcd);
  },
  pp(a: alPoly<bigint>): alPoly<bigint> {
    const cont = pz.cont(a);
    return a.map((c) => c / cont);
  },
  rem(a: alPoly<bigint>, b: alPoly<bigint>) {
    if (pz.deg(a) < pz.deg(b)) return a;
    const ap = pz.mul([pz.lc(b) ** BigInt(1 + pz.deg(a) - pz.deg(b))], a);
    let r = ap;
    const q: bigint[] = [];
    for (let i = pz.deg(r) - pz.deg(b); i >= 0; i--) {
      if (pz.deg(r) === pz.deg(b) + i) {
        const qi = pz.lc(r) / pz.lc(b);
        q.unshift(qi);
        r = pz.minus(r, [[qi], pz.mono(i), b].reduce(pz.mul));
      } else {
        q.unshift(0n);
      }
    }
    return r;
  },
  div(a: alPoly<bigint>, b: alPoly<bigint>): alPoly<bigint> {
    if (pz.deg(a) < pz.deg(b)) return a;
    const q: bigint[] = [];
    let r = a;
    for (let i = pz.deg(r) - pz.deg(b); i >= 0; i--) {
      if (pz.deg(r) === pz.deg(b) + i) {
        const qi = pz.lc(r) / pz.lc(b);
        assert(ir.mod(pz.lc(r), pz.lc(b)) === 0n);
        q.unshift(qi);
        r = pz.minus(r, [[qi], pz.mono(i), b].reduce(pz.mul));
      } else {
        q.unshift(0n);
      }
    }
    return q;
  },
  /**
   * Derivative of polynomial
   */
  dev(a: alPoly<bigint>) {
    return tail(a.map((c, i) => c * BigInt(i)));
  },
};

/**
 * Factorization in Z[x] (big prime version)
 *
 * Algorithm 14.2 in P436 of MCA
 *
 * @param _f a squarefree primitive polynomial in Z[x] of degree n >= 1
 */
export function factorsfp(_f: alPoly<bigint>): alPoly<bigint>[] {
  const cont = pz.cont(_f);
  assert(cont === 1n);
  const f = pz.cano(pz.pp(_f));

  if (pz.deg(f) <= 1) return [f];

  const n = pz.deg(f);
  let b = pz.lc(f);
  const A = pz.maxNorm(f);
  const B = BigInt(round((n + 1) ** 0.5)) * 2n ** BigInt(n) * A * b;

  let p = 0n;
  let i = 0;
  let fp = Fqx.createFiniteField(p);
  let fpx = createPolyFieldOverField(fp);
  while (true) {
    p = ir.randomPrime(2n * B, 4n * B);
    if (p < 3n) continue;
    fp = Fqx.createFiniteField(p);
    fpx = createPolyFieldOverField(fp);

    const fb = fpx.cano(f);
    const fbp = fpx.cano(pz.dev(fb));

    if (fpx.eq(fpx.gcd(fb, fbp), fpx.one())) {
      break;
    }
  }

  // modular factorization
  let gs = Fqx.factor(p, fpx.cano(f));

  let G: alPoly<bigint>[] = [];
  let fa = f;

  // factor combination
  let s = 0;
  while (2 * (s + 1) <= gs.length) {
    s++;
    for (const indices of combinations(gs.length, s)) {
      const ga = gs
        .map((v) => v[0])
        .filter((_, i) => indices.includes(i))
        .reduce(fpx.mul, fpx.one())
        .map((c) => fp.cano(c * b))
        .map((c) => (c > p / 2n ? c - p : c));

      const ha = gs
        .map((v) => v[0])
        .filter((_, i) => !indices.includes(i))
        .reduce(fpx.mul, fpx.one())
        .map((c) => fp.cano(c * b))
        .map((c) => (c > p / 2n ? c - p : c));

      if (pz.oneNorm(ga) * pz.oneNorm(ha) <= B) {
        gs = gs.filter((_, i) => !indices.includes(i));
        G.push(pz.pp(ga));
        fa = pz.pp(ha);
        b = pz.lc(fa);
        s = 0;
        break;
      }
    }
  }
  G.push(fa);
  return G;
}

export function factor(_f: alPoly<bigint>) {
  let sffactorsOverQ = Qx.ysffactor(_f.map((c) => pq(c)));
  const sffactorOZ: alPoly<bigint>[] = [];

  sffactorsOverQ.slice().forEach((f) => {
    const [cont, pp] = Qx.pfq.contpp(f);
    assert(pp.every((c) => c.q === 1n));
    sffactorOZ.push(pp.map((c) => c.p));
  });

  remove(sffactorOZ, (f) => pz.deg(f) < 1);

  const factors = sffactorOZ.map((f) => factorsfp(f));

  let r = _f;

  factors.forEach((fs, i) => range(i + 1).forEach(() => fs.forEach((f) => (r = pz.div(r, f)))));

  return [r, factors];
}
