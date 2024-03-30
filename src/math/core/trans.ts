import { T as arithT, TwE as arithTwE } from "./arith/trans";
import { T as baseT, TwE as baseTwE } from "./base/trans";
import { T as equalT, TwE as equalTwE } from "./equal/trans";
import { T as linearT, TwE as linearTwE } from "./linear/trans";
import { T as matrixT, TwE as matrixTwE } from "./matrix/trans";
import { T as odeT } from "./ode/trans";
import { T as seqT, TwE as seqTwE } from "./seq/trans";
import { T as trigT } from "./trig/trans";
import { T as normT } from "./norm/trans";

export const T = {
  base: baseT,
  arith: arithT,
  ode: odeT,
  matrix: matrixT,
  linear: linearT,
  trig: trigT,
  equal: equalT,
  seq: seqT,
  norm: normT,
};

export const TwE = {
  base: baseTwE,
  arith: arithTwE,
  matrix: matrixTwE,
  equal: equalTwE,
  seq: seqTwE,
  linear: linearTwE,
};
