import { Matrix } from "../..";
import { createExprIs } from "../utils";

export const I = createExprIs({
  isSquare: (mat) => {
    if (mat.type !== "Matrix") return false;
    const m = mat.subs.length;
    const n = mat.subs[0].length;
    return m === n;
  },
});
