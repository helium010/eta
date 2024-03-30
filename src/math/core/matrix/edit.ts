import { range } from "lodash";
import { assert, Expr, Matrix } from "../..";
import { Cr as bCr } from "../base/edits";
import { T as bT } from "../base/trans";
import { cloneExpr } from "../edits";
import { validateExprTree } from "../queries";
import { I } from "./is";

export const editMatTrans = {
  transpose: (m: Matrix) => {
    return bCr.Matrix(range(m.subs[0].length).map((i) => m.subs.map((row) => row[i])));
  },
  adjugate: (m: Matrix) => {
    assert(I.isSquare(m));
    const n = m.subs.length;
    const cofactorSubs = range(n).map((i) => range(n).map((j) => editMat.cofactor(m, i, j)));
    return editMatTrans.transpose(bCr.Matrix(cofactorSubs));
  },
  determinant: (m: Matrix): Expr => {
    assert(I.isSquare(m));
    const n = m.subs.length;

    let res: Expr;
    if (n === 1) {
      res = m.subs[0][0];
    } else if (n === 2) {
      const [[a, b], [c, d]] = m.subs;
      res = bCr.Add(bCr.Mul(a, d), bCr.Mul(bCr.NegOne(), b, c));
    } else {
      const terms: Expr[] = [];
      for (const i of range(n)) {
        terms.push(
          bCr.Mul(
            bCr.Integer(BigInt((-1) ** i)),
            m.subs[0][i],
            editMatTrans.determinant(editMat.subMat(m, 0, i))
          )
        );
      }
      res = bCr.Add(...terms);
    }
    return cloneExpr(res);
  },
} as const;

export const editMat = {
  subMat: (m: Matrix, i: number, j: number) => {
    return bCr.Matrix(
      m.subs.filter((_, idx) => idx !== i).map((row) => row.filter((_, idx) => idx !== j))
    );
  },
  cofactor: (m: Matrix, i: number, j: number) => {
    return bCr.Mul(
      bCr.Integer(BigInt((-1) ** (i + j))),
      editMatTrans.determinant(editMat.subMat(m, i, j))
    );
  },
};
