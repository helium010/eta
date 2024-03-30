import { first, flow, uniq, uniqWith } from "lodash";
import { Add, invalidArgument, Mul } from "../..";
import { Expr } from "../../types";
import { assert } from "../../utils";
import { C as bC, Cr as bCr } from "../base/edits";
import { cloneExpr } from "../edits";
import { stEq } from "../queries";
import { createExprTrans, createExprTransWithExtraArgs } from "../utils";

const { Te: T0e } = createExprTrans({
  "as multiplication": econ => {
    const { expr } = econ;
    if (expr.type === "Mul") return econ;
    return { ...econ, expr: bCr.Mul(expr) };
  },
  "as addition": econ => {
    const { expr } = econ;
    if (expr.type === "Add") return econ;
    return { ...econ, expr: bCr.Add(expr) };
  },
});

export const { T, Te } = createExprTrans({
  "flatten": econ => {
    const { expr } = econ;
    if (expr.type === "Add") {
      const newSubs: Expr[] = [];
      for (const sub of expr.subs) {
        if (sub.type === "Add") {
          for (const subsub of sub.subs) {
            if (subsub.type === "Add") {
              newSubs.push(...(flow(Te["flatten"], T0e["as addition"])(subsub) as any).subs);
            } else {
              newSubs.push(subsub);
            }
          }
        } else {
          newSubs.push(sub);
        }
      }
      if (newSubs.length === 1) return { ...econ, expr: newSubs[0] };
      return { ...econ, expr: bC.Add(expr.uid, ...newSubs) };
    } else if (expr.type === "Mul") {
      const newSubs: Expr[] = [];
      for (const sub of expr.subs) {
        if (sub.type === "Mul") {
          for (const subsub of sub.subs) {
            if (subsub.type === "Mul") {
              newSubs.push(...(flow(Te["flatten"], T0e["as multiplication"])(subsub) as any).subs);
            } else {
              newSubs.push(subsub);
            }
          }
        } else {
          newSubs.push(sub);
        }
      }
      if (newSubs.length === 1) return { ...econ, expr: newSubs[0] };
      return { ...econ, expr: bC.Mul(expr.uid, ...newSubs) };
    } else {
      invalidArgument();
    }
  },

  "distribute": econ => {
    const { expr } = econ;
    if (expr.type === "Mul") {
      const addIdx = expr.subs.findIndex(i => i.type === "Add");
      assert(addIdx >= 0);
      const left = expr.subs.slice(0, addIdx);
      const mid = expr.subs[addIdx] as Add;
      const right = expr.subs.slice(addIdx + 1);
      const newSubs = mid.subs.map(sub =>
        bCr.Mul(...left.map(cloneExpr), sub, ...right.map(cloneExpr))
      );
      return { ...econ, expr: bC.Add(expr.uid, ...newSubs) };
    } else if (expr.type === "Pow") {
      if (expr.base.type === "Fraction") {
        return {
          ...econ,
          expr: bC.Fraction(
            expr.uid,
            bCr.Pow(expr.base.num, cloneExpr(expr.exp)),
            bCr.Pow(expr.base.den, cloneExpr(expr.exp))
          ),
        };
      } else if (expr.base.type === "Mul") {
        const newSubs = expr.base.subs.map(sub => bCr.Pow(sub, cloneExpr(expr.exp)));
        return { ...econ, expr: bC.Mul(expr.uid, ...newSubs) };
      }
    }
    invalidArgument();
  },
  "combine": econ => {
    const { expr } = econ;
    assert(expr.type === "Add");
    assert(expr.subs.every(sub => sub.type === "Mul"));
    const subs: Mul[] = expr.subs as any;
    let lcf = subs[0].subs;
    let rcf = subs[0].subs;
    subs.forEach(subsub => {
      const newLcf: Expr[] = [];
      for (let i = 0; i < lcf.length && i < subsub.subs.length; i++) {
        if (stEq(lcf[i], subsub.subs[i])) {
          newLcf.push(lcf[i]);
        } else {
          break;
        }
      }
      lcf = newLcf;

      const newRcf: Expr[] = [];
      for (let i = 0; i < rcf.length && i < subsub.subs.length; i++) {
        if (stEq(rcf[rcf.length - 1 - i], subsub.subs[subsub.subs.length - 1 - i])) {
          newRcf.push(rcf[i]);
        } else {
          break;
        }
      }
      rcf = newRcf;
    });
    if (lcf.length > 0) {
      const newSubs = subs.map(sub => {
        const restSubSubs = sub.subs.slice(lcf.length);
        if (restSubSubs.length > 0) {
          return bCr.Mul(...restSubSubs);
        } else {
          return bCr.One();
        }
      });
      return { ...econ, expr: bCr.Mul(bCr.Mul(...lcf), bCr.Add(...newSubs)) };
    } else if (rcf.length > 0) {
      const newSubs = subs.map(sub => {
        const restSubSubs = sub.subs.slice(0, sub.subs.length - rcf.length);
        if (restSubSubs.length > 0) {
          return bCr.Mul(...restSubSubs);
        } else {
          return bCr.One();
        }
      });
      return { ...econ, expr: bCr.Mul(bCr.Add(...newSubs), bCr.Mul(...rcf)) };
    } else {
      invalidArgument();
    }
  },
  "as frac": econ => {
    const { expr } = econ;
    if (expr.type === "Mul") {
      const numSubs: Expr[] = [bCr.One()];
      const denSubs: Expr[] = [bCr.One()];
      expr.subs.forEach(sub => {
        if (sub.type === "Fraction") {
          numSubs.push(sub.num);
          denSubs.push(sub.den);
        } else {
          numSubs.push(sub);
        }
      });
      return { ...econ, expr: bC.Fraction(expr.uid, bCr.Mul(...numSubs), bCr.Mul(...denSubs)) };
    } else {
      invalidArgument();
    }
  },
});

