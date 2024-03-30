import { assert } from "../../utils";
import { stEq, traverseExprTree } from "../queries";
import { createExprTrans, createExprTransWithExtraArgs } from "../utils";
import { C as bC, Cr as bCr } from "../base/edits";
import { Expr, invalidArgument, notImplemented, SpecialFunction } from "../..";
import { last } from "lodash";

export const { T } = createExprTrans({});

export const { TwE } = createExprTransWithExtraArgs({
  "solve": {
    extraArgCount: 1,
    fn: (econ, target) => {
      const { expr } = econ;
      assert(expr.type === "Equal");
      let { left, right } = expr;
      const stack: Expr[] = [];
      let found = false;
      traverseExprTree(
        left,
        node => {
          if (!found) {
            stack.push(node);
            if (node.uid === target.uid) {
              found = true;
            }
          }
        },
        node => {
          if (!found) {
            stack.pop();
          }
        }
      );
      assert(found);
      stack.reverse();

      while (stack.length > 1) {
        left = stack.pop()!;
        const top = last(stack)!;
        if (left.type === "Mul" || left.type === "Add") {
          const idx = left.subs.indexOf(top);
          const restSubs = [...left.subs.slice(0, idx), ...left.subs.slice(idx + 1)];
          assert(restSubs.length > 0);
          if (left.type === "Mul") {
            right = bCr.Fraction(right, bCr.Mul(...restSubs));
          } else if (left.type === "Add") {
            right = bCr.Add(right, bCr.Mul(bCr.NegOne(), bCr.Add(...restSubs)));
          }
        } else if (
          left.type === "SpecialFunction" &&
          (left.name === "sin" || left.name === "cos")
        ) {
          const reverseMap = {
            sin: "arcsin",
            cos: "arccos",
          } as const;
          right = bCr.SpecialFunction(reverseMap[left.name], right);
        } else if (left.type === "Pow") {
          if (top === left.base) {
            right = bCr.Pow(right, bCr.Inverse(left.exp));
          } else {
            notImplemented();
          }
        } else if (left.type === "Fraction") {
          if (top === left.num) {
            right = bCr.Mul(right, left.den);
          } else {
            right = bCr.Mul(bCr.Inverse(right), left.num);
          }
        } else {
          invalidArgument();
        }
      }

      return { ...econ, expr: bC.Equal(expr.uid, stack.pop()!, right) };

      invalidArgument();
    },
  },
  "move term over equal": {
    extraArgCount: 1,
    fn: (econ, moved) => {
      const { expr } = econ;
      assert(expr.type === "Equal");
      if (expr.left.uid === moved.uid) {
        return {
          ...econ,
          expr: bC.Equal(expr.uid, bCr.Zero(), bCr.Minus(expr.right, expr.left)),
        };
      }
      if (expr.right.uid === moved.uid) {
        return {
          ...econ,
          expr: bC.Equal(expr.uid, bCr.Minus(expr.left, expr.right), bCr.Zero()),
        };
      }
      if (expr.left.type === "Add") {
        const idx = expr.left.subs.findIndex(i => i.uid === moved.uid);
        if (idx >= 0) {
          const restSubs = [...expr.left.subs];
          restSubs.splice(idx, 1);
          return {
            ...econ,
            expr: bC.Equal(
              expr.uid,
              bC.Add(expr.left.uid, ...restSubs),
              bCr.Minus(expr.right, moved)
            ),
          };
        }
      }
      if (expr.right.type === "Add") {
        const idx = expr.right.subs.findIndex(i => i.uid === moved.uid);
        if (idx >= 0) {
          const restSubs = [...expr.right.subs];
          restSubs.splice(idx, 1);
          return {
            ...econ,
            expr: bC.Equal(
              expr.uid,
              bCr.Add(expr.left, moved),
              bC.Mul(expr.right.uid, ...restSubs)
            ),
          };
        }
      }
      invalidArgument();
    },
  },
  "move factor over equal": {
    extraArgCount: 1,
    fn: (econ, moved) => {
      const { expr } = econ;
      assert(expr.type === "Equal");
      if (expr.left.uid === moved.uid) {
        return {
          ...econ,
          expr: bC.Equal(expr.uid, bCr.One(), bCr.Fraction(expr.right, expr.left)),
        };
      }
      if (expr.right.uid === moved.uid) {
        return {
          ...econ,
          expr: bC.Equal(expr.uid, bCr.Fraction(expr.left, expr.right), bCr.One()),
        };
      }
      if (expr.left.type === "Mul") {
        const idx = expr.left.subs.findIndex(i => i.uid === moved.uid);
        if (idx >= 0) {
          const restSubs = [...expr.left.subs];
          restSubs.splice(idx, 1);
          return {
            ...econ,
            expr: bC.Equal(
              expr.uid,
              bC.Mul(expr.left.uid, ...restSubs),
              bCr.Fraction(expr.right, moved)
            ),
          };
        }
      }
      if (expr.right.type === "Mul") {
        const idx = expr.right.subs.findIndex(i => i.uid === moved.uid);
        if (idx >= 0) {
          const restSubs = [...expr.right.subs];
          restSubs.splice(idx, 1);
          return {
            ...econ,
            expr: bC.Equal(
              expr.uid,
              bCr.Fraction(expr.left, moved),
              bC.Mul(expr.right.uid, ...restSubs)
            ),
          };
        }
      }
      invalidArgument();
    },
  },
});
