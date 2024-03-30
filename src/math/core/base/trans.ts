import { first, flow, isNil, last, range, rest, tail } from "lodash";
import {
  Add,
  cloneExpr,
  Econ,
  getIsym,
  invalidArgument,
  ISym,
  notImplemented,
  randUID,
  Rational,
  replaceExprNode,
  replaceSymbolNode,
} from "../..";
import { Expr } from "../../types";
import { assert } from "../../utils";
import { findSameNodes, stEq } from "../queries";
import { createExprTrans, createExprTransWithExtraArgs } from "../utils";
import { rf } from "./algorithms";
import { C, Cr } from "./edits";
import { I } from "./is";
import { Rat } from "./types";
import { I as iI } from "../infer/is";
import { Te as aamTe } from "../arith/trans";

const { Te, Tet, Tt } = createExprTrans({
  "reduce rational number": econ => {
    const { expr } = econ;
    assert(I.isRational(expr));
    const pq = rf.cano(expr);
    return { ...econ, expr: C.Rational(expr.uid, pq.p, pq.q) };
  },
  "reduce rational numbers in multiplication": econ => {
    const { expr } = econ;
    assert(expr.type === "Mul");
    const newSubs: Expr[] = [];
    let pq: Rat = { p: 1n, q: 1n };
    for (const sub of expr.subs) {
      if (sub.type === "Rational") {
        pq = rf.mul(pq, sub);
      } else {
        newSubs.push(sub);
      }
    }
    if (newSubs.length === 0) return { ...econ, expr: C.Rational(expr.uid, pq.p, pq.q) };
    if (!rf.eq(pq, { p: 1n, q: 1n })) {
      newSubs.unshift(Cr.Rational(pq.p, pq.q));
    }
    if (newSubs.length === 0) return { ...econ, expr: C.One(expr.uid) };
    if (newSubs.length === 1) return { ...econ, expr: newSubs[0] };
    return { ...econ, expr: C.Mul(expr.uid, ...newSubs) };
  },
  "reduce rational numbers in addition": econ => {
    const { expr } = econ;

    assert(expr.type === "Add");
    const newSubs: Expr[] = [];
    let pq: Rat = { p: 0n, q: 1n };
    for (const sub of expr.subs) {
      if (sub.type === "Rational") {
        pq = rf.add(pq, sub);
      } else {
        newSubs.push(sub);
      }
    }
    if (newSubs.length === 0) return { ...econ, expr: C.Rational(expr.uid, pq.p, pq.q) };
    if (!rf.eq(pq, { p: 0n, q: 1n })) {
      newSubs.unshift(Cr.Rational(pq.p, pq.q));
    }
    if (newSubs.length === 0) return { ...econ, expr: C.Zero(expr.uid) };
    if (newSubs.length === 1) return { ...econ, expr: newSubs[0] };
    return { ...econ, expr: C.Add(expr.uid, ...newSubs) };
  },
  "reduce same terms in addition": econ => {
    const { expr } = econ;
    assert(expr.type === "Add");

    const subAndCoeffs: [Expr, Rat][] = expr.subs.map(sub => {
      if (sub.type === "Mul" && sub.subs[0].type === "Rational") {
        let rest: Expr = Cr.Mul(...tail(sub.subs));

        if (rest.subs.length === 0) {
          rest = Cr.One();
        } else if (rest.subs.length === 1) {
          rest = rest.subs[0];
        }

        return [rest, sub.subs[0]];
      } else {
        return [sub, rf.one()];
      }
    });
    const uniqSubAndCoeffs: [Expr, Rat][] = [];
    subAndCoeffs.forEach(([sub, coeff]) => {
      const idx = uniqSubAndCoeffs.findIndex(i => stEq(i[0], sub));
      if (idx >= 0) {
        const [, prevCoeff] = uniqSubAndCoeffs[idx];
        uniqSubAndCoeffs[idx] = [sub, rf.add(prevCoeff, coeff)];
      } else {
        uniqSubAndCoeffs.push([sub, coeff]);
      }
    });
    const newSubs = uniqSubAndCoeffs.map(([sub, coeff]) => {
      if (rf.eq(coeff, rf.one())) {
        return sub;
      } else {
        const newSubs: Expr[] = [Cr.Rational(coeff.p, coeff.q)];
        if (sub.type === "Mul") {
          newSubs.push(...sub.subs);
        } else {
          newSubs.push(sub);
        }
        return Cr.Mul(...newSubs);
      }
    });
    return { ...econ, expr: C.Add(expr.uid, ...newSubs) };
  },
  "reduce one under fraction": econ => {
    const { expr } = econ;
    assert(expr.type === "Fraction");
    if (I.isOne(expr.den)) {
      return { ...econ, expr: expr.num };
    } else if (I.isNegOne(expr.den)) {
      return { ...econ, expr: Cr.Mul(Cr.NegOne(), expr.num) };
    } else {
      invalidArgument();
    }
  },
  "reduce rationals in fraction": econ => {
    const { expr } = econ;
    assert(expr.type === "Fraction");
    if (I.isZero(expr.num)) {
      return { ...econ, expr: Cr.Zero() };
    }
    assert(expr.num.type === "Rational");
    assert(expr.den.type === "Rational");
    assert(!I.isZero(expr.den));
    const v = rf.mul(expr.num, rf.inverse(expr.den));
    return { ...econ, expr: C.Rational(expr.uid, v.p, v.q) };
  },
  "flatten fraction": (econ): Econ => {
    const { expr } = econ;

    assert(expr.type === "Fraction");
    let { num, den } = expr;
    const newNumFactors: Expr[] = [];
    const newDenFactors: Expr[] = [];

    if (num.type === "Fraction") {
      num = Te["flatten fraction"](num);
    }
    if (den.type === "Fraction") {
      den = Te["flatten fraction"](den);
    }

    if (num.type === "Fraction") {
      newNumFactors.push(num.num);
      newDenFactors.push(num.den);
    } else {
      newNumFactors.push(num);
    }
    if (den.type === "Fraction") {
      newNumFactors.push(den.den);
      newDenFactors.push(den.num);
    } else {
      newDenFactors.push(den);
    }

    let newNum: Expr = Cr.Mul(...newNumFactors);
    let newDem: Expr = Cr.Mul(...newDenFactors);

    newNum = Te["reduce rational numbers in multiplication"](newNum);
    newDem = Te["reduce rational numbers in multiplication"](newDem);
    if (
      newNum.type === "Mul" &&
      newNum.subs[0].type === "Rational" &&
      newDem.type === "Mul" &&
      newDem.subs[0].type === "Rational"
    ) {
      const nc = newNum.subs[0];
      const dc = newDem.subs[0];
      const c = rf.mul(nc, dc);
      const newNumFactors: Expr[] = [];
      newNumFactors.push(...tail(newNum.subs));
      if (!rf.eq(c, rf.one()) || newNumFactors.length === 0) {
        newNumFactors.push(Cr.Rational(c.p, c.q));
      }
      newNum = C.Mul(newNum.uid, ...newNumFactors);
      newDem = C.Mul(newDem.uid, ...tail(newDem.subs));
    }

    return { ...econ, expr: C.Fraction(expr.uid, newNum, newDem) };
  },
  "extract negative one under sqrt": (econ): Econ => {
    let { expr, isyms } = econ;
    assert(expr.type === "Pow" && I.isHalf(expr.exp));
    const { base } = expr;
    assert(base.type === "Rational" || base.type === "Mul");

    if (base.type === "Rational") {
      assert(base.p * base.q < 0n);
      return { expr: Cr.Mul(Cr.i(), Cr.Sqrt(Cr.Rational(-base.p, base.q))), isyms };
    } else {
      const c = base.subs[0];
      assert(c.type === "Rational");
      assert(c.p * c.q < 0n);
      assert(tail(base.subs).every(sub => iI["non-negative"]({ expr: sub, isyms })));
      return {
        expr: Cr.Mul(Cr.i(), Cr.Sqrt(Cr.Mul(Cr.Rational(-c.p, c.q), ...tail(base.subs)))),
        isyms,
      };
    }
  },
  "process zeros in multiplication": econ => {
    const { expr } = econ;
    assert(expr.type === "Mul");
    assert(expr.subs.some(I.isZero));
    return { ...econ, expr: Cr.Zero() };
  },
  "process zero exp of pow": econ => {
    const { expr } = econ;
    assert(expr.type === "Pow");
    assert(I.isZero(expr.exp));
    return { ...econ, expr: C.One(expr.uid) };
  },
  "flip rational numbers and fraction under inverse": econ => {
    const { expr } = econ;
    assert(I.isInverse(expr));
    const { base } = expr;
    if (base.type === "Rational") {
      return { ...econ, expr: C.Rational(expr.uid, base.q, base.p) };
    } else if (base.type === "Fraction") {
      return { ...econ, expr: C.Fraction(expr.uid, base.den, base.num) };
    } else {
      invalidArgument();
    }
  },
  "combine consecutive pow": econ => {
    const { expr } = econ;
    assert(expr.type === "Mul");
    let prevBase: Expr | null = null;
    let prevExpTerms: Expr[] = [];
    const newSubs: Expr[] = [];
    for (const sub of expr.subs) {
      if (sub.type !== "Pow") {
        if (!isNil(prevBase)) {
          addBaseAndFactorToNewSub();
        }
        newSubs.push(sub);
      } else {
        if (isNil(prevBase)) {
          prevBase = sub.base;
          prevExpTerms = [sub.exp];
        } else if (stEq(prevBase, sub.base)) {
          prevExpTerms.push(sub.exp);
        } else {
          addBaseAndFactorToNewSub();
          prevBase = sub.base;
          prevExpTerms = [sub.exp];
        }
      }
    }
    if (!isNil(prevBase)) {
      addBaseAndFactorToNewSub();
    }
    function addBaseAndFactorToNewSub() {
      if (prevExpTerms.length > 1) {
        newSubs.push(Cr.Pow(prevBase!, Cr.Add(...prevExpTerms)));
      } else {
        newSubs.push(Cr.Pow(prevBase!, prevExpTerms[0]));
      }
      prevBase = null;
      prevExpTerms = [];
    }
    return { ...econ, expr: C.Mul(expr.uid, ...newSubs) };
  },
});

