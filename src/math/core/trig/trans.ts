import { tail } from "lodash";
import { assert } from "../../utils";
import { createExprTrans } from "../utils";
import { Cr as bCr, C as bC } from "../base/edits";
import { I as bI } from "../base/is";
import { cloneExpr } from "../edits";
import { invalidArgument, ISym, randUID } from "../..";
import { rf } from "../base/algorithms";

const sf = bCr.SpecialFunction;

export const { T } = createExprTrans({
  euler: econ => {
    const { expr } = econ;
    assert(expr.type === "Pow");
    assert(expr.base.type === "SpecialConstant" && expr.base.name === "e");
    assert(expr.exp.type === "Mul");
    const leftMost = expr.exp.subs[0];

    if (leftMost.type === "SpecialConstant" && leftMost.name === "i") {
      assert(expr.exp.subs.length > 1);
      const rest = bCr.Mul(...tail(expr.exp.subs));
      return {
        ...econ,
        expr: bCr.Add(sf("cos", cloneExpr(rest)), bCr.Mul(leftMost, sf("sin", cloneExpr(rest)))),
      };
    } else if (bI.isNegOne(leftMost)) {
      assert(expr.exp.subs.length > 2);
      const i = expr.exp.subs[1];
      assert(i.type === "SpecialConstant" && i.name === "i");
      const rest = bCr.Mul(...expr.exp.subs.slice(2));
      return {
        ...econ,
        expr: bCr.Add(
          sf("cos", cloneExpr(rest)),
          bCr.Mul(bCr.NegOne(), i, sf("sin", cloneExpr(rest)))
        ),
      };
    } else {
      invalidArgument();
    }
  },
  sign: econ => {
    const { expr } = econ;
    assert(expr.type === "SpecialFunction");
    const v = expr.var;
    assert(v.type === "Mul");
    assert(bI.isNegOne(v.subs[0]));
    const rest = bCr.Mul(...tail(v.subs));
    if (expr.name === "sin") {
      return { ...econ, expr: bCr.Mul(bCr.NegOne(), bCr.SpecialFunction("sin", rest)) };
    } else if (expr.name === "cos") {
      return { ...econ, expr: bCr.SpecialFunction("cos", rest) };
    } else {
      invalidArgument();
    }
  },
  eval: econ => {
    const { expr, isyms } = econ;
    assert(expr.type === "SpecialFunction");
    const func = expr.name;
    const v = expr.var;
    assert(v.type === "Rational");
    if (func === "sin") {
      if (rf.eq(v, rf.zero())) {
        return { ...econ, expr: bC.Zero(expr.uid) };
      }
    } else if (func === "arcsin") {
      if (rf.eq(v, rf.zero())) {
        const n: ISym = { type: "context", suid: randUID(), name: "n" };
        return {
          ...econ,
          isyms: [...isyms, n],
          expr: {
            type: "InfiniteSequence",
            uid: expr.uid,
            index: n.suid,
            elem: bCr.Mul(bCr.Symbol(n), bCr.pi()),
          },
        };
      }
    }
    invalidArgument();
  },
});
