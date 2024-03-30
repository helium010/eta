import { first, initial, last, range, tail } from "lodash";
import { Expr, invalidArgument, Matrix, notImplemented } from "../..";
import { assert } from "../../utils";
import { C as bC, Cr as bCr } from "../base/edits";
import { I as bI } from "../base/is";
import { cloneExpr } from "../edits";
import { stEq } from "../queries";
import { createExprTrans, createExprTransWithExtraArgs } from "../utils";
import { editMatTrans } from "./edit";
import { I } from "./is";

export const { T } = createExprTrans({
  "inverse": (econ) => {
    const { expr } = econ;
    assert(expr.type === "Pow" && bI.isNegOne(expr.exp));
    assert(expr.base.type === "Matrix");
    const adjagateMat = editMatTrans.adjugate(expr.base);
    const det = editMatTrans.determinant(expr.base);
    return { ...econ, expr: bC.Mul(expr.uid, bCr.Fraction(bCr.One(), det), adjagateMat) };
  },
  
  "determinant": (econ) => {
    const { expr } = econ;
    assert(expr.type === "SpecialFunction");
    assert(expr.name === "det");
    const mat = expr.var;
    assert(mat.type === "Matrix");
    const det = editMatTrans.determinant(mat);
    return { ...econ, expr: det };
  },
});

export const { TwE } = createExprTransWithExtraArgs({
  "move over equal": {
    extraArgCount: 1,
    fn: (econ, ...others) => {
      const moved = others[0];
      assert(moved.type === "Matrix");
      assert(I.isSquare(moved));
      const { expr } = econ;
      assert(expr.type === "Equal");
      const { left, right } = expr;
      if (stEq(left, moved)) {
        return { ...econ, expr: bC.Equal(expr.uid, bCr.One(), bCr.Mul(bCr.Inverse(moved), right)) };
      } else if (left.type === "Mul" && stEq(first(left.subs)!, moved)) {
        const m = first(left.subs)!;
        const newSubs = tail(left.subs);
        if (newSubs.length === 0) {
          newSubs.push(bCr.One());
        }
        return {
          ...econ,
          expr: bC.Equal(expr.uid, bC.Mul(left.uid, ...newSubs), bCr.Mul(bCr.Inverse(m), right)),
        };
      } else if (left.type === "Mul" && stEq(last(left.subs)!, moved)) {
        const m = last(left.subs)!;
        const newSubs = initial(left.subs);
        if (newSubs.length === 0) {
          newSubs.push(bCr.One());
        }
        return {
          ...econ,
          expr: bC.Equal(expr.uid, bC.Mul(left.uid, ...newSubs), bCr.Mul(right, bCr.Inverse(m))),
        };
      } else if (stEq(right, moved)) {
        return { ...econ, expr: bC.Equal(expr.uid, bCr.Mul(bCr.Inverse(moved), right), bCr.One()) };
      } else if (right.type === "Mul" && stEq(first(right.subs)!, moved)) {
        const m = first(right.subs)!;
        const newSubs = tail(right.subs);
        if (newSubs.length === 0) {
          newSubs.push(bCr.One());
        }
        return {
          ...econ,
          expr: bC.Equal(expr.uid, bCr.Mul(bCr.Inverse(m), left), bC.Mul(right.uid, ...newSubs)),
        };
      } else if (right.type === "Mul" && stEq(last(right.subs)!, moved)) {
        const m = last(right.subs)!;
        const newSubs = initial(right.subs);
        if (newSubs.length === 0) {
          newSubs.push(bCr.One());
        }
        return {
          ...econ,
          expr: bC.Equal(expr.uid, bCr.Mul(left, bCr.Inverse(m)), bC.Mul(right.uid, ...newSubs)),
        };
      } else {
        invalidArgument();
      }
    },
  },
  "multiply": {
    extraArgCount: 2,
    fn: (econ, a, b) => {
      const { expr } = econ;
      assert(expr.type === "Mul");
      const ai = expr.subs.findIndex((i) => stEq(a, i));
      const bi = expr.subs.findIndex((i) => stEq(b, i));
      assert(ai >= 0);
      assert(bi >= 0);

      if (a.type !== "Matrix") {
        assert(b.type === "Matrix");
        return {
          ...econ,
          expr: bCr.Matrix(b.subs.map((row) => row.map((sub) => bCr.Mul(cloneExpr(a), sub)))),
        };
      }

      if (b.type !== "Matrix") {
        assert(a.type === "Matrix");
        return {
          ...econ,
          expr: bCr.Matrix(a.subs.map((row) => row.map((sub) => bCr.Mul(cloneExpr(b), sub)))),
        };
      }

      assert(a.type === "Matrix");
      assert(b.type === "Matrix");
      let left: Matrix;
      let right: Matrix;
      let li: number;
      let ri: number;
      if (ai === bi - 1) {
        left = a;
        li = ai;
        right = b;
        ri = bi;
      } else if (ai === bi + 1) {
        left = b;
        li = bi;
        right = a;
        ri = ai;
      } else {
        invalidArgument();
      }
      const m = left.subs.length;
      const n = left.subs[0].length;
      assert(n === right.subs.length);
      const p = right.subs[0].length;
      const newSubs = range(m).map((i) =>
        range(p).map((j) => {
          const cSubs = range(n).map((k) => cloneExpr(bCr.Mul(left.subs[i][k], right.subs[k][j])));
          return bCr.Add(...cSubs);
        })
      );
      const newMat = bCr.Matrix(newSubs);
      const leftSubs = expr.subs.slice(0, li);
      const rightSubs = expr.subs.slice(ri + 1);
      return { ...econ, expr: bCr.Mul(...leftSubs, newMat, ...rightSubs) };
    },
  },
});