function simplifyOnce(econ: Econ): Econ {
  const { expr, isyms } = econ;

  return { ...econ, expr: reduce(expr) };

  function reduce(node: Expr): Expr {
    switch (node.type) {
      case "Mul": {
        node = C.Mul(node.uid, ...node.subs.map(reduce));
        node = aamTe["flatten"](node);
        node = Tet["reduce rational numbers in multiplication"](node);
        node = Tet["process zeros in multiplication"](node);
        node = Tet["combine consecutive pow"](node);
        return node;
      }
      case "Add": {
        node = C.Add(node.uid, ...node.subs.map(reduce));
        node = aamTe["flatten"](node);
        node = Tet["reduce rational numbers in addition"](node);
        node = Tet["reduce same terms in addition"](node);
        return node;
      }
      case "Fraction": {
        const num = reduce(node.num);
        const dem = reduce(node.den);
        node = C.Fraction(node.uid, num, dem);
        node = Te["flatten fraction"](node);
        node = Tet["reduce one under fraction"](node);
        node = Tet["reduce rationals in fraction"](node);
        return node;
      }
      case "Rational": {
        return Te["reduce rational number"](node);
      }
      case "Pow": {
        node = Tt["extract negative one under sqrt"]({ ...econ, expr: node }).expr;
        node = Tet["process zero exp of pow"](node);
        node = Tet["flip rational numbers and fraction under inverse"](node);

        if (node.type !== "Pow") return node;
        const base = reduce(node.base);
        const exp = reduce(node.exp);
        return C.Pow(node.uid, base, exp);
      }
      case "Equal": {
        const left = reduce(node.left);
        const right = reduce(node.right);
        return C.Equal(node.uid, left, right);
      }
      case "Group": {
        return C.Group(node.uid, ...node.subs.map(reduce));
      }
      case "Cases": {
        return {
          type: "Cases",
          uid: node.uid,
          subs: node.subs.map(({ expr, cond }) => ({ expr: reduce(expr), cond: reduce(cond) })),
        };
      }
      case "Matrix": {
        return {
          type: "Matrix",
          uid: node.uid,
          subs: node.subs.map(row => row.map(reduce)),
        };
      }
      case "SpecialFunction": {
        return {
          type: "SpecialFunction",
          name: node.name,
          uid: node.uid,
          var: reduce(node.var),
        };
      }
      case "Derivative": {
        return {
          type: "Derivative",
          uid: node.uid,
          func: reduce(node.func),
          indep: reduce(node.indep),
          order: node.order,
        };
      }
      case "InfiniteSequence": {
        return {
          type: "InfiniteSequence",
          uid: node.uid,
          elem: reduce(node.elem),
          index: node.index,
        };
      }
      case "Compare": {
        return {
          type: "Compare",
          uid: node.uid,
          first: reduce(node.first),
          rest: node.rest.map(([op, sub]) => [op, reduce(sub)]),
        };
      }
      case "DefinedBy": {
        return {
          type: "DefinedBy",
          uid: node.uid,
          left: reduce(node.left),
          right: reduce(node.right),
        };
      }
      case "LogicOp": {
        return {
          type: "LogicOp",
          uid: node.uid,
          op: node.op,
          subs: node.subs.map(reduce),
        };
      }
      case "Norm": {
        return {
          type: "Norm",
          uid: node.uid,
          sub: reduce(node.sub),
        };
      }
      case "ComplexConjugate": {
        return {
          type: "ComplexConjugate",
          uid: node.uid,
          sub: reduce(node.sub),
        };
      }
      case "Integral": {
        return {
          type: "Integral",
          uid: node.uid,
          integrand: reduce(node.integrand),
          var: reduce(node.var),
        };
      }
      case "PlaceHolder":
      case "Symbol":
      case "SpecialFunction":
      case "SpecialConstant":
        break;
      default:
        const remain: never = node;
    }

    return node;
  }
}

