import _, { isNil } from "lodash";
import { Econ, Expr } from "..";
import { I } from "../core/is";
import { invalidArgument, notImplemented } from "../utils";
import { TeXBox } from "./types";

// Functions defined in P438 as abbreviations of height, depth and width.
export const h = (x: TeXBox) => x.metric.height;
export const d = (x: TeXBox) => x.metric.depth;
export const w = (x: TeXBox) => x.metric.width;

export function toLaTeX(econ: Econ): string {
  const { expr: node } = econ;
  let tex = toLaTeXWithoutParens();
  if (node.parenthesis) {
    tex = `\\left(${tex}\\right )`;
  }
  return tex;

  function toLaTeXWithoutParens() {
    switch (node.type) {
      case "PlaceHolder": {
        return "\\square";
      }
      case "Symbol": {
        return `{${econ.isyms.find(i => i.suid === node.isym)!.name}}`;
      }
      case "Rational": {
        if (node.q === 1n) return node.p.toString();
        return `\\frac{${node.p}}{${node.q}}`;
      }
      case "SpecialConstant": {
        if (["pi", "infty"].includes(node.name)) {
          return "\\" + node.name;
        }
        return node.name;
      }
      case "Fraction": {
        return `\\frac{${toLaTeX({ ...econ, expr: node.num })}}{${toLaTeX({
          ...econ,
          expr: node.den,
        })}}`;
      }
      case "Derivative": {
        const o = `${node.order > 1n ? `^${node.order}` : ""}`;
        return `\\frac{d${o}${toLaTeX({ ...econ, expr: node.func })}}{d${toLaTeX({
          ...econ,
          expr: node.indep,
        })}${o}}`;
      }
      case "DefinedBy": {
        return `${node.left}:=${node.right}`;
      }
      case "Add": {
        return node.subs.map(sub => toLaTeX({ ...econ, expr: sub })).join("+");
      }
      case "Mul": {
        let tex = "";
        let rest = [...node.subs];
        if (node.subs.length > 1 && I.base.isNegOne(node.subs[0]) && !node.subs[0].parenthesis) {
          tex += "-";
          rest.splice(0, 1);
        }
        tex += rest
          .map(sub => {
            let t = toLaTeX({ ...econ, expr: sub });
            if (sub.type === "Add" && isNil(sub.parenthesis)) {
              t = `\\left(${t}\\right)`;
            }
            return t;
          })
          .join("");
        return tex;
      }
      case "LogicOp": {
        return node.subs.map(sub => toLaTeX({ ...econ, expr: sub })).join(node.op);
      }
      case "Pow": {
        if (I.base.isHalf(node.exp)) {
          return `\\sqrt{${toLaTeX({ ...econ, expr: node.base })}}`;
        }
        let baseTex = toLaTeX({ ...econ, expr: node.base });
        if (
          (node.base.type === "Add" || node.base.type === "Mul") &&
          isNil(node.base.parenthesis)
        ) {
          baseTex = `\\left(${baseTex}\\right)`;
        }
        return `{${baseTex}}^{${toLaTeX({
          ...econ,
          expr: node.exp,
        })}}`;
      }
      case "Equal": {
        return `${toLaTeX({ ...econ, expr: node.left })}=${toLaTeX({ ...econ, expr: node.right })}`;
      }
      case "Compare": {
        return `${toLaTeX({ ...econ, expr: node.first })}${node.rest
          .map(([op, e]) => `${op}${toLaTeX({ ...econ, expr: e })}`)
          .join("")}`;
      }
      case "Cases": {
        return `\\begin{cases}${node.subs
          .map(
            ({ expr, cond }) =>
              `${toLaTeX({ ...econ, expr: expr })}&${toLaTeX({ ...econ, expr: cond })}`
          )
          .join("\\\\")}\\end{cases}`;
      }
      case "Matrix": {
        return `\\begin{bmatrix}${node.subs
          .map(row => row.map(sub => toLaTeX({ ...econ, expr: sub })).join("&"))
          .join("\\\\")}\\end{bmatrix}`;
      }
      case "Group": {
        return node.subs.map(sub => toLaTeX({ ...econ, expr: sub })).join("\\\\");
      }
      case "SpecialFunction": {
        return `\\mathop {\\rm ${node.name}}\\nolimits \\left(${toLaTeX({
          ...econ,
          expr: node.var,
        })}\\right)`;
      }
      case "InfiniteSequence": {
        return `\\left\\{ ${toLaTeX({ ...econ, expr: node.elem })} \\right\\}_{${
          econ.isyms.find(i => i.suid === node.index)!.name
        }}`;
      }
      case "Norm": {
        return `\\left|${toLaTeX({ ...econ, expr: node.sub })}\\right|`;
      }
      case "ComplexConjugate": {
        return `{${toLaTeX({ ...econ, expr: node.sub })}}^*`;
      }
      case "Integral": {
        return `\\int${toLaTeX({ ...econ, expr: node.integrand })}\\ d${toLaTeX({
          ...econ,
          expr: node.var,
        })}`;
      }
      default: {
        const remained: never = node;
        notImplemented((node as any).type);
      }
    }
  }
}
