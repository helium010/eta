import { cloneDeep, initial, last, List, tail, times, zip } from "lodash";
import { Field } from "../../types";

export type alPoly<C> = readonly C[];

export function createPolyFieldOverField<T>(cf: Field<T>) {
  return { add, cano, mul, zero, one, mono, eq, dr, gcd, negate, minus, normal, deg, lc };

  function eq(a: alPoly<T>, b: alPoly<T>) {
    [a, b] = [a, b].map(cano);
    if (deg(a) !== deg(b)) return false;
    for (const [x, y] of zip(a, b)) {
      if (!cf.eq(x!, y!)) return false;
    }
    return true;
  }

  function mono(i: number): alPoly<T> {
    const c: T[] = times(i, cf.zero);
    c.push(cf.one());
    return c;
  }

  function lc(f: alPoly<T>): T {
    return last(f)!;
  }

  function trim(f: alPoly<T>) {
    while (f.length > 0 && cf.eq(lc(f), cf.zero())) f = initial(f);
    return f;
  }
  function extend(f: alPoly<T>, len: number) {
    while (f.length < len) {
      f = [...f, cf.zero()];
    }
    return f;
  }
  function deg(f: alPoly<T>) {
    return trim(f).length - 1;
  }

  function zero() {
    return [];
  }

  function one() {
    return [cf.one()];
  }

  function cano(a: alPoly<T>) {
    return trim(a.map(cf.cano));
  }

  function add(a: alPoly<T>, b: alPoly<T>) {
    const len = Math.max(a.length, b.length);
    a = extend(a, len);
    b = extend(b, len);
    const c = zip(a, b).map(([x, y]) => cf.add(x!, y!));
    return trim(c);
  }

  function mul(a: alPoly<T>, b: alPoly<T>) {
    a = cano(a);
    b = cano(b);
    const c: T[] = times(a.length + b.length, cf.zero);

    for (const [i, x] of a.entries()) {
      for (const [j, y] of b.entries()) {
        c[i + j] = cf.add(c[i + j], cf.mul(x, y));
      }
    }
    return cano(c);
  }

  function negate(a: alPoly<T>) {
    return mul([cf.negate(cf.one())], a);
  }

  function minus(a: alPoly<T>, b: alPoly<T>) {
    return add(a, negate(b));
  }

  /**
   * Polynomial division with remainder
   *
   * Algorithm 2.5 in P38 of MCA
   */
  function dr(a: alPoly<T>, b: alPoly<T>): [alPoly<T>, alPoly<T>] {
    let r = a;
    let u = cf.inverse(lc(b));
    const q: T[] = [];
    for (let i = deg(a) - deg(b); i >= 0; i--) {
      if (deg(r) === deg(b) + i) {
        const qi = cf.mul(lc(r), u);
        q.unshift(qi);
        r = add(r, [[cf.negate(cf.one())], [qi], mono(i), b].reduce(mul));
      } else {
        q.unshift(cf.zero());
      }
    }
    return [q, r];
  }

  function normal(f: alPoly<T>): alPoly<T> {
    const d = cf.inverse(lc(f));
    return f.map((c) => cf.mul(c, d));
  }

  /**
   * Traditional Euclidean Algorithm.
   *
   * Algorithm 3.5 in P47 of MCA
   */
  function gcd(a: alPoly<T>, b: alPoly<T>): alPoly<T> {
    const r = [a, b];
    while (!eq(r[1], zero())) {
      r.push(dr(r[0], r[1])[1]);
      r.shift();
    }
    return normal(r[0]);
  }
}
