import { initial, last, tail } from "lodash";
import { Expr, getIsym, ISym, randUID } from "../..";
import { assert } from "../../utils";
import { Cr as bCr, getCoeffOf } from "../base/edits";
import { cloneExpr, replaceSymbolNode } from "../edits";
import { createExprTrans } from "../utils";

export const { T } = createExprTrans({
  "solve": econ => {
    const { expr, isyms } = econ;
    assert(expr.type === "Equal");
    assert(expr.left.type === "Mul");
    const d = last(expr.left.subs)!;
    assert(d.type === "Derivative");
    assert(d.order === 2n);
    const yd = d.func;
    assert(yd.type === "Symbol");
    const y = getIsym(isyms, yd.isym)!;
    assert(y.type === "function");
    const c2 = bCr.Mul(...initial(expr.left.subs));

    assert(expr.right.type === "Mul");
    const yn = last(expr.right.subs)!;
    assert(yn.type === "Symbol");

    assert(y.type === "function");
    assert(yd.isym === yn.isym);
    const c0 = bCr.Mul(bCr.NegOne(), ...initial(expr.right.subs));
    assert(y.vars.length === 1);
    const x = getIsym(isyms, y.vars[0])!;
    assert(x.type === "variable");

    const lambda = bCr.Sqrt(bCr.Mul(bCr.NegOne(), bCr.Fraction(c0, c2)));
    const A: ISym = { type: "generated-constant", name: "C_{1}", suid: randUID() };
    const e1 = bCr.Mul(bCr.Symbol(A), bCr.Pow(bCr.e(), bCr.Mul(cloneExpr(lambda), bCr.Symbol(x))));
    const B: ISym = { type: "generated-constant", name: "C_{2}", suid: randUID() };
    const e2 = bCr.Mul(
      bCr.Symbol(B),
      bCr.Pow(bCr.e(), bCr.Mul(bCr.NegOne(), cloneExpr(lambda), bCr.Symbol(x)))
    );

    const newExpr = bCr.Equal(bCr.Symbol(y), bCr.Add(e1, e2));

    return { expr: newExpr, isyms: [...isyms, A, B] };
  },
  "boundary": econ => {
    const { expr, isyms } = econ;
    assert(expr.type === "Group");
    assert(expr.subs.length === 2);
    const [genSoluEq, condEq] = expr.subs;
    assert(genSoluEq.type === "Equal");
    assert(condEq.type === "Equal");
    const fn = genSoluEq.left;
    assert(fn.type === "Symbol");
    const f = getIsym(isyms, fn.isym)!;
    assert(f.type === "function");
    assert(f.vars.length === 1);
    const x = getIsym(isyms, f.vars[0])!;
    const genSolu = genSoluEq.right;
    const cond = condEq.right;
    assert(cond.type === "Cases");
    assert(cond.subs.length === 2);
    const [lc, rc] = cond.subs;
    assert(lc.cond.type === "Equal");
    assert(rc.cond.type === "Equal");

    const lb = lc.cond.right;
    const rb = rc.cond.right;

    const lbe = cloneExpr(replaceSymbolNode(genSolu, x.suid, () => cloneExpr(lb)));
    const rbe = cloneExpr(replaceSymbolNode(genSolu, x.suid, () => cloneExpr(rb)));
    return {
      expr: {
        type: "Group",
        uid: randUID(),
        subs: [bCr.Equal(lbe, lc.expr), bCr.Equal(rbe, rc.expr)],
      },
      isyms,
    };
  },
  
});
