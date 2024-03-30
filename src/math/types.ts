/**
 * All exprs are immutable.
 */
export type Expr =
  | PlaceHolder
  | Symbol
  | Rational
  | SpecialConstant
  | SpecialFunction
  | Add
  | Mul
  | Pow
  | Fraction
  | Derivative
  | DefinedBy
  | Cases
  | Equal
  | Group
  | LogicOp
  | Compare
  | Matrix
  | Norm
  | Integral
  | ComplexConjugate
  | InfiniteSequence;

export type Econ = {
  readonly expr: Expr;
  readonly isyms: readonly ISym[];
};

export interface NodeBase {
  readonly uid: string;
  readonly parenthesis?: boolean;
}

export type ISymX<T extends ISym["type"]> = Extract<ISym, { type: T }>;

export type Domain =
  | {
      readonly type: "Z" | "R";
    }
  | { readonly type: "R-expr"; readonly expr: Expr };

export type ISym = {
  readonly name: string;
  readonly suid: string;
} & (
  | {
      readonly type: "variable";
      readonly domain: Domain;
    }
  | {
      readonly type: "function";
      readonly vars: readonly string[];
      readonly showVariables?: true;
    }
  | {
      readonly type: "constant";
      readonly domain: Domain;
    }
  | {
      readonly type: "indeterminate-constant";
      readonly domain: Domain;
    }
  | { readonly type: "generated-constant" }
  | {
      readonly type: "node-replacement";
      readonly replaced: Expr;
    }
  | { readonly type: "context" }
);

export interface Symbol extends NodeBase {
  readonly type: "Symbol";
  readonly isym: string;
}

export interface Rational extends NodeBase {
  readonly type: "Rational";
  readonly p: bigint;
  readonly q: bigint;
}

export interface SpecialConstant extends NodeBase {
  readonly type: "SpecialConstant";
  readonly name: "i" | "e" | "pi" | "infty";
}

export interface SpecialFunction extends NodeBase {
  readonly type: "SpecialFunction";
  readonly name: "sin" | "arcsin" | "cos" | "arccos" | "tan" | "det" | "ln";
  readonly var: Expr;
}

export interface PlaceHolder extends NodeBase {
  readonly type: "PlaceHolder";
}

export interface DefinedBy extends NodeBase {
  readonly type: "DefinedBy";
  readonly left: Expr;
  readonly right: Expr;
}

export interface Equal extends NodeBase {
  readonly type: "Equal";
  readonly left: Expr;
  readonly right: Expr;
}

export interface Compare extends NodeBase {
  readonly type: "Compare";
  readonly first: Expr;
  readonly rest: ["<" | ">" | "\\le" | "\\ge", Expr][];
}

export interface LogicOp extends NodeBase {
  readonly type: "LogicOp";
  readonly op: "\\land" | "\\lor";
  readonly subs: readonly Expr[];
}

export interface Cases extends NodeBase {
  readonly type: "Cases";
  readonly subs: { expr: Expr; cond: Expr }[];
}

export interface Group extends NodeBase {
  readonly type: "Group";
  readonly subs: readonly Expr[];
}

export interface Matrix extends NodeBase {
  readonly type: "Matrix";
  readonly subs: Expr[][];
}

export interface Add extends NodeBase {
  readonly type: "Add";
  readonly subs: readonly Expr[];
}

export interface Mul extends NodeBase {
  readonly type: "Mul";
  readonly subs: readonly Expr[];
  readonly displayOperator?: true;
}

export interface Pow extends NodeBase {
  readonly type: "Pow";
  readonly base: Expr;
  readonly exp: Expr;
}

export interface Fraction extends NodeBase {
  readonly type: "Fraction";
  readonly num: Expr;
  readonly den: Expr;
}

export interface Derivative extends NodeBase {
  readonly type: "Derivative";
  readonly func: Expr;
  readonly indep: Expr;
  readonly order: bigint;
}

export interface Norm extends NodeBase {
  readonly type: "Norm";
  readonly sub: Expr;
}

export interface ComplexConjugate extends NodeBase {
  readonly type: "ComplexConjugate";
  readonly sub: Expr;
}

export interface InfiniteSequence extends NodeBase {
  readonly type: "InfiniteSequence";
  readonly elem: Expr;
  readonly index: string;
}

export interface Integral extends NodeBase {
  readonly type: "Integral";
  readonly integrand: Expr;
  readonly var: Expr;
}
