import { invalidArgument } from "../math";
import { cloneDeep, isEqual, isNil, noop, pull, remove, sortBy, uniq, zip } from "lodash";

type ETAListenedEventType = "mousemove" | "mouseup" | "mousedown";
const mouseListeners: [ETAListenedEventType, number, (e: MouseEvent) => void][] = [];
export function addMouseListener(type: ETAListenedEventType, order: -1 | 0 | 1, fn: (e: MouseEvent) => void) {
  mouseListeners.push([type, order, fn]);
  mouseListeners.sort((a, b) => a[1] - b[1]);
  return () => removeMouseListener(fn);
}

export function removeMouseListener(fn: (e: MouseEvent) => void) {
  remove(mouseListeners, ([, , iterFn]) => iterFn === fn);
}

window.addEventListener("mousedown", e =>
  mouseListeners.slice().forEach(([type, , fn]) => type === "mousedown" && fn(e))
);
window.addEventListener("mousemove", e =>
  mouseListeners.slice().forEach(([type, , fn]) => type === "mousemove" && fn(e))
);
window.addEventListener("mouseup", e => mouseListeners.slice().forEach(([type, , fn]) => type === "mouseup" && fn(e)));

export const mousePos = { x: 0, y: 0 };

addMouseListener("mousemove", -1, e => Object.assign(mousePos, { x: e.pageX, y: e.pageY }));

// prettier-ignore
export type ETAHotKey = 
"A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I"|"J"|"K"|"L"|"M"|"N"|"O"|"P"|"Q"|"R"|"S"|"T"|"U"|"V"|"W"|"X"|"Y"|"Z"|
"0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"|
"ctrl"|"alt"|"shift"|"space";

const hotKeyListeners: [ETAHotKey[], () => void, () => void][] = [];

function keysEqual(a: readonly ETAHotKey[], b: readonly ETAHotKey[]) {
  return zip(sortBy(a), sortBy(b)).every(([x, y]) => x === y);
}

function findListenerIndexInHotKeyListeners(keys: readonly ETAHotKey[]) {
  for (const [i, [iterKeys]] of hotKeyListeners.entries()) {
    if (keys.length !== iterKeys.length) continue;
    if (keysEqual(keys, iterKeys)) {
      return i;
    }
  }
  return -1;
}

export function addHotKey(keys: ETAHotKey[], down: () => void, up?: () => void) {
  if (uniq(keys).length !== keys.length) invalidArgument(`Duplicated key in ${keys}`);

  const index = findListenerIndexInHotKeyListeners(keys);
  if (index !== -1) invalidArgument(`Hot key ${keys} already exists.`);

  hotKeyListeners.push([keys, down, up ?? noop]);
}

export function removeHotKey(keys: ETAHotKey[]) {
  const index = findListenerIndexInHotKeyListeners(keys);
  if (index === -1) {
    invalidArgument(`Hot key ${keys} doesn't exist.`);
  }

  hotKeyListeners.splice(index, 1);
}

function getKeyFromCode(code: string): ETAHotKey | undefined {
  if (code.startsWith("Digit")) {
    return code[5] as any;
  } else if (code.startsWith("Key")) {
    return code[3] as any;
  } else if (code.startsWith("Control")) {
    return "ctrl";
  } else if (code.startsWith("Alt")) {
    return "alt";
  } else if (code.startsWith("Shift")) {
    return "shift";
  } else if (code.startsWith("Space")) {
    return "space";
  } else {
    return;
  }
}

const pressedKeys: ETAHotKey[] = [];
let prevPressedKeys: ETAHotKey[] = [];
window.addEventListener("keydown", e => {
  if (e.metaKey) return;

  const key = getKeyFromCode(e.code);
  if (isNil(key)) return;

  if (!pressedKeys.includes(key)) pressedKeys.push(key);
  if (!isEqual(prevPressedKeys, pressedKeys)) {
    const index = findListenerIndexInHotKeyListeners(pressedKeys);
    if (index !== -1) {
      hotKeyListeners[index][1]();
    }
  }
  prevPressedKeys = cloneDeep(pressedKeys);
});

window.addEventListener("keyup", e => {
  const key = getKeyFromCode(e.code);
  if (isNil(key)) return;

  if (pressedKeys.includes(key)) pull(pressedKeys, key);
  if (!isEqual(prevPressedKeys, pressedKeys)) {
    const index = findListenerIndexInHotKeyListeners(prevPressedKeys);
    if (index !== -1) {
      hotKeyListeners[index][2]();
    }
  }
  prevPressedKeys = cloneDeep(pressedKeys);
});

window.addEventListener("blur", () => {
  pressedKeys.splice(0);
  if (!isEqual(prevPressedKeys, pressedKeys)) {
    const index = findListenerIndexInHotKeyListeners(prevPressedKeys);
    if (index !== -1) {
      hotKeyListeners[index][2]();
    }
  }
  prevPressedKeys = cloneDeep(pressedKeys);
});
