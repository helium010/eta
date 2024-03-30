import { cloneDeep, isNil } from "lodash";
import { Expr, ISym } from "../types";
import { notImplemented, randUID } from "../utils";
import { findSameNodes, traverseExprTree } from "./queries";

import { C, Cr } from "./base/edits";
import { Econ } from "..";
export { C, Cr } from "./base/edits";
export { editMatTrans } from "./matrix/edit";

export function editExprTree(expr: Expr, editNode: (expr: Expr) => Expr) {
  return _edit(expr);

  function _edit(node: Expr): Expr {
    const baseProps = { uid: node.uid, parenthesis: node.parenthesis } as const;
    switch (node.type) {
      case "Add":
        node = { type: "Add", ...baseProps, subs: node.subs.map(_edit) };
        break;
      case "Mul":
        node = { type: "Mul", ...baseProps, subs: node.subs.map(_edit) };
        break;
      case "LogicOp": {
        node = { type: "LogicOp", ...baseProps, op: node.op, subs: node.subs.map(_edit) };
        break;
      }
      case "Equal":
        node = {
          type: "Equal",
          ...baseProps,
          left: _edit(node.left),
          right: _edit(node.right),
        };
        break;
      case "Compare": {
        node = {
          type: "Compare",
          ...baseProps,
          first: _edit(node.first),
          rest: node.rest.map(([op, expr]) => [op, _edit(expr)]),
        };
        break;
      }
      case "Cases":
        node = {
          type: "Cases",
          ...baseProps,
          subs: node.subs.map(({ expr, cond }) => ({ expr: _edit(expr), cond: _edit(cond) })),
        };
        break;
      case "Matrix":
        node = {
          type: "Matrix",
          ...baseProps,
          subs: node.subs.map(row => row.map(_edit)),
        };
        break;
      case "Group":
        node = {
          type: "Group",
          ...baseProps,
          subs: node.subs.map(_edit),
        };
        break;
      case "DefinedBy":
        node = {
          type: "DefinedBy",
          ...baseProps,
          left: _edit(node.left),
          right: _edit(node.right),
        };
        break;
      case "Fraction":
        node = { type: "Fraction", ...baseProps, num: _edit(node.num), den: _edit(node.den) };
        break;
      case "Pow":
        node = { type: "Pow", ...baseProps, base: _edit(node.base), exp: _edit(node.exp) };
        break;
      case "Derivative": {
        node = {
          type: "Derivative",
          ...baseProps,
          func: _edit(node.func) as any,
          indep: _edit(node.indep) as any,
          order: node.order,
        };
        break;
      }
      case "SpecialFunction": {
        node = {
          type: "SpecialFunction",
          ...baseProps,
          name: node.name,
          var: _edit(node.var),
        };
        break;
      }
      case "InfiniteSequence": {
        node = {
          type: "InfiniteSequence",
          ...baseProps,
          index: node.index,
          elem: _edit(node.elem),
        };
        break;
      }
      case "Norm":
        {
          node = {
            type: "Norm",
            ...baseProps,
            sub: _edit(node.sub),
          };
        }
        break;
      case "ComplexConjugate": {
        node = {
          type: "ComplexConjugate",
          ...baseProps,
          sub: _edit(node.sub),
        };
        break;
      }
      case "Integral": {
        node = {
          type: "Integral",
          ...baseProps,
          integrand: _edit(node.integrand),
          var: _edit(node.var),
        };
        break;
      }
      case "PlaceHolder":
      case "Symbol":
      case "Rational":
      case "SpecialConstant":
        break;
      default:
        const remainedNode: never = node;
        notImplemented();
    }
    return editNode(node);
  }
}

/**
 * Return cloned expr with some replacements.
 * @param expr Cloned expr.
 * @param replaceUID UID of replaced expr.
 * @param by Expr replaced by.
 * @returns
 */
export function replaceExprNode(expr: Expr, replaceUID: string, by: Expr): Expr {
  return editExprTree(expr, node => (node.uid === replaceUID ? by : node));
}

/**
 * Return a cloned expr with all UIDs replaced by new randan UID.
 */
export function cloneExpr<T extends Expr>(expr: T): T {
  const newExpr = cloneDeep(expr);
  traverseExprTree(newExpr, node => ((node as any).uid = randUID()));
  return newExpr;
}

/**
 * Return a cloned expr with given UID.
 */
export function changeExprUID<T extends Expr>(expr: T, uid: string): T {
  const newExpr = cloneDeep(expr);
  (newExpr as any).uid = uid;
  return newExpr;
}

export function replaceSymbolNode(expr: Expr, symbolUid: string, by: () => Expr) {
  return editExprTree(expr, node =>
    node.type === "Symbol" && node.isym === symbolUid ? by() : node
  );
}
