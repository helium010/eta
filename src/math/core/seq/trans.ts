import { assert } from "../../utils";
import { stEq } from "../queries";
import { createExprTrans, createExprTransWithExtraArgs } from "../utils";
import { C as bC, Cr as bCr } from "../base/edits";
import { invalidArgument, randUID } from "../..";
import { replaceExprNode } from "../edits";

export const { T } = createExprTrans({});

export const { TwE } = createExprTransWithExtraArgs({
  expand: {
    extraArgCount: 1,
    fn: (econ, seq) => {
      let { expr } = econ;
      assert(seq.type === "InfiniteSequence");
      expr = replaceExprNode(expr, seq.uid, seq.elem);
      return {
        ...econ,
        expr: {
          type: "InfiniteSequence",
          uid: randUID(),
          elem: expr,
          index: seq.index,
        },
      };
    },
  },
});
