import { range, times } from "lodash";
import { Expr } from "../..";
import { assert } from "../../utils";
import { Cr as bCr, getCoeffOf } from "../base/edits";
import { cloneExpr } from "../edits";
import { createExprTrans, createExprTransWithExtraArgs } from "../utils";

export const { T } = createExprTrans({
  "to group": econ => {
    const { expr } = econ;
    assert(expr.type === "Equal");
    const { left, right } = expr;
    assert(left.type === "Matrix");
    assert(right.type === "Matrix");
    const l = left.subs.length;
    assert(left.subs[0].length === 1);
    assert(right.subs.length === l);
    assert(right.subs[0].length === 1);
    return {
      ...econ,
      expr: bCr.Group(...range(l).map(i => bCr.Equal(left.subs[i][0], right.subs[i][0]))),
    };
  },
});

export const { TwE } = createExprTransWithExtraArgs({
  "to matrix": {
    extraArgCount: -1,
    fn: (econ, ...vecElems) => {
      const { expr } = econ;
      const n = vecElems.length;
      assert(expr.type === "Group");
      assert(n === expr.subs.length);

      const coeffMatSubs: Expr[][] = [];
      const rightMatSubs: Expr[][] = [];
      for (const eq of expr.subs) {
        assert(eq.type === "Equal");
        const { left, right } = eq;
        assert(left.type === "Add");
        let coeffs: readonly Expr[] = times(n, () => bCr.Zero());
        for (const term of left.subs) {
          const coeffsInTerm = vecElems.map(i => cloneExpr(getCoeffOf(term, i)));
          coeffs = coeffs.map((c, i) => bCr.Add(c, coeffsInTerm[i]));
        }
        coeffMatSubs.push([...coeffs]);
        rightMatSubs.push([right]);
      }

      const vecSubs = vecElems.map(i => [cloneExpr(i)]);

      return {
        ...econ,
        expr: bCr.Equal(
          bCr.Mul(bCr.Matrix(coeffMatSubs), bCr.Matrix(vecSubs)),
          bCr.Matrix(rightMatSubs)
        ),
      };
    },
  },
});
