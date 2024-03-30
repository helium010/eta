/**
 * @fileoverview Functions for making box. Refer to P63.
 */

// Copied and modified from katex-repo/src/buildCommon.js
// Copied and modified from katex-repo/src/functions/supsub.js

import { cloneDeep, first, fromPairs, initial, isNil, last, tail, toPairs } from "lodash";
import { assert, findDelim, neverReach, notImplemented } from "..";
import { notNil, oneOf } from "../utils";
import {
  getCharData,
  getP,
  getSpacingBetweenAtoms,
  stackAlwaysDelimiterSequence,
  stackLargeDelimiters,
  stackLargeDelimiterSequence,
  stackNeverDelimiters,
  stackNeverDelimiterSequence,
  TMSM,
} from "./fonts";
import { BoxMetric, FontName, TeXBox, TMS } from "./types";
import { d, h, w } from "./utils";

export function makeInteger(int: bigint, C: TMS) {
  return makeHAtomList(
    [...int.toString()].map(c => makeChar(c, "Main-Regular", C)),
    C
  );
}

export function makeSupSub(
  nucleus: TeXBox,
  sup: TeXBox | undefined,
  sub: TeXBox | undefined,
  C: TMS
) {
  // Rule 17.
  const delta = nucleus.metric.italic ?? 0;

  /** Nucleus box with kern delta. */
  const nc: TeXBox = {
    div: texDiv("Nucleus box with kern delta"),
    atomType: "Ord",
    metric: { ...nucleus.metric, width: nucleus.metric.width + delta },
  };
  nc.div.append(nucleus.div);
  applyMetricToDiv(nc);

  // Rule 18.
  if (isNil(sup) && isNil(sub)) {
    return nucleus;
  }

  // Rule 18a.
  let [u, v] = [0, 0];
  [u, v] = [h(nucleus) - getP("sigma18", C), d(nucleus) - getP("sigma19", C)];

  // Rule 18b.
  if (isNil(sup)) {
    const x = sub!;
    const shiftDown = Math.max(
      v,
      getP("sigma16", C),
      x.metric.height - (4 / 5) * Math.abs(getP("sigma5", C))
    );

    const newBoxDiv = texDiv("nucleus sup");
    const newMetric: BoxMetric = {
      height: nc.metric.height,
      width: nc.metric.width + x.metric.width + getP("scriptSpace", C),
      depth: Math.max(nc.metric.depth, x.metric.depth + shiftDown),
    };
    newBoxDiv.append(nc.div, x.div);
    nc.div.style.top = "0em";
    nc.div.style.left = "0em";
    x.div.style.left = `${nc.metric.width}em`;
    x.div.style.top = `${-x.metric.height + newMetric.height + shiftDown}em`;
    const newBox = { atomType: "Ord", div: newBoxDiv, metric: newMetric } as const;
    applyMetricToDiv(newBox);
    return newBox;
  }

  // Rule 18c.
  const x = sup;

  const p =
    C === TMS.D
      ? getP("sigma13", C)
      : C === TMSM.cramp[C]
      ? getP("sigma15", C)
      : getP("sigma14", C);
  const shiftUp = Math.max(u, p, x.metric.depth + (1 / 4) * Math.abs(getP("sigma5", C)));

  // Rule 18d.
  if (isNil(sub)) {
    const newBoxDiv = texDiv("nucleus sup");
    const newMetric: BoxMetric = {
      height: Math.max(nc.metric.height, x.metric.height + shiftUp),
      width: nc.metric.width + x.metric.width,
      depth: nc.metric.depth,
    };
    newBoxDiv.append(nc.div, x.div);
    nc.div.style.top = `${newMetric.height - nc.metric.height}em`;
    nc.div.style.left = "0em";
    x.div.style.left = `${nc.metric.width}em`;
    x.div.style.top = `${-x.metric.height + newMetric.height - shiftUp}em`;
    const newBox = { atomType: "Ord", div: newBoxDiv, metric: newMetric } as const;
    applyMetricToDiv(newBox);
    return newBox;
  }
  neverReach();
}