export const { TwE } = createExprTransWithExtraArgs({
  "extract": {
    extraArgCount: -1,
    fn: (econ, ...factors) => {
      const { expr } = econ;
      assert(uniq(factors).length === factors.length);

      assert(expr.type === "Add");
      const newSubs = expr.subs.map(sub => {
        if (sub.type !== "Mul") {
          return bCr.Fraction(sub, cloneExpr(bCr.Mul(...factors)));
        }
        const denSubs: Expr[] = [];
        const numSubs: Expr[] = [...sub.subs];
        factors.forEach(factor => {
          if (numSubs.some(i => stEq(i, factor))) {
            numSubs.splice(
              numSubs.findIndex(i => stEq(i, factor)),
              1
            );
          } else {
            denSubs.push(cloneExpr(factor));
          }
        });
        if (numSubs.length === 0) {
          if (denSubs.length === 0) {
            return bCr.One();
          } else {
            return bCr.Fraction(bCr.One(), bCr.Mul(...denSubs));
          }
        } else {
          if (denSubs.length === 0) {
            return bCr.Mul(...numSubs);
          } else {
            return bCr.Fraction(bCr.Mul(...numSubs), bCr.Mul(...denSubs));
          }
        }
      });
      return {
        ...econ,
        expr: bC.Mul(expr.uid, cloneExpr(bCr.Mul(...factors)), bCr.Add(...newSubs)),
      };
    },
  },
  "split": {
    extraArgCount: -1,
    fn: (econ, ...others) => {
      const { expr } = econ;
      assert(others.length > 1);
      assert(expr.type === "Mul");
      const indices = others.map(o => expr.subs.findIndex(i => i.uid === o.uid));
      indices.sort((a, b) => a - b);
      assert(first(indices)! >= 0);
      for (let [i, j] = [0, indices[0]]; i < indices.length; [i++, j++]) {
        assert(indices[i] === j);
      }
      const leftSubs = expr.subs.slice(0, first(indices)!);
      const midSubs = expr.subs.slice(indices[0], indices[0] + indices.length);
      const rightSubs = expr.subs.slice(indices[0] + indices.length);

      const newSubs: Expr[] = [];
      newSubs.push(...leftSubs);
      const mid = bCr.Mul(...midSubs);
      (mid as any).parenthesis = true;
      newSubs.push(mid);
      newSubs.push(...rightSubs);
      return { ...econ, expr: bC.Mul(expr.uid, ...newSubs) };
    },
  },
  "commute": {
    extraArgCount: 2,
    fn: (econ, a, b) => {
      let { expr } = econ;
      assert(expr.type === "Mul");
      const ai = expr.subs.findIndex(i => i.uid === a.uid);
      const bi = expr.subs.findIndex(i => i.uid === b.uid);
      assert(ai === bi - 1 || ai === bi + 1);
      assert(ai >= 0 && bi >= 0);
      const newSubs = [...expr.subs];
      newSubs[ai] = b;
      newSubs[bi] = a;
      expr = bC.Mul(expr.uid, ...newSubs);
      return { ...econ, expr };
    },
  },
  "to end": {
    extraArgCount: 1,
    fn: (econ, target) => {
      const { expr } = econ;
      assert(expr.type === "Mul");
      const idx = expr.subs.findIndex(i => i.uid === target.uid);
      assert(idx >= 0);
      const subs = [...expr.subs];
      subs.splice(idx, 1);
      subs.push(target);
      return { ...econ, expr: bC.Mul(expr.uid, ...subs) };
    },
  },
});
