import fontMetricsData from "./font-data/fontMetricsData";

export type CssStyle = Partial<CSSStyleDeclaration>;

/**
 * Tex Math Style.
 * 
 * TeX has eight different styles for formulas.
 *
 * These symbols are defined at P140.
 *
 * These symbols are listed in reverse order as in P140 for the purpose of matching the
 * relations in P437, which is D > Dc > T > Tc > S > Sc > SS > SSc. This relation provides
 * convenience when typesetting a math list according to the rules defined in P438.
 */
export enum TMS {
  SSc,
  SS,
  Sc,
  S,
  Tc,
  T,
  Dc,
  D,
}

/**
 * TeX's box. Refer to P63 and P64.
 *
 * In addition to measurements defined in TeX, an span is used to hold the HTML element for this box.
 */
export type TeXBox = {
  metric: BoxMetric;
  div: HTMLDivElement;
  atomType: AtomType;
};

/**
 * Font names used in CSS. Defined in src/tex/frozen/fonts and src/tex/frozen/fonts.less.
 */
export type FontName = keyof typeof fontMetricsData;

/**
 * Dimensions for measuring box. Refer to P63 and P429.
 */
export type BoxMetric = Readonly<{
  height: number;
  width: number;
  depth: number;
  italic?: number;
  skew?: number;
}>;

export type MainOrAms = "main" | "ams";
export type AtomType = "Ord" | "Op" | "Bin" | "Rel" | "Open" | "Close" | "Punct" | "Inner";
export type CharMetrics = Partial<Record<FontName, BoxMetric>>;

export type CharData = Readonly<{
  font: MainOrAms;
  atomType: AtomType;
  charCode: number;
  metrics: CharMetrics;
}>;