/**
 * Make sqrt according to Rule 11 in P439.
 */
export function makeSqrt(nucleus: TeXBox, C: TMS) {
  const theta = getP("xi8", C);
  const varphi = C > TMS.T ? getP("sigma5", C) : theta;
  let psi = theta + (1 / 4) * Math.abs(varphi);

  const minDelimiterHeight = h(nucleus) + d(nucleus) + psi + theta;
  const delim = makeDelim("\\surd", minDelimiterHeight, C);
  const rule = makeRule(theta, nucleus.metric.width, 0);

  {
    const diff = h(delim) + d(delim) - h(nucleus) - d(nucleus) - psi;
    if (diff > 0) {
      psi += (1 / 2) * diff;
    }
  }

  const height = theta + psi + nucleus.metric.height;
  const depth = delim.metric.height + delim.metric.depth - height;

  (delim.metric as any).height = height;
  (delim.metric as any).depth = depth;
  applyMetricToDiv(delim);

  const right = makeVListByOffset(
    height,
    depth,
    { box: rule, offset: 0 },
    { box: nucleus, offset: theta + psi }
  );
  return makeHAtomList([delim, right], C);
}

/**
 * Make fraction according to Rule 15 in P440-P441.
 *
 * The variables in this function are named literally after the symbols.
 */
export function makeFraction(numerator: TeXBox, denominator: TeXBox, C: TMS) {
  // Rule 15
  /** The thickness of the bar line. */
  const theta = getP("xi8", C);

  /** Box of numerator.  */
  let x = numerator;
  /** Box of denominator. */
  let z = denominator;
  const width = Math.max(w(x), w(z));
  x = makeCenter(x, width);
  z = makeCenter(z, width);

  // Rule 15b

  let u, v;
  if (C > TMS.T) {
    /** Shift up of numerator with respect to the current baseline. */
    u = getP("sigma8", C);
    /** Shift down of denominator. */
    v = getP("sigma11", C);
  } else {
    /** Shift up of numerator with respect to the current baseline. */
    u = getP("sigma9", C);
    /** Shift down of denominator. */
    v = getP("sigma12", C);
  }

  // Rule 15c is skipped because theta is always greater than 0 in our program.

  // Rule 15d
  /** Minimum clearance that will be tolerated between numerator or denominator and the bar line. */
  const varphi = C > TMS.T ? 3 * theta : theta;
  /** Current axis height; the middle of bar line will be placed at this height. */
  const a = getP("sigma22", C);

  // Rule 15e
  {
    const t = u - d(x) - (a + (1 / 2) * theta);
    if (t < varphi) {
      u += varphi - t;
    }
  }
  {
    const t = a - (1 / 2) * theta - (h(z) - v);
    if (t < varphi) {
      v += varphi - t;
    }
  }
  const height = h(x) + u;
  const depth = d(z) + v;

  const bar = makeRule(theta, width, 0);
  const midShift = a - (1 / 2) * theta;

  const res = makeVListByOffset(
    height,
    depth,
    { box: x, offset: -h(x) + height - u },
    { box: bar, offset: -h(bar) + height - midShift },
    { box: z, offset: -h(z) + height + v }
  );
  res.atomType = "Inner";
  return res;
}

/**
 * Refer to Rule 13 in 439.
 */
