import { Rational } from "../../types";
import { createExprIs } from "../utils";
import { Half, Integer, Inverse, NegOne, One, Zero } from "./types";

export const I = createExprIs({
  isRational: (expr): expr is Rational => expr.type === "Rational",
  isInteger: (expr): expr is Integer => expr.type === "Rational" && expr.q === 1n,
  isPositiveInteger: (expr): expr is Integer =>
    expr.type === "Rational" && expr.q === 1n && expr.p > 0n,
  isZero: (expr): expr is Zero => expr.type === "Rational" && expr.p === 0n && expr.q === 1n,
  isOne: (expr): expr is One => expr.type === "Rational" && expr.p === 1n && expr.q === 1n,
  isNegOne: (expr): expr is NegOne => expr.type === "Rational" && expr.p === -1n && expr.q === 1n,
  isHalf: (expr): expr is Half => expr.type === "Rational" && expr.p === 1n && expr.q === 2n,
  isInverse: (expr): expr is Inverse => expr.type === "Pow" && I.isNegOne(expr.exp),
});
