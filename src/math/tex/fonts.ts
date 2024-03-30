/**
 * @fileoverview This file defines control sequences of chars, metrics of chars and some other data about typesetting.
 */

// Copied and modified from
// - katex-repo/src/symbols.js
// - katex-repo/src/fontMetrics.js
// - katex-repo/src/Style.js
// - katex-repo/src/delimiter.js

import { Mutable } from "utility-types";
import { neverReach } from "..";
import fontMetricsData from "./font-data/fontMetricsData";
import { AtomType, CharData, CharMetrics, FontName, MainOrAms, TMS } from "./types";

/**
 * Map from literal and control sequence to char data.
 */
const chars: {
  readonly [literalOrControlSequenceOrCharCode: string | number]: CharData | undefined;
} = {};

export function getCharData(literalOrControlSequence: string) {
  return chars[literalOrControlSequence];
}

/**
 * Define a char.
 *
 */
function defineChar(
  mainOrAms: MainOrAms,
  atomType: AtomType,
  charCode: number,
  literalOrControlSequence: string
) {
  // Find metric data of this char.
  const metrics: CharMetrics = {};
  for (const [font, metricsData] of Object.entries(fontMetricsData) as any) {
    if (metricsData.hasOwnProperty(charCode)) {
      const data = metricsData[charCode];
      metrics[font as FontName] = {
        depth: data[0],
        height: data[1],
        italic: data[2],
        skew: data[3],
        width: data[4],
      };
    }
  }

  (chars as Mutable<typeof chars>)[literalOrControlSequence] = {
    font: mainOrAms,
    atomType,
    charCode,
    metrics,
  };
  (chars as Mutable<typeof chars>)[charCode] = chars[literalOrControlSequence];
  (chars as Mutable<typeof chars>)[String.fromCharCode(charCode)] = chars[literalOrControlSequence];
}

// Latin letters.
for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz") {
  defineChar("main", "Ord", ch.charCodeAt(0), ch);
}

// Numbers
for (const ch of "0123456789") {
  defineChar("main", "Ord", ch.charCodeAt(0), ch);
}

// Greek letters.
defineChar("main", "Ord", 0x03b1, "\\alpha");
defineChar("main", "Ord", 0x03b2, "\\beta");
defineChar("main", "Ord", 0x03b3, "\\gamma");
defineChar("main", "Ord", 0x03b4, "\\delta");
defineChar("main", "Ord", 0x03f5, "\\epsilon");
defineChar("main", "Ord", 0x03b6, "\\zeta");
defineChar("main", "Ord", 0x03b7, "\\eta");
defineChar("main", "Ord", 0x03b8, "\\theta");
defineChar("main", "Ord", 0x03b9, "\\iota");
defineChar("main", "Ord", 0x03ba, "\\kappa");
defineChar("main", "Ord", 0x03bb, "\\lambda");
defineChar("main", "Ord", 0x03bc, "\\mu");
defineChar("main", "Ord", 0x03bd, "\\nu");
defineChar("main", "Ord", 0x03be, "\\xi");
defineChar("main", "Ord", 0x03bf, "\\omicron");
defineChar("main", "Ord", 0x03c0, "\\pi");
defineChar("main", "Ord", 0x03c1, "\\rho");
defineChar("main", "Ord", 0x03c3, "\\sigma");
defineChar("main", "Ord", 0x03c4, "\\tau");
defineChar("main", "Ord", 0x03c5, "\\upsilon");
defineChar("main", "Ord", 0x03d5, "\\phi");
defineChar("main", "Ord", 0x03c7, "\\chi");
defineChar("main", "Ord", 0x03c8, "\\psi");
defineChar("main", "Ord", 0x03c9, "\\omega");
defineChar("main", "Ord", 0x03b5, "\\varepsilon");
defineChar("main", "Ord", 0x03d1, "\\vartheta");
defineChar("main", "Ord", 0x03d6, "\\varpi");
defineChar("main", "Ord", 0x03f1, "\\varrho");
defineChar("main", "Ord", 0x03c2, "\\varsigma");
defineChar("main", "Ord", 0x03c6, "\\varphi");

// Special letters
defineChar("main", "Ord", 0x210f, "\\hbar");
defineChar("main", "Ord", 0x221e, "\\infty");