export function makeOp(op: "\\sum", sub: TeXBox, sup: TeXBox, C: TMS) {
  // Rule 13.
  let y = makeChar(op, "Size2-Regular", C);
  const yVShift = (1 / 2) * (h(y) - d(y)) - getP("sigma22", C);
  const delta = y.metric.italic ?? 0;

  // Rule 13a.
  let x = sup;
  let z = sub;

  /** Kern between x and y */
  const xyKern = Math.max(getP("xi9", C), getP("xi11", C) - d(x));
  /** Kern above x */
  const AxKern = getP("xi13", C);
  /** Kern between y and z */
  const yzKern = Math.max(getP("xi10", C), getP("xi12", C) - h(z));
  /** Ken below z */
  const zBKern = getP("xi13", C);

  const width = Math.max(w(x), w(y), w(z));
  x = makeCenter(x, width);
  y = makeCenter(y, width);
  z = makeCenter(z, width);
  // TODO: Horizontal shift is not implemented.
  const xHShift = (1 / 2) * delta;
  const zHShift = -(1 / 2) * delta;

  /** Height of box */
  const height = AxKern + h(x) + d(x) + xyKern + y.metric.height + yVShift;
  /** Depth of box */
  const depth = y.metric.depth - yVShift + yzKern + h(z) + d(z) + zBKern;
  // prettier-ignore
  const box = makeVListByOffset(height, depth, 
    { box: x, offset: AxKern }, 
    { box: y, offset: AxKern + h(x) + d(x) + xyKern },
    { box: z, offset: AxKern + h(x) + d(x) + xyKern + h(y) + h(z) + yzKern },
  );

  box.atomType = "Op";
  return box;
}

/**
 * Shift box vertically by `offset`.
 */
export function makeVShift(box: TeXBox, offset: number) {
  const height = box.metric.height + offset;
  // const depth = box.metric.width - offset;
  const div = texDiv("v-shift");
  const metric: BoxMetric = {
    ...box.metric,
    height,
  };
  div.append(box.div);
  box.div.style.top = `${offset}em`;
  const newBox: TeXBox = { atomType: box.atomType, div, metric };
  applyMetricToDiv(newBox);
  return newBox;
}

/**
 * Rule 5 in P438.
 */
export function makeHAtomList(boxes: TeXBox[], C: TMS) {
  let previousSubBox = boxes[0];
  let offset = 0;
  const hListArgs = [{ box: previousSubBox, offset }];
  if (previousSubBox.atomType === "Bin") previousSubBox.atomType = "Ord";
  offset += previousSubBox.metric.width;
  for (const subBox of tail(boxes)) {
    if (
      oneOf(previousSubBox.atomType, ["Bin", "Op", "Rel", "Open", "Punct"]) &&
      subBox.atomType === "Bin"
    )
      subBox.atomType = "Ord";
    offset += getSpacingBetweenAtoms(previousSubBox.atomType, subBox.atomType, C);
    hListArgs.push({ box: subBox, offset });
    offset += subBox.metric.width;
    previousSubBox = subBox;
  }
  return makeHListByOffset(hListArgs);
}

/**
 * Make a container box whose children are arranged horizontally. All children are aligned by baseline.
 */
export function makeHListByOffset(args: { box: TeXBox; offset: number }[]): TeXBox {
  let height = 0;
  let depth = 0;
  let width = 0;
  // Calculate metric of container box.
  for (const { box, offset } of args) {
    height = Math.max(height, box.metric.height);
    depth = Math.max(depth, box.metric.depth);
    width = offset + box.metric.width; // Container box width = offset of last box + width of last box. If array boxex is empty, width is 0.
  }

  // Create new container box.
  const div = texDiv("list-by-offset");
  // Place boxex into new box.
  for (const { box, offset } of args) {
    div.append(box.div);
    box.div.style.left = `${offset}em`;
    box.div.style.top = `${height - box.metric.height}em`; // Baseline from container box top = child box top + child box height.
  }
  const box: TeXBox = { div, metric: { height, depth, width }, atomType: "Ord" };
  applyMetricToDiv(box);
  return box;
}

/**
 * Make a box whose children are arranged vertically. All children are aligned by left.
 */
export function makeVListByOffset(
  height: number,
  depth: number,
  ...boxes: { box: TeXBox; offset: number }[]
): TeXBox {
  const div = texDiv("v-list");
  let width = 0;
  for (const { box, offset } of boxes) {
    width = Math.max(width, box.metric.width);
    div.append(box.div);
    box.div.style.top = `${offset}em`;
    box.div.style.left = "0em";
  }
  const box: TeXBox = {
    div,
    metric: { height, depth, width },
    atomType: "Ord",
  };
  applyMetricToDiv(box);
  return box;
}

