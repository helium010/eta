import "./style.css";
import { fromPairs, over, pull, toPairs } from "lodash";
import { useEffect, useState } from "react";

export const colors = {
  primary: ["#184A90", "#8ABBFF"],
  succeed: ["#165A36", "#72CA9B"],
  danger: ["#8E292C", "#FA999C"],

  text1: ["#FFFFFF", "#111418"],
  text2: ["#ABB3BF", "#656A71"],
  textSelected: ["#8ABBFF", "#215DB0"],
  textSucceed: ["#72CA9B", "#1C6E42"],
  textDanger: ["#FA999C", "#AC2F33"],
  textReplace: ["#7AE1D8", "#007067"],
  textAvaiable: ["#D0B090", "#af8358"],
  textTouch: ["#FF66A1", "#C22762"],

  bg1: ["#252A31", "#F6F7F9"],
  bg2: ["#383E47", "#DCE0E5"],
  bg3: ["#404854", "#D3D8DE"],
  bghlt: ["#80808040", "#80808040"],
  border: ["#5F6B7C", "#C5CBD3"],
  disabled: ["#738091", "#90A0B0"],

  insert: ["#5642A6", "#9881F3"],
  replace: ["#007067", "#7AE1D8"],
  avaiable: ["#5E4123", "#D0B090"],
} as const;

const constants = {
  fontFamily: "Roboto",
  size: 14,
} as const;

type Mode = "dark" | "light";

let currentMode: Mode = "dark";

export function setThemeMode(mode: Mode) {
  currentMode = mode;
  over(themeCallbacks)(mode);
}

const themeCallbacks: ((mode: Mode) => void)[] = [];

export function useTheme() {
  const [mode, setMode] = useState<Mode>(currentMode);

  useEffect(() => {
    function onChangingMode(mode: Mode) {
      setMode(mode);
    }
    themeCallbacks.push(onChangingMode);
    return () => {
      pull(themeCallbacks, onChangingMode);
    };
  });

  const colorsObj: Record<keyof typeof colors, string> = fromPairs(
    toPairs(colors).map(([k, v]) => [k, v[mode === "dark" ? 0 : 1]])
  ) as any;

  return { ...colorsObj, ...constants, mode };
}
