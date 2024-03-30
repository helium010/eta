import { randUID } from "../../utils";
import {
  Add,
  Expr,
  Fraction,
  Mul,
  PlaceHolder,
  Pow,
  Symbol,
  Rational,
  Derivative,
  SpecialConstant,
  Equal,
  Matrix,
} from "../../types";
import { createExprCreators } from "../utils";
import { Integer, Inverse, NegOne, One, Sqrt, Zero } from "./types";
import { ISym } from "../../types";
import { replaceExprNode } from "../edits";
import { findSameNodes, stEq } from "../queries";
import { ComplexConjugate, Group, Norm, SpecialFunction } from "../..";

export const { C, Cr } = createExprCreators({
  Symbol: (uid: string, isym: ISym): Symbol => ({ type: "Symbol", uid, isym: isym.suid }),
  PlaceHolder: (uid: string): PlaceHolder => ({ type: "PlaceHolder", uid }),
  Equal: (uid: string, left: Expr, right: Expr): Equal => ({ type: "Equal", uid, left, right }),
  Integer: (uid: string, value: bigint): Integer => ({ type: "Rational", uid, p: value, q: 1n }),
  Zero: (uid: string): Zero => ({ type: "Rational", uid, p: 0n, q: 1n }),
  One: (uid: string): One => ({ type: "Rational", uid, p: 1n, q: 1n }),
  NegOne: (uid: string): NegOne => ({ type: "Rational", uid, p: -1n, q: 1n }),
  Rational: (uid: string, p: bigint, q: bigint): Rational => ({ type: "Rational", uid, p, q }),
  i: (uid: string): SpecialConstant => ({ type: "SpecialConstant", uid, name: "i" }),
  e: (uid: string): SpecialConstant => ({ type: "SpecialConstant", uid, name: "e" }),
  pi: (uid: string): SpecialConstant => ({ type: "SpecialConstant", uid, name: "pi" }),
  SpecialFunction: (uid: string, name: SpecialFunction["name"], var_: Expr): SpecialFunction => ({
    type: "SpecialFunction",
    uid,
    name,
    var: var_,
  }),
  Add: (uid: string, ...subs: Expr[]): Add => ({ type: "Add", uid, subs }),
  Minus: (uid: string, sub1: Expr, sub2: Expr): Add => ({
    type: "Add",
    uid,
    subs: [sub1, Cr.Mul(Cr.NegOne(), sub2)],
  }),
  Mul: (uid: string, ...subs: Expr[]): Mul => ({ type: "Mul", uid, subs }),
  Group: (uid: string, ...subs: Expr[]): Group => ({ type: "Group", uid, subs }),
  Pow: (uid: string, base: Expr, exp: Expr): Pow => ({ type: "Pow", uid, base, exp }),
  Sqrt: (uid: string, base: Expr): Sqrt => ({
    type: "Pow",
    uid,
    base,
    exp: { type: "Rational", uid: randUID(), p: 1n, q: 2n },
  }),
  Inverse: (uid: string, base: Expr): Inverse => ({
    type: "Pow",
    uid,
    base,
    exp: { type: "Rational", uid: randUID(), p: -1n, q: 1n },
  }),
  Fraction: (uid: string, num: Expr, den: Expr): Fraction => ({ type: "Fraction", uid, num, den }),
  Derivative: (uid: string, func: Expr, indep: Expr, order: bigint): Derivative => ({
    type: "Derivative",
    uid,
    func,
    indep,
    order,
  }),
  Matrix: (uid: string, subs: Expr[][]): Matrix => ({ type: "Matrix", uid, subs }),
  Norm: (uid: string, sub: Expr): Norm => ({ type: "Norm", uid, sub }),
  ComplexConjugate: (uid: string, sub: Expr): ComplexConjugate => ({
    type: "ComplexConjugate",
    uid,
    sub,
  }),
});

export function getCoeffOf(expr: Expr, of: Expr) {
  if (stEq(expr, of)) return Cr.One();
  if (expr.type === "Mul") {
    const newSubs = expr.subs.filter(sub => !stEq(sub, of));
    if (newSubs.length < expr.subs.length) {
      return Cr.Mul(...newSubs);
    }
  }
  return Cr.Zero();
}