/**
 * Make a box with innerBox in its horizontal center.
 */
export function makeCenter(innerBox: TeXBox, width: number): TeXBox {
  const div = texDiv();
  div.append(innerBox.div);
  innerBox.div.style.left = `${(width - innerBox.metric.width) / 2}em`;

  const box: TeXBox = { div, metric: { ...innerBox.metric, width }, atomType: "Ord" };
  applyMetricToDiv(box);
  return box;
}

/**
 * Refer to P219.
 */
export function makeRule(height: number, width: number, depth: number): TeXBox {
  const div = texDiv();

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("height", `${height + depth}em`);
  svg.setAttribute("width", `${width}em`);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("fill", "currentColor");

  svg.style.position = "absolute";
  svg.style.left = "0";
  svg.style.top = "0";

  const rule = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rule.setAttribute("width", `${width}em`);
  rule.setAttribute("height", `${height + depth}em`);
  rule.setAttribute("stroke-width", "0");
  svg.append(rule);

  div.append(svg);

  const box: TeXBox = {
    div,
    metric: { height, width, depth },
    atomType: "Ord",
  };
  applyMetricToDiv(box);
  return box;
}

export function makeSquare(
  height: number,
  width: number,
  depth: number,
  strokeWidth: number = 0.04
): TeXBox {
  const div = texDiv();

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("height", `${height + depth}em`);
  svg.setAttribute("width", `${width}em`);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("stroke", "currentColor");

  svg.style.position = "absolute";
  svg.style.left = "0";
  svg.style.top = "0";

  const rule = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rule.setAttribute("width", `${width}em`);
  rule.setAttribute("height", `${height + depth}em`);
  rule.setAttribute("stroke-width", `${strokeWidth}em`);
  rule.setAttribute("fill", "none");
  svg.append(rule);

  div.append(svg);

  const box: TeXBox = {
    div,
    metric: { height, width, depth },
    atomType: "Ord",
  };
  applyMetricToDiv(box);
  return box;
}

/**
 * Makes a character box after translation via the list of symbols in chars.ts.
 * Correctly pulls out metrics for the character.
 *
 * @param literalOrControlSequence A single char string such as 'a' or a control sequence such as '\alpha'.
 */
export function makeChar(literalOrControlSequence: string, fontName: FontName, C: TMS): TeXBox {
  const fontScale = TMSM.fontScale[C];
  const charData = getCharData(literalOrControlSequence);
  notNil(charData);
  const metric = cloneDeep(charData.metrics[fontName]);
  notNil(metric);

  const div = texDiv("char");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  div.append(svg);
  svg.append(g);

  div.style.height = `${metric.height + metric.depth}em`;
  div.style.width = `${metric.width}em`;

  svg.style.position = "absolute";
  svg.style.left = "-0.1em";
  svg.style.top = "-0.1em";
  svg.style.fontSize = `${fontScale * 100}%`;
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("width", `${0.2 + metric.width + (metric.italic ?? 0)}em`);
  svg.setAttribute("height", `${0.2 + metric.height + metric.depth}em`);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  text.textContent = String.fromCharCode(charData.charCode);
  text.setAttribute("y", `${metric.height}em`);
  text.style.fontFamily = `KaTeX_${fontName}`;

  g.appendChild(text);
  g.style.transform = "translate(0.1em, 0.1em)";

  let showDebugBox = false;
  // showDebugBox = true;
  if (showDebugBox) {
    const box = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    box.setAttribute("width", `${metric.width}em`);
    box.setAttribute("height", `${metric.height + metric.depth}em`);
    box.setAttribute("fill", "none");
    box.setAttribute("stroke", "#000000");

    box.setAttribute("stroke-width", "0.02em");

    const baseline = document.createElementNS("http://www.w3.org/2000/svg", "line");
    baseline.setAttribute("y1", `${metric.height}em`);
    baseline.setAttribute("x1", "0em");
    baseline.setAttribute("x2", `${metric.width}em`);
    baseline.setAttribute("y2", `${metric.height}em`);
    baseline.setAttribute("stroke-width", "0.02em");
    baseline.setAttribute("stroke", "#000000");

    g.append(baseline);
    g.append(box);
  }

  for (const [prop, value] of Object.entries(metric)) {
    (metric as any)[prop] = value * fontScale;
  }

  const box: TeXBox = { metric, div, atomType: charData.atomType };
  applyMetricToDiv(box);
  return box;
}