// Binary operators.
defineChar("main", "Bin", 0x2217, "*");
defineChar("main", "Bin", 0x002b, "+");
defineChar("main", "Bin", 0x2212, "-");
// defineChar("main", "Bin", 0x22c5, "\\cdot" );
// defineChar("main", "Bin", 0x2218, "\\circ");
defineChar("main", "Bin", 0x00f7, "\\div");
// defineChar("main", "Bin", 0x00b1, "\\pm" );
defineChar("main", "Bin", 0x00d7, "\\times");
// defineChar("main", "Bin", 0x2229, "\\cap" );
// defineChar("main", "Bin", 0x222a, "\\cup" );
// defineChar("main", "Bin", 0x2216, "\\setminus");
defineChar("main", "Bin", 0x2227, "\\land");
defineChar("main", "Bin", 0x2228, "\\lor");
// defineChar("main", "Bin", 0x2227, "\\wedge" );
// defineChar("main", "Bin", 0x2228, "\\vee" );

// Unary operators.
defineChar("main", "Ord", 0xac, "\\neg");

// Relations.
defineChar("main", "Rel", 0x2208, "\\in");
defineChar("main", "Rel", 0x2286, "\\subseteq");
defineChar("main", "Rel", 0x3a, ":");
defineChar("main", "Rel", 0x3d, "=");
defineChar("main", "Rel", 0x2264, "\\le");
defineChar("main", "Rel", 0x2265, "\\ge");
defineChar("main", "Rel", 0x3c, "\\lt");
defineChar("main", "Rel", 0x3e, "\\gt");

// Arrow Symbols
defineChar("main", "Rel", 0x21d2, "\\Rightarrow");
defineChar("main", "Rel", 0x27f9, "\\Longrightarrow");
defineChar("main", "Rel", 0x21d4, "\\Leftrightarrow");
defineChar("main", "Rel", 0x27fa, "\\Longleftrightarrow");

// Punctuations.
defineChar("main", "Punct", 0x2c, ",");
// defineChar("main", "Punct", 0x3b, ";");
// defineChar("main", "Punct", 0x002e, "\\ldotp");
// defineChar("main", "Punct", 0x22c5, "\\cdotp");

// Delimiters.
defineChar("main", "Open", 0x7b, "\\lbrace"); // {
defineChar("main", "Close", 0x7d, "\\rbrace"); // }
defineChar("main", "Open", 0x5b, "\\lbrack"); // [
defineChar("main", "Close", 0x5d, "\\rbrack"); // ]
defineChar("main", "Open", 0x28, "\\lparen"); // (
defineChar("main", "Close", 0x29, "\\rparen"); // )
defineChar("main", "Ord", 0x7c, "|");
defineChar("main", "Ord", 0x221a, "\\surd"); // √

// Statements.
defineChar("main", "Ord", 0x2200, "\\forall");
defineChar("main", "Ord", 0x2203, "\\exists");

// Specials.
defineChar("ams", "Ord", 0x25a1, "\\square");

// Large operators.
defineChar("main", "Op", 0x222b, "\\int");
defineChar("main", "Op", 0x2211, "\\sum");