export const { T } = createExprTrans({
  "simplify": (econ: Econ): Econ => {
    for (const i of range(10)) {
      const prev = econ;
      econ = simplifyOnce(prev);
      if (stEq(prev.expr, econ.expr)) {
        return prev;
      }
    }
    return econ;
  },
  "replace": econ => {
    let { expr, isyms } = econ;
    assert(expr.type === "Group");
    assert(expr.subs.length > 1);
    let f = expr.subs[0];
    const vs = tail(expr.subs);
    vs.forEach(v => {
      assert(v.type === "Equal");
      const { left, right } = v;
      for (const sn of findSameNodes(f, left)) {
        f = replaceExprNode(f, sn.uid, cloneExpr(right));
      }
    });

    return { ...econ, isyms, expr: f };
  },
  "inverse symbol replacement": econ => {
    const { expr, isyms } = econ;
    assert(expr.type === "Symbol");
    const isym = getIsym(isyms, expr.isym)!;
    assert(isym.type === "node-replacement");
    return { ...econ, expr: cloneExpr(isym.replaced) };
  },
});

export const { TwE } = createExprTransWithExtraArgs({
  "replace with symbol": {
    fn: (econ, ...others) => {
      const node = others[0];
      let { expr, isyms } = econ;
      const isym: ISym = { type: "node-replacement", name: "u", suid: randUID(), replaced: node };
      expr = replaceExprNode(expr, node.uid, Cr.Symbol(isym));
      for (const sn of findSameNodes(expr, node)) {
        expr = replaceExprNode(expr, sn.uid, Cr.Symbol(isym));
      }
      return { expr, isyms: [...isyms, isym] };
    },
    extraArgCount: 1,
  },
  "copy": {
    extraArgCount: 1,
    fn: (econ, target) => {
      assert(econ.expr.type === "PlaceHolder");
      return { ...econ, expr: cloneExpr(target) };
    },
  },
});