export function makeSymbol(name: string, C: TMS) {
  if (!name.includes("_")) {
    return makeSymbolChar(name, C);
  } else {
    let [nuc, sub] = name.split("_", 2);
    assert(first(sub) === "{" && last(sub) === "}");
    sub = sub.substring(1, sub.length - 1);
    const nucBox = makeSymbolChar(nuc, C);
    const subBox = makeSymbolChar(sub, TMSM.sub[C]);
    return makeSupSub(nucBox, undefined, subBox, C);
  }

  function makeSymbolChar(char: string, C: TMS) {
    let fontName: FontName = "Math-Italic";
    if (char === "\\hbar" || [..."0123456789"].includes(char)) {
      fontName = "Main-Regular";
    }

    return makeChar(char, fontName, C);
  }
}

/**
 * Rule 19 at P442
 */
export function makeDelims(
  left: "(" | "{" | "[" | "|" | ".",
  x: TeXBox,
  right: ")" | "}" | "]" | "|" | ".",
  C: TMS
) {
  const a = getP("sigma22", C);
  const delta = Math.max(h(x) - a, d(x) + a);
  /** Minimal height plus depth */
  const mhpd = Math.max(1.802 * delta, 2 * delta - 5 / getP("ptPerEm", C));
  const atoms: TeXBox[] = [x];
  if (left !== ".") {
    atoms.unshift(makeDelim(left, mhpd, C));
  }
  if (right !== ".") {
    atoms.push(makeDelim(right, mhpd, C));
  }
  return makeHAtomList(atoms, C);
}

export function makeDelim(delim: string, mhpd: number, C: TMS) {
  // Decide what sequence to use
  let sequence;
  if (stackNeverDelimiters.includes(delim)) {
    sequence = stackNeverDelimiterSequence;
  } else if (stackLargeDelimiters.includes(delim)) {
    sequence = stackLargeDelimiterSequence;
  } else {
    sequence = stackAlwaysDelimiterSequence;
  }

  const delimType = findDelim(delim, mhpd, sequence, C);

  let box: TeXBox;
  if (delimType.type === "small") {
    box = makeChar(delim, "Main-Regular", C);
  } else if (delimType.type === "large") {
    box = makeChar(delim, `Size${delimType.size}-Regular` as any, TMS.D);
  } else {
    box = makeChar(delim, `Size4-Regular`, C);
  }
  const delta = getP("sigma22", C);
  const bhpd = h(box) + d(box);
  (box.metric as any).height = bhpd / 2 + delta;
  (box.metric as any).depth = bhpd / 2 - delta;
  return box;
}

function texDiv(name?: string) {
  const div = document.createElement("div");
  div.style.position = "absolute";
  div.style.pointerEvents = "none";
  if (name) div.setAttribute("ETBN", name);
  return div;
}

function applyMetricToDiv(box: TeXBox) {
  box.div.style.height = `${box.metric.height + box.metric.depth}em`;
  box.div.style.width = `${box.metric.width}em`;
  box.div.setAttribute(
    "ETBM",
    `${JSON.stringify(fromPairs(toPairs(box.metric).map(([k, v]) => [k, v.toFixed(2)])))}`
  );
}