// In TeX, there are actually three sets of dimensions, one for each of
// textstyle (size index 5 and higher: >=9pt), scriptstyle (size index 3 and 4:
// 7-8pt), and scriptscriptstyle (size index 1 and 2: 5-6pt).  These are
// provided in the the arrays below, in that order.
//
// The font metrics are stored in fonts cmsy10, cmsy7, and cmsy5 respsectively.
// This was determined by running the following script:
//
//    latex -interaction=nonstopmode \
//    '\documentclass{article}\usepackage{amsmath}\begin{document}' \
//    '$a$ \expandafter\show\the\textfont2' \
//    '\expandafter\show\the\scriptfont2' \
//    '\expandafter\show\the\scriptscriptfont2' \
//    '\stop'
//
// The metrics themselves were retreived using the following commands:
//
//    tftopl cmsy10
//    tftopl cmsy7
//    tftopl cmsy5
//
// The output of each of these commands is quite lengthy.  The only part we
// care about is the FONTDIMEN section. Each value is measured in EMs.
const parameters = {
  // slant: [0.25, 0.25, 0.25], // sigma1
  // space: [0.0, 0.0, 0.0], // sigma2
  // stretch: [0.0, 0.0, 0.0], // sigma3
  // shrink: [0.0, 0.0, 0.0], // sigma4

  sigma5: [0.431, 0.431, 0.431], // xHeight
  sigma6: [1.0, 1.171, 1.472], // quad
  sigma7: [0.0, 0.0, 0.0], // extraSpace
  sigma8: [0.677, 0.732, 0.925], // num1
  sigma9: [0.394, 0.384, 0.387], // num2
  sigma10: [0.444, 0.471, 0.504], // num3
  sigma11: [0.686, 0.752, 1.025], // denom1
  sigma12: [0.345, 0.344, 0.532], // denom2
  sigma13: [0.413, 0.503, 0.504], // sup1
  sigma14: [0.363, 0.431, 0.404], // sup2
  sigma15: [0.289, 0.286, 0.294], // sup3
  sigma16: [0.15, 0.143, 0.2], // sub1
  sigma17: [0.247, 0.286, 0.4], // sub2
  sigma18: [0.386, 0.353, 0.494], // supDrop
  sigma19: [0.05, 0.071, 0.1], // subDrop
  sigma20: [2.39, 1.7, 1.98], // delim1
  sigma21: [1.01, 1.157, 1.42], // delim2
  sigma22: [0.25, 0.25, 0.25], // axisHeight

  // These font metrics are extracted from TeX by using tftopl on cmex10.tfm;
  // they correspond to the font parameters of the extension fonts (family 3).
  // See the TeXbook, page 441. In AMSTeX, the extension fonts scale; to
  // match cmex7, we'd use cmex7.tfm values for script and scriptscript
  // values.

  xi8: [0.04, 0.049, 0.049], // defaultRuleThickness
  xi9: [0.111, 0.111, 0.111], // bigOpSpacing1
  xi10: [0.166, 0.166, 0.166], // bigOpSpacing2
  xi11: [0.2, 0.2, 0.2], // bigOpSpacing3
  xi12: [0.6, 0.611, 0.611], // bigOpSpacing4
  xi13: [0.1, 0.143, 0.143], // bigOpSpacing5

  // The \sqrt rule width is taken from the height of the surd character.
  // Since we use the same font at all sizes, this thickness doesn't scale.
  // sqrtRuleThickness: [0.04, 0.04, 0.04],

  // This value determines how large a pt is, for metrics which are defined
  // in terms of pts.
  // This value is also used in katex.less; if you change it make sure the
  // values match.
  ptPerEm: [10.0, 10.0, 10.0],

  // The space between adjacent `|` columns in an array definition. From
  // `\showthe\doublerulesep` in LaTeX. Equals 2.0 / ptPerEm.
  // doubleRuleSep: [0.2, 0.2, 0.2],

  // The width of separator lines in {array} environments. From
  // `\showthe\arrayrulewidth` in LaTeX. Equals 0.4 / ptPerEm.
  // arrayRuleWidth: [0.04, 0.04, 0.04],

  // Two values from LaTeX source2e:
  // fboxsep: [0.3, 0.3, 0.3], //       3 pt / ptPerEm
  // fboxrule: [0.04, 0.04, 0.04], // 0.4 pt / ptPerEm

  /**
   * P344 `\scriptspace=0.5pt`.
   *
   * Point per em is 10. Value in em = value in pt / pt per em.
   */
  scriptSpace: [0.05, 0.05, 0.05],
};

/**
 * Get the paramters in P443.
 */
export function getP(parameterName: keyof typeof parameters, c: TMS): number {
  let mul;
  let indexInParameters: 0 | 1 | 2;
  if (c >= TMS.Tc) {
    indexInParameters = 0;
    mul = 1;
  } else if (c >= TMS.Sc) {
    indexInParameters = 1;
    mul = 0.7;
  } else {
    indexInParameters = 2;
    mul = 0.5;
  }
  return mul * parameters[parameterName][indexInParameters];
}

/**
 * Rule for spacing between atoms.
 *
 * Refer to P170.
 */
