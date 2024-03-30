import { assert } from "../../utils";
import { pq, rf } from "../base/algorithms";
import { createExprTrans } from "../utils";
import { C as bC, Cr as bCr } from "../base/edits";
import { cloneExpr } from "../edits";
import { stEq } from "../queries";

export const { T } = createExprTrans({
  "to mul": econ => {
    const { expr } = econ;
    assert(expr.type === "Pow" && expr.exp.type === "Rational" && rf.eq(expr.exp, pq(2)));
    assert(expr.base.type === "Norm");
    const sub = expr.base.sub;
    return {
      ...econ,
      expr: bC.Mul(expr.uid, bCr.ComplexConjugate(cloneExpr(sub)), cloneExpr(sub)),
    };
  },
  "to square": econ => {
    const { expr } = econ;
    assert(expr.type === "Mul");
    assert(expr.subs.length === 2);
    const [left, right] = expr.subs;
    assert(left.type === "ComplexConjugate");
    const sub = left.sub;
    assert(stEq(sub, right));
    return { ...econ, expr: bC.Pow(expr.uid, bCr.Norm(sub), bCr.Integer(2n)) };
  },
});
