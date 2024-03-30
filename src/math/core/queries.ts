import { invalidArgument } from "../utils";
import { Expr } from "../types";
import { assert } from "..";

export function traverseExprTree(expr: Expr, before: (expr: Expr) => void, after?: (expr: Expr) => void) {
  _traverse(expr);

  function _traverse(node: Expr) {
    before(node);
    switch (node.type) {
      case "Add": {
        node.subs.forEach(_traverse);
        break;
      }
      case "Mul": {
        node.subs.forEach(_traverse);
        break;
      }
      case "LogicOp": {
        node.subs.forEach(_traverse);
        break;
      }
      case "Pow": {
        _traverse(node.base);
        _traverse(node.exp);
        break;
      }
      case "Equal": {
        _traverse(node.left);
        _traverse(node.right);
        break;
      }
      case "Compare": {
        _traverse(node.first);
        node.rest.map(([, expr]) => _traverse(expr));
        break;
      }
      case "Cases": {
        node.subs.forEach(({ expr, cond }) => [_traverse(expr), _traverse(cond)]);
        break;
      }
      case "Matrix": {
        node.subs.map(row => row.forEach(_traverse));
        break;
      }

      case "Group": {
        node.subs.forEach(_traverse);
        break;
      }
      case "Fraction": {
        _traverse(node.num);
        _traverse(node.den);
        break;
      }
      case "DefinedBy": {
        _traverse(node.left);
        _traverse(node.right);
        break;
      }
      case "Derivative": {
        _traverse(node.func);
        _traverse(node.indep);
        break;
      }
      case "SpecialFunction": {
        _traverse(node.var);
        break;
      }
      case "InfiniteSequence": {
        _traverse(node.elem);
        break;
      }
      case "Norm": {
        _traverse(node.sub);
        break;
      }
      case "ComplexConjugate": {
        _traverse(node.sub);
        break;
      }
      case "Integral": {
        _traverse(node.integrand);
        _traverse(node.var);
        break;
      }
      case "Symbol":
      case "PlaceHolder":
      case "Rational":
      case "SpecialConstant":
        break;
      default:
        const remained: never = node;
    }
    if (after) after(node);
  }
}

/**
 * Assert tree `expr` matching following conditions:
 * - Each node has exactly one parent except root.
 */

export function validateExprTree(expr: Expr) {
  const exprUIDSet = new Set<string>();

  traverseExprTree(expr, node => {
    if (exprUIDSet.has(node.uid)) invalidArgument(`Duplicated UID in node ${expr.type}`);
    exprUIDSet.add(node.uid);
    if (
      node.type === "Add" ||
      node.type === "Mul" ||
      node.type === "LogicOp" ||
      node.type === "Group" ||
      node.type === "Cases"
    ) {
      assert(node.subs.length > 0);
    }
    if (node.type === "Matrix") {
      assert(node.subs.length > 0);
      const n = node.subs[0].length;
      assert(n > 0);
      node.subs.forEach(row => assert(row.length === n));
    }
  });
}
export function findExprNodeByUid(expr: Expr, uid: string): Expr | undefined {
  let found: Expr | undefined = undefined;
  traverseExprTree(expr, expr => {
    if (expr.uid === uid) found = expr;
  });
  return found;
}
export function findAllExprNode<T extends Expr["type"]>(expr: Expr, type: T) {
  const nodes: Extract<Expr, { type: T }>[] = [];
  traverseExprTree(expr, expr => {
    if (expr.type === type) nodes.push(expr as any);
  });
  return nodes;
}

export function findMaxDepth(expr: Expr) {
  let currentDepth = 0;
  let maxDepth = 0;
  traverseExprTree(
    expr,
    () => {
      currentDepth++;
      if (maxDepth < currentDepth) maxDepth = currentDepth;
    },
    () => currentDepth--
  );
  return maxDepth;
}
export function findAllAtDepth(expr: Expr, depth: number) {
  const result: Expr[] = [];
  let currentDepth = 0;
  traverseExprTree(
    expr,
    expr => {
      if (currentDepth === depth) {
        result.push(expr);
      }
      currentDepth++;
    },
    () => currentDepth--
  );
  return result;
}
/**
 * Find all nodes at height from leafs. All leafs are at height 1. If a node
 * is parent of multiple children, its height is related to its deepest child.
 */
export function findAllAtHeight(expr: Expr, height: number) {
  const result: Expr[] = [];
  const excludedNodes = new Set<Expr>();

  while (height >= 0) {
    let currentDepth = 0;
    let branchMaxDepth = 0;
    traverseExprTree(
      expr,
      expr => {
        if (!excludedNodes.has(expr)) {
          branchMaxDepth = currentDepth;
          currentDepth++;
        }
      },
      expr => {
        if (!excludedNodes.has(expr)) {
          currentDepth--;
          // Current node is a leaf.
          if (branchMaxDepth === currentDepth) {
            if (height > 0) excludedNodes.add(expr);
            else result.push(expr);
          }
        }
      }
    );
    height--;
  }
  return result;
}

export function findSameNodes(expr: Expr, like: Expr) {
  const result: Expr[] = [];
  const depth = findMaxDepth(like);
  const possibleNodes = findAllAtHeight(expr, depth - 1);
  for (const pn of possibleNodes) {
    if (pn.uid === like.uid) {
      continue;
    }
    if (stEq(pn, like)) {
      result.push(pn);
    }
  }
  return result;
}

/**
 * Recursively destruct expr tree with pre-order and depth-first.
 */
export function flattenExpr(expr: Expr) {
  const nodes: Expr[] = [];
  traverseExprTree(expr, node => nodes.push(node));
  return nodes;
}

/**
 * Compare two exprs with respect to their structure. In another word,
 * two nodes are considered equal despite they differ in any of following
 * fields or not.
 * - `uid`
 * - `parenthesis`
 * - `displayOperator`
 */
export function stEq(a: Expr, b: Expr) {
  const af = flattenExpr(a);
  const bf = flattenExpr(b);
  if (af.length !== bf.length) return false;
  for (let i = 0; i < af.length; i++) {
    const [an, bn] = [af[i], bf[i]];

    if (an.type !== bn.type) return false;
    if (an.type === "Symbol" && bn.type === "Symbol") {
      if (an.isym !== bn.isym) return false;
    }
    if (an.type === "Rational" && bn.type == "Rational") {
      if (an.p !== bn.p || an.q !== bn.q) return false;
    }
    if (an.type === "SpecialConstant" && bn.type == "SpecialConstant") {
      if (an.name !== bn.name) return false;
    }
    if (an.type === "SpecialFunction" && bn.type === "SpecialFunction") {
      if (an.name !== bn.name) return false;
    }
  }
  return true;
}