const spacingRule = [
  /* L \ R     Ord    Op     Bin    Rel    Open   Close  Punct  Inner */
  /* Ord   */ [" 0 ", " 1 ", "(2)", "(3)", " 0 ", " 0 ", " 0 ", "(1)"],
  /* Op    */ [" 1 ", " 1 ", " * ", "(3)", " 0 ", " 0 ", " 0 ", "(1)"],
  /* Bin   */ ["(2)", "(2)", " * ", " * ", "(2)", " * ", " * ", "(2)"],
  /* Rel   */ ["(3)", "(3)", " * ", " 0 ", "(3)", " 0 ", " 0 ", "(3)"],
  /* Open  */ [" 0 ", " 0 ", " * ", " 0 ", " 0 ", " 0 ", " 0 ", " 0 "],
  /* Close */ [" 0 ", " 1 ", "(2)", "(3)", " 0 ", " 0 ", " 0 ", "(1)"],
  /* Punct */ ["(1)", "(1)", " * ", "(1)", "(1)", "(1)", "(1)", "(1)"],
  /* Inner */ ["(1)", " 1 ", "(2)", "(3)", "(1)", " 0 ", "(1)", "(1)"],
] as const;
const spacingRuleIndex = ["Ord", "Op", "Bin", "Rel", "Open", "Close", "Punct", "Inner"] as const;

/**
 * Get the spacing between atoms. Return in unit EM.
 *
 * Refer to Rule 2 in P438, Rule 20 in P442. And also P345, P170.
 */
export function getSpacingBetweenAtoms(left: AtomType, right: AtomType, C: TMS): number {
  const leftIndex = spacingRuleIndex.indexOf(left);
  const rightIndex = spacingRuleIndex.indexOf(right);
  const rule = spacingRule[leftIndex][rightIndex];
  switch (rule) {
    case " 0 ":
    case " * ":
      return ruleToEM(0);
    case " 1 ":
      return ruleToEM(1);
    case "(1)":
      return ruleToEM(C >= TMS.Tc ? 1 : 0);
    case "(2)":
      return ruleToEM(C >= TMS.Tc ? 2 : 0);
    case "(3)":
      return ruleToEM(C >= TMS.Tc ? 3 : 0);
  }
  function ruleToEM(spacing: 0 | 1 | 2 | 3): number {
    if (spacing === 0) return 0;
    return (spacing + 2) * (1 / 18) * getP("sigma6", C);
  }
}

/**
 * TeX Math Style Math
 *
 * Some maps from TeX math style.
 */
export namespace TMSM {
  export const sup = [TMS.SSc, TMS.SS, TMS.SSc, TMS.SS, TMS.Sc, TMS.S, TMS.Sc, TMS.S] as const;
  export const sub = [TMS.SSc, TMS.SSc, TMS.SSc, TMS.SSc, TMS.Sc, TMS.Sc, TMS.Sc, TMS.Sc] as const;

  export const fracNum = [TMS.SSc, TMS.SS, TMS.SSc, TMS.SS, TMS.Sc, TMS.S, TMS.Tc, TMS.T] as const;
  export const fracDen = [
    TMS.SSc,
    TMS.SSc,
    TMS.SSc,
    TMS.SSc,
    TMS.Sc,
    TMS.Sc,
    TMS.Tc,
    TMS.Tc,
  ] as const;

  export const cramp = [TMS.SSc, TMS.SSc, TMS.Sc, TMS.Sc, TMS.Tc, TMS.Tc, TMS.Dc, TMS.Dc] as const;
  export const fontScale = [0.5, 0.5, 0.7, 0.7, 1, 1, 1, 1] as const;
  export const size = [3, 3, 2, 2, 1, 1, 0, 0] as const;
}

/**
 * There are three different sequences of delimiter sizes that the delimiters
 * follow depending on the kind of delimiter. This is used when creating custom
 * sized delimiters to decide whether to create a small, large, or stacked
 * delimiter.
 *
 * In real TeX, these sequences aren't explicitly defined, but are instead
 * defined inside the font metrics. Since there are only three sequences that
 * are possible for the delimiters that TeX defines, it is easier to just encode
 * them explicitly here.
 */

type Delimiter =
  | { type: "small"; style: TMS }
  | { type: "large"; size: 1 | 2 | 3 | 4 }
  | { type: "stack" };

