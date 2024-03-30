import exp from "constants";
import _, { ary, head, isNil, max, tail, unzip } from "lodash";
import {
  Econ,
  getIsym,
  getP,
  ISym,
  makeDelim,
  makeDelims,
  makeHListByOffset,
  makeSqrt,
  makeVListByOffset,
  makeVShift,
  notNil,
  switchOn,
} from "..";
import { I } from "../core/is";

import { validateExprTree } from "../core/queries";
import { Expr } from "../types";
import { assert, notImplemented } from "../utils";
import { TMSM } from "./fonts";
import {
  makeChar,
  makeFraction,
  makeHAtomList,
  makeInteger,
  makeOp,
  makeSquare,
  makeSupSub,
  makeSymbol,
} from "./make";
import { TeXBox, TMS } from "./types";
import { d, h } from "./utils";

/**
 * This variable is used when traversing expression tree. It means the TeX math style of current node.
 *
 * This symbol is defined in P437.
 */
let C = TMS.D;

let exprBoxMap = new Map<string, TeXBox>();

/**
 * Build box from expr. This is the entry of recursive building process.
 *
 * This function should **NOT** be called inside recursion.
 */
export function build(econ: Econ) {
  validateExprTree(econ.expr);

  // Reset all variables used in traversion.
  C = TMS.D;
  exprBoxMap = new Map<string, TeXBox>();

  // Build box of expression.
  const box = buildNode(econ);

  // Post process.
  box.div.style.position = "relative";
  box.div.style.userSelect = "none";
  const map = exprBoxMap;

  return {
    ...box,
    boxOf: (node: Expr) => {
      const box = map.get(node.uid);
      notNil(box);
      return box;
    },
  };
}

