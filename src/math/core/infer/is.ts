import { Domain, Econ, getIsym, ISymX, oneOf } from "../..";
import { createExprIs } from "../utils";

export const I = {
  "non-negative": (econ: Econ): boolean => {
    const { expr, isyms } = econ;
    if (expr.type === "Rational") {
      return expr.p * expr.q >= 0n;
    }
    if (expr.type === "SpecialConstant") {
      if (oneOf(expr.name, ["e", "infty", "pi"])) {
        return true;
      }
    }
    if (expr.type === "Symbol") {
      const isym = getIsym(isyms, expr.isym)!;
      if (oneOf(isym.type, ["constant", "indeterminate-constant", "variable"])) {
        const domain = (isym as any).domain as Domain;
        if (domain.type === "R-expr" && domain.expr.type === "Compare") {
          const { first, rest } = domain.expr;
          if (first.type === "Symbol" && rest.length === 1) {
            const firstIsym = getIsym(isyms, first.isym)!;
            const [op, right] = rest[0];
            if (
              first.isym === expr.isym &&
              (op === ">" || op === "\\ge") &&
              I["non-negative"]({ expr: right, isyms })
            ) {
              return true;
            }
          }
        }
      } else if (isym.type === "node-replacement") {
        return I["non-negative"]({ expr: isym.replaced, isyms });
      }
    }
    if (expr.type === "Mul") {
      return expr.subs.every((sub) => I["non-negative"]({ expr: sub, isyms }));
    }
    if (expr.type === "Fraction") {
      return [expr.num, expr.den].every((sub) => I["non-negative"]({ expr: sub, isyms }));
    }
    if (expr.type === "Pow") {
      return I["non-negative"]({ expr: expr.base, isyms });
    }
    return false;
  },
};