// Delimiters that never stack try small delimiters and large delimiters only
export const stackNeverDelimiterSequence = [
  { type: "small", style: TMS.SS },
  { type: "small", style: TMS.S },
  { type: "small", style: TMS.T },
  { type: "large", size: 1 },
  { type: "large", size: 2 },
  { type: "large", size: 3 },
  { type: "large", size: 4 },
] as const;

// Delimiters that always stack try the small delimiters first, then stack
export const stackAlwaysDelimiterSequence = [
  { type: "small", style: TMS.SS },
  { type: "small", style: TMS.S },
  { type: "small", style: TMS.T },
  { type: "stack" },
] as const;

// Delimiters that stack when large try the small and then large delimiters, and
// stack afterwards
export const stackLargeDelimiterSequence = [
  { type: "small", style: TMS.SS },
  { type: "small", style: TMS.S },
  { type: "small", style: TMS.T },
  { type: "large", size: 1 },
  { type: "large", size: 2 },
  { type: "large", size: 3 },
  { type: "large", size: 4 },
  { type: "stack" },
] as const;

// There are three kinds of delimiters, delimiters that stack when they become
// too large
export const stackLargeDelimiters = [
  "(",
  "\\lparen",
  ")",
  "\\rparen",
  "[",
  "\\lbrack",
  "]",
  "\\rbrack",
  "\\{",
  "\\lbrace",
  "\\}",
  "\\rbrace",
  "\\lfloor",
  "\\rfloor",
  "\u230a",
  "\u230b",
  "\\lceil",
  "\\rceil",
  "\u2308",
  "\u2309",
  "\\surd",
];

// delimiters that always stack
export const stackAlwaysDelimiters = [
  "\\uparrow",
  "\\downarrow",
  "\\updownarrow",
  "\\Uparrow",
  "\\Downarrow",
  "\\Updownarrow",
  "|",
  "\\|",
  "\\vert",
  "\\Vert",
  "\\lvert",
  "\\rvert",
  "\\lVert",
  "\\rVert",
  "\\lgroup",
  "\\rgroup",
  "\u27ee",
  "\u27ef",
  "\\lmoustache",
  "\\rmoustache",
  "\u23b0",
  "\u23b1",
];

// and delimiters that never stack
export const stackNeverDelimiters = [
  "<",
  ">",
  "\\langle",
  "\\rangle",
  "/",
  "\\backslash",
  "\\lt",
  "\\gt",
];

/**
 * Get the font used in a delimiter based on what kind of delimiter it is.
 */
export const delimTypeToFont = function (type: Delimiter): FontName {
  if (type.type === "small") {
    return "Main-Regular";
  } else if (type.type === "large") {
    return ("Size" + type.size + "-Regular") as any;
  } else if (type.type === "stack") {
    return "Size4-Regular";
  } else {
    neverReach();
  }
};

/**
 * Traverse a sequence of types of delimiters to decide what kind of delimiter
 * should be used to create a delimiter of the given height+depth.
 */
export const findDelim = function (
  delim: string,
  minHeightDepth: number,
  sequence: readonly Delimiter[],
  C: TMS
): Delimiter {
  // Here, we choose the index we should start at in the sequences. In smaller
  // sizes (which correspond to larger numbers in style.size) we start earlier
  // in the sequence. Thus, scriptscript starts at index 3-3=0, script starts
  // at index 3-2=1, text starts at 3-1=2, and display starts at min(2,3-0)=2
  const start = Math.min(2, 3 - TMSM.size[C]);
  for (let i = start; i < sequence.length; i++) {
    if (sequence[i].type === "stack") {
      // This is always the last delimiter, so we just break the loop now.
      break;
    }
    const metrics = getCharData(delim)!.metrics[delimTypeToFont(sequence[i])]!;
    let heightDepth = metrics.height + metrics.depth;

    // Small delimiters are scaled down versions of the same font, so we
    // account for the style change size.
    if (sequence[i].type === "small") {
      heightDepth *= TMSM.fontScale[C];
    }

    // Check if the delimiter at this size works for the given height.
    if (heightDepth > minHeightDepth) {
      return sequence[i];
    }
  }

  // If we reached the end of the sequence, return the last sequence element.
  return sequence[sequence.length - 1];
};