function buildNode(econ: Econ): TeXBox {
  const { expr: node } = econ;

  let box = buildWithoutParenthesis();
  if (node.parenthesis) {
    box = makeDelims("(", box, ")", C);
  }
  exprBoxMap.set(node.uid, box);
  box.div.setAttribute("ee", node.type);
  return box;

  function buildWithoutParenthesis(): TeXBox {
    switch (node.type) {
      case "PlaceHolder": {
        return makeSquare(0.5, 0.5, 0, 0.1);
      }
      case "Symbol": {
        const isym = getIsym(econ.isyms, node.isym);
        notNil(isym);
        const c = makeSymbol(isym.name, C);
        return c;
      }
      case "Rational": {
        if (node.q === 1n) return makeInteger(node.p, C);
        const numer = makeInteger(node.p, TMSM.fracNum[C]);
        const domen = makeInteger(node.q, TMSM.fracDen[C]);
        return makeFraction(numer, domen, C);
      }
      case "SpecialConstant": {
        switch (node.name) {
          case "i":
          case "e":
            return makeChar(node.name, "Math-Italic", C);
          case "infty":
            return makeChar("\\infty", "Main-Regular", C);
          case "pi":
            return makeChar("\\pi", "Math-Italic", C);
          default:
            notImplemented();
        }
      }
      case "Fraction":
        // Rule 15a
        const _C = C;
        C = TMSM.fracNum[_C];
        /** Box of numerator.  */
        let x = buildNode({ ...econ, expr: node.num });
        C = TMSM.fracDen[_C];
        /** Box of denominator. */
        let z = buildNode({ ...econ, expr: node.den });
        C = _C;
        return makeFraction(x, z, C);
      case "Derivative": {
        assert(node.order >= 1);
        const _C = C;
        C = TMSM.fracNum[_C];
        const d = makeChar("d", "Math-Italic", C);
        const numer = makeHAtomList(
          [
            node.order === 1n
              ? d
              : makeSupSub(d, makeInteger(BigInt(node.order), TMSM.sup[C]), undefined, C),
            buildNode({ ...econ, expr: node.func }),
          ],
          C
        );
        C = TMSM.fracDen[_C];
        const s = buildNode({ ...econ, expr: node.indep });
        const denom = makeHAtomList(
          [
            makeChar("d", "Math-Italic", C),
            node.order === 1n
              ? s
              : makeSupSub(s, makeInteger(BigInt(node.order), TMSM.sup[C]), undefined, C),
          ],
          C
        );
        C = _C;
        return makeFraction(numer, denom, C);
      }
      case "DefinedBy": {
        return makeHAtomList(
          [
            buildNode({ ...econ, expr: node.left }),
            makeChar(":", "Main-Regular", C),
            makeChar("=", "Main-Regular", C),
            buildNode({ ...econ, expr: node.right }),
          ],
          C
        );
      }
      case "Add": {
        return buildJoinList(node.subs, "+");
      }
      case "Mul": {
        if (node.displayOperator) {
          return buildJoinList(node.subs, "\\times");
        } else {
          if (node.subs.length > 1 && I.base.isNegOne(node.subs[0]) && !node.subs[0].parenthesis) {
            const sign = makeChar("-", "Main-Regular", C);
            exprBoxMap.set(node.subs[0].uid, sign);
            return makeHAtomList(
              [
                sign,
                ...tail(node.subs).map(sub => {
                  let box = buildNode({ ...econ, expr: sub });
                  if (sub.type === "Add" && isNil(sub.parenthesis)) {
                    box = makeDelims("(", box, ")", C);
                    exprBoxMap.set(sub.uid, box);
                  }
                  return box;
                }),
              ],
              C
            );
          }
          return makeHAtomList(
            node.subs.map(sub => {
              let box = buildNode({ ...econ, expr: sub });
              if (sub.type === "Add" && isNil(sub.parenthesis)) {
                box = makeDelims("(", box, ")", C);
                exprBoxMap.set(sub.uid, box);
              }
              return box;
            }),
            C
          );
        }
      }
      case "LogicOp": {
        return buildJoinList(node.subs, node.op);
      }
      case "Pow": {
        let nucleus = buildNode({ ...econ, expr: node.base });

        if (I.base.isHalf(node.exp)) {
          const box = makeSqrt(nucleus, C);
          exprBoxMap.set(node.exp.uid, box);
          return box;
        }

        const _C = C;
        C = TMSM.sup[_C];
        const sup = buildNode({ ...econ, expr: node.exp });
        C = _C;
        if (
          (node.base.type === "Add" || node.base.type === "Mul") &&
          isNil(node.base.parenthesis)
        ) {
          nucleus = makeDelims("(", nucleus, ")", C);
          exprBoxMap.set(node.base.uid, nucleus);
        }
        return makeSupSub(nucleus, sup, undefined, C);
      }
      case "Equal": {
        return buildJoinList([node.left, node.right], "=");
      }
      case "Compare": {
        return makeHAtomList(
          [
            buildNode({ ...econ, expr: node.first }),
            ...node.rest
              .map(([op, e]) => [makeChar(op, "Main-Regular", C), buildNode({ ...econ, expr: e })])
              .flat(),
          ],
          C
        );
      }
      case "Cases": {
        const boxes: [TeXBox, TeXBox][] = [];
        for (const { expr, cond } of node.subs) {
          boxes.push([buildNode({ ...econ, expr }), buildNode({ ...econ, expr: cond })]);
        }

        const baselineskip = 1.2 * TMSM.fontScale[C];
        const arrayskip = 1.2 * baselineskip;
        const arstrutHeight = 0.7 * arrayskip; // \strutbox in ltfsstrc.dtx and
        const arstrutDepth = 0.3 * arrayskip; // \@arstrutbox in lttab.dtx

        const pos = { y: [] as number[], yHeight: [] as number[], x: [] as number[] };
        let thpd = 0;
        let tw = 0;
        boxes.map(bs => {
          const height = bs.map(b => b.metric.height).reduce(ary(Math.max, 2), arstrutHeight);
          const depth = bs.map(b => b.metric.depth).reduce(ary(Math.max, 2), arstrutDepth);
          pos.y.push(thpd);
          pos.yHeight.push(height);
          thpd += height + depth;
        });
        unzip(boxes).map(bs => {
          const width = bs.map(b => b.metric.width).reduce(ary(Math.max, 2), 0);
          pos.x.push(tw);
          tw += width + 1;
        });
        const right = makeVListByOffset(
          thpd / 2 + getP("sigma22", C),
          thpd / 2 - getP("sigma22", C),
          ...boxes.map((bs, j) => {
            let box = makeHListByOffset(bs.map((b, i) => ({ box: b, offset: pos.x[i] })));
            box = makeVShift(box, pos.yHeight[j] - box.metric.height);
            return { box, offset: pos.y[j] };
          })
        );
        return makeDelims("{", right, ".", C);
      }
      case "Matrix": {
        const boxes: TeXBox[][] = [];
        for (const row of node.subs) {
          boxes.push(row.map(sub => buildNode({ ...econ, expr: sub })));
        }
        const baselineskip = 1.2 * TMSM.fontScale[C];
        const arrayskip = 1.2 * baselineskip;
        const arstrutHeight = 0.7 * arrayskip; // \strutbox in ltfsstrc.dtx and
        const arstrutDepth = 0.3 * arrayskip; // \@arstrutbox in lttab.dtx

        const pos = { y: [] as number[], yHeight: [] as number[], x: [] as number[] };
        let thpd = 0;
        let tw = 0;
        boxes.map(bs => {
          const height = bs.map(b => b.metric.height).reduce(ary(Math.max, 2), arstrutHeight);
          const depth = bs.map(b => b.metric.depth).reduce(ary(Math.max, 2), arstrutDepth);
          pos.y.push(thpd);
          pos.yHeight.push(height);
          thpd += height + depth;
        });
        unzip(boxes).map(bs => {
          const width = bs.map(b => b.metric.width).reduce(ary(Math.max, 2), 0);
          pos.x.push(tw);
          tw += width + 1;
        });
        const right = makeVListByOffset(
          thpd / 2 + getP("sigma22", C),
          thpd / 2 - getP("sigma22", C),
          ...boxes.map((bs, j) => {
            let box = makeHListByOffset(bs.map((b, i) => ({ box: b, offset: pos.x[i] })));
            box = makeVShift(box, pos.yHeight[j] - box.metric.height);
            return { box, offset: pos.y[j] };
          })
        );
        return makeDelims("[", right, "]", C);
      }
      case "Group": {
        const boxex = node.subs.map(sub => buildNode({ ...econ, expr: sub }));
        const y: number[] = [];
        let cy = 0;
        for (const {
          metric: { height, depth },
        } of boxex) {
          y.push(cy);
          cy += height + depth + 1;
        }
        cy -= 1;
        return makeVListByOffset(
          cy / 2 + getP("sigma22", C),
          cy / 2 - getP("sigma22", C),
          ...boxex.map((box, i) => ({ box, offset: y[i] }))
        );
      }
      case "SpecialFunction": {
        const fn = makeHAtomList(
          [...node.name].map(c => makeChar(c, "Main-Regular", C)),
          C
        );
        const v = buildNode({ ...econ, expr: node.var });
        const f = makeHAtomList([fn, makeDelims("(", v, ")", C)], C);
        return f;
      }
      case "InfiniteSequence": {
        const elem = buildNode({ ...econ, expr: node.elem });
        const idx = makeSymbol(getIsym(econ.isyms, node.index)!.name, TMSM.sub[C]);
        const left = makeDelims("{", elem, "}", C);
        return makeSupSub(left, undefined, idx, C);
      }
      case "Norm": {
        return makeDelims("|", buildNode({ ...econ, expr: node.sub }), "|", C);
      }
      case "ComplexConjugate": {
        return makeSupSub(
          buildNode({ ...econ, expr: node.sub }),
          makeChar("*", "Main-Regular", TMSM.sup[C]),
          undefined,
          C
        );
      }
      case "Integral": {
        const integrand = buildNode({ ...econ, expr: node.integrand });
        const var_ = buildNode({ ...econ, expr: node.var });
        const delta = Math.max(
          h(integrand) - getP("sigma22", C),
          d(integrand) + getP("sigma22", C)
        );

        const mhpd = Math.max(1.802 * delta, 2 * delta - 5 / getP("ptPerEm", C));

        const op = makeDelim("\\int", mhpd, C);
        return makeHAtomList([op, integrand, makeChar("d", "Math-Italic", C), var_], C);
      }
      default: {
        const remained: never = node;
        notImplemented((node as any).type);
      }
    }
  }

  function buildJoinList(subs: readonly Expr[], seperator: string) {
    const exprBoxes = subs.map(sub => buildNode({ ...econ, expr: sub }));

    const boxes = [exprBoxes[0]];
    for (const exprBox of _.tail(exprBoxes)) {
      boxes.push(makeChar(seperator, "Main-Regular", C));
      boxes.push(exprBox);
    }

    return makeHAtomList(boxes, C);
  }
}
