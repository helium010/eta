import { cloneDeep, inRange, isNil } from "lodash";
import React, { useEffect, useRef } from "react";

export function notImplemented(): never {
  throw new Error("Not implemeneted.");
}

export function notNil<T>(obj: T): asserts obj is NonNullable<T> {
  if (isNil(obj)) {
    throw Error(`Not Non Null.`);
  }
}

/**
 * Determines whether {@link x} equals to one of {@link X}.
 */
export function oneOf<T, K extends T>(x: T, X: readonly K[]) {
  for (const y of X) {
    if (x === y) return true;
  }
  return false;
}

export function divRef(div: HTMLDivElement): React.RefCallback<HTMLDivElement> {
  return ref => {
    if (ref) {
      ref.innerHTML = "";
      ref.append(div);
    }
  };
}

export function switchOn<X extends string, R>(x: X, map: { [key in X]: R }): R {
  return map[x];
}

/**
 * Find nearest item from {@link pos} in {@link items}. Item in items is transformed to Postion by {@link mapPos}
 */
export function nearest<T>(pos: Position, items: readonly T[], mapPos: (arg: T) => Position): T | null {
  let nearestItem = null;
  let minDis = Number.MAX_VALUE;
  for (const iterItem of items) {
    const { x, y } = mapPos(iterItem);
    const iterItemDis = distance({ x, y }, { x: pos.x, y: pos.y });
    if (iterItemDis < minDis) {
      nearestItem = iterItem;
      minDis = iterItemDis;
    }
  }
  return nearestItem;
}

export function regionCenter(region: Region): Position {
  const { left, right, top, bottom } = region;
  return { x: (left + right) / 2, y: (top + bottom) / 2 };
}

/** Push element into array if it doesn't already exist. */
export function pushUnique<T>(array: T[], ...elems: T[]) {
  for (const elem of elems) {
    if (!array.includes(elem)) array.push(elem);
  }
}

/**
 * Return all possible pairs of combinations of elements from two array.
 *
 * @example
 * crossProduct([1, 2], [3, 4]) // => [[1,3], [1,4], [2,3], [2,4]]
 */
export function crossProduct<A, B>(a: A[], b: B[]) {
  const result: [A, B][] = [];
  for (const x of a) {
    for (const y of b) {
      result.push([x, y]);
    }
  }
  return result;
}

export type Position = { x: number; y: number };
export type Region = { left: number; right: number; top: number; bottom: number };

export function distance(a: Position, b: Position) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function inRegion(pos: Position, region: Region) {
  return inRange(pos.x, region.left, region.right) && inRange(pos.y, region.top, region.bottom);
}

export function regionInsideRegion(inner: Region, outer: Region) {
  return (
    inner.left >= outer.left && inner.right <= outer.right && inner.top >= outer.top && inner.bottom <= outer.bottom
  );
}

export function translateRegion(region: Region, translate: Position): Region {
  return {
    left: region.left + translate.x,
    right: region.right + translate.x,
    top: region.top + translate.y,
    bottom: region.bottom + translate.y,
  };
}

export function positionAdd(a: Position, b: Position): Position {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function modNumber(n: number, m: number) {
  return ((n % m) + m) % m;
}

export const cd = cloneDeep;

export function over(...fns: (() => void)[]) {
  return () => fns.forEach(fn => fn());
}

export function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export type Updater<T> = (old: T) => T;

export type SetUpdater<T> = (updater: Updater<T>) => void;
