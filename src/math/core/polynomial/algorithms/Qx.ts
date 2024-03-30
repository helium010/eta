import { tail } from "lodash";
import { pq, rf } from "../../base/algorithms";
import { Rat } from "../../base/types";
import { alPoly, createPolyFieldOverField } from "./common";

export const pfq = {
  ...createPolyFieldOverField(rf),
  /**
   * Derivative of polynomial
   */
  dev(a: alPoly<Rat>) {
    return pfq.cano(tail(a.map((c, i) => rf.mul(c, pq(i)))));
  },

  contpp(a: alPoly<Rat>) {
    const cont = a.reduce(rf.gcd);
    return [cont, a.map((c) => rf.mul(c, rf.inverse(cont)))] as const;
  },
};

/**
 * Yun’s squarefree factorization in characteristic zero.
 *
 * Algorithm 14.21 in P395 of MCA
 */
export function ysffactor(_f: alPoly<Rat>) {
  const lc = pfq.lc(_f);
  const f = pfq.cano(_f.map((c) => rf.mul(c, rf.inverse(lc))));
  const fp = pfq.dev(f);
  const u = pfq.gcd(f, fp);
  let v = pfq.dr(f, u)[0];
  let w = pfq.dr(fp, u)[0];

  const hs: alPoly<Rat>[] = [];
  while (!pfq.eq(v, pfq.one())) {
    const h = pfq.gcd(v, pfq.minus(w, pfq.dev(v)));
    w = pfq.dr(pfq.minus(w, pfq.dev(v)), h)[0];
    v = pfq.dr(v, h)[0];
    hs.push(h);
  }

  return hs;
}
