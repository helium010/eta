import { TeXBox } from "../math";
import { flip, shift, useFloating } from "@floating-ui/react-dom";
import { castArray, isNil } from "lodash";
import { FC, ReactElement, useEffect, useRef, useState } from "react";
import { addHotKey, addMouseListener, ETAHotKey, removeHotKey } from "./globals";
import { useTheme } from "./theme";
import { distance, divRef, over } from "./utils";

export function DropdownButton(props: { icon: ReactElement; content: ReactElement }) {
  const theme = useTheme();
  const { x, y, reference, floating, strategy } = useFloating({
    placement: "bottom",
    middleware: [shift()],
  });
  const [open, setOpen] = useState(false);

  useEffect(() => addMouseListener("mouseup", 1, e => setTimeout(() => open && setOpen(false))));

  return (
    <>
      <div
        ref={reference}
        className="clickable"
        style={{
          padding: theme.size / 4,
          display: "flex",
        }}
        onClick={() => setOpen(true)}
      >
        {props.icon}
      </div>
      {open && (
        <div
          ref={floating}
          style={{
            position: strategy,
            top: y ?? "",
            left: x ?? "",
            background: theme.bg2,
            zIndex: 2,
          }}
        >
          {props.content}
        </div>
      )}
    </>
  );
}

export function DropdownSelect<T extends string>(props: {
  children: ReactElement;
  options: T[];
  open: boolean;
  select: (value: T) => void;
  close?: () => void;
}) {
  const theme = useTheme();
  const { x, y, reference, floating, strategy } = useFloating({
    placement: "bottom",
    middleware: [flip(), shift()],
  });

  useEffect(() => addMouseListener("mouseup", 1, e => setTimeout(() => props.open && props.close?.())));

  return (
    <>
      <div ref={reference}>{props.children}</div>
      {props.open && (
        <div
          ref={floating}
          style={{ position: strategy, top: y ?? "", left: x ?? "", background: theme.bg2, zIndex: 2 }}
        >
          {props.options.map((opt, i) => (
            <div
              key={i}
              className="clickable"
              style={{ display: "flex", padding: theme.size / 2, whiteSpace: "pre" }}
              onClick={e => {
                props.select(opt);
                props.close?.();
                e.stopPropagation();
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function DropdownSelectButton<T extends string>(props: {
  icon: ReactElement;
  options: T[];
  select: (value: T) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  useEffect(() => addMouseListener("mouseup", 1, e => setTimeout(() => open && setOpen(false))));

  return (
    <DropdownSelect options={props.options} open={open} close={() => setOpen(false)} select={props.select}>
      <div
        className="clickable"
        style={{
          padding: theme.size / 4,
          display: "flex",
        }}
        onClick={() => setOpen(true)}
      >
        {props.icon}
      </div>
    </DropdownSelect>
  );
}

export const DiscreteSwitch: FC<{
  min?: bigint;
  max?: bigint;
  value: bigint;
  setValue: (newValue: bigint) => void;
}> = props => {
  const greaterThanMin = isNil(props.min) || props.value > props.min;
  const lessThanMax = isNil(props.max) || props.value < props.max;
  const theme = useTheme();
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
      <div
        className={greaterThanMin ? "clickable" : ""}
        style={{ display: "flex", flex: "1 1", justifyContent: "center" }}
        onClick={() => greaterThanMin && props.setValue(props.value - 1n)}
      >
        <IconChevronLeft color={greaterThanMin ? undefined : theme.disabled} />
      </div>
      <div>{props.value.toString()}</div>
      <div
        className={lessThanMax ? "clickable" : ""}
        style={{ display: "flex", flex: "1 1", justifyContent: "center" }}
        onClick={() => lessThanMax && props.setValue(props.value + 1n)}
      >
        <IconChevronRight />
      </div>
    </div>
  );
};

export const HotKeyButton: FC<{ onClick: () => void; hotKey: ETAHotKey | ETAHotKey[] }> = props => {
  const theme = useTheme();
  const [down, setDown] = useState(false);
  useEffect(() => {
    const hotKey = castArray(props.hotKey);
    addHotKey(
      hotKey,
      () => {
        props.onClick();
        setDown(true);
      },
      () => {
        setDown(false);
      }
    );
    return () => removeHotKey(hotKey);
  });
  return (
    <div
      className="clickable"
      style={{ display: "flex", background: down ? theme.bghlt : "", padding: theme.size / 4 }}
      onClick={props.onClick}
    >
      {props.children}
    </div>
  );
};

export const Input: FC<{
  value: string;
  setValue: (value: string) => void;
  validate: (value: string) => boolean;
}> = props => {
  const theme = useTheme();
  const prevPropsValue = useRef(props.value);
  const [value, setValue] = useState(props.value);
  const [valid, setValid] = useState(props.validate(props.value));
  useEffect(() => {
    if (props.value !== prevPropsValue.current) {
      setValue(props.value);
      setValid(props.validate(props.value));
      prevPropsValue.current = props.value;
    }
  }, [props]);
  return (
    <input
      style={{
        color: theme.text1,
        backgroundColor: valid ? theme.bg2 : theme.danger,
      }}
      value={value}
      onFocus={e => e.target.select()}
      onChange={e => {
        const newValue = e.target.value;
        setValue(newValue);
        if (props.validate(newValue)) {
          props.setValue(newValue);
          setValid(true);
        } else {
          setValid(false);
        }
      }}
    />
  );
};

export const FloatingWindow: FC<{
  show?: boolean;
  initialPosition?: { left: number; top: number };
  close?: () => void;
}> = props => {
  const theme = useTheme();
  const layoutRef = useRef<HTMLDivElement>(null);
  const relativePosFromMouseToTLCorner = useRef<{ rx: number; ry: number } | null>(null);
  useEffect(() =>
    addMouseListener("mousemove", 0, e => {
      if (!isNil(relativePosFromMouseToTLCorner.current)) {
        const { rx, ry } = relativePosFromMouseToTLCorner.current;
        const mx = e.pageX;
        const my = e.pageY;
        layoutRef.current!.style.left = `${mx + rx}px`;
        layoutRef.current!.style.top = `${my + ry}px`;
      }
    })
  );
  useEffect(() =>
    addMouseListener("mouseup", 1, () => {
      relativePosFromMouseToTLCorner.current = null;
    })
  );
  return (
    <div
      ref={layoutRef}
      style={{
        visibility: props.show ?? true ? "visible" : "hidden",
        position: "absolute",
        border: `solid 1px ${theme.border}`,
        background: theme.bg1,
        zIndex: 1,
        ...(props.initialPosition ?? { left: 0, top: 0 }),
      }}
    >
      <div
        style={{
          height: theme.size / 2,
          background: theme.bg3,
          display: "flex",
        }}
      >
        <div
          className="draggable"
          style={{ height: "100%", flexGrow: 1 }}
          onMouseDown={e => {
            const mx = e.pageX;
            const my = e.pageY;
            const tlx = parseInt(layoutRef.current!.style.left);
            const tly = parseInt(layoutRef.current!.style.top);
            relativePosFromMouseToTLCorner.current = {
              rx: tlx - mx,
              ry: tly - my,
            };
          }}
        />
        {props.close && (
          <div className="clickable" style={{ display: "flex" }} onClick={() => props.close!()}>
            <IconClose width={theme.size / 2} height={theme.size / 2} />
          </div>
        )}
      </div>
      {props.children}
    </div>
  );
};

export const DraggableButton: React.FC<{ onStartDragging: () => void }> = props => {
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const mouseDownBeforeTriggeringDragging = useRef(false);

  useEffect(() =>
    over(
      addMouseListener("mousemove", 0, e => {
        if (
          mouseDownBeforeTriggeringDragging.current &&
          distance({ x: e.pageX, y: e.pageY }, mouseDownPos.current) > 30
        ) {
          mouseDownBeforeTriggeringDragging.current = false;
          props.onStartDragging();
        }
      }),
      addMouseListener("mouseup", 0, () => {
        mouseDownBeforeTriggeringDragging.current = false;
      })
    )
  );

  return (
    <div
      ref={ref}
      onMouseDown={e => {
        mouseDownBeforeTriggeringDragging.current = true;
        mouseDownPos.current = { x: e.pageX, y: e.pageY };
      }}
    >
      {props.children}
    </div>
  );
};

export function TeXExpr(props: { box: TeXBox; fontSize?: number }) {
  const theme = useTheme();

  props.box.div.style.position = "relative";
  return (
    <div
      style={{
        fontSize: props.fontSize ?? theme.size,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
      ref={divRef(props.box.div)}
    />
  );
}

type Icon1 = (props: { height: number; width: number; color: string }) => ReactElement;

export type Icon = ReturnType<typeof createIcon>;

function createIcon(Arg: Icon1) {
  return function Icon(props: { height?: number; width?: number; color?: string }) {
    const theme = useTheme();
    return (
      <Arg height={props.height ?? theme.size} width={props.width ?? theme.size} color={props.color ?? theme.text1} />
    );
  };
}

export const TeXBoxIcon: FC<{ box: TeXBox; height?: number; width?: number; color?: string }> = props => {
  const theme = useTheme();
  const propsHeight = props.height ?? theme.size;
  const propsWidth = props.width ?? theme.size;

  const box = props.box;
  const height = box.metric.height + box.metric.depth;
  const width = box.metric.width + (box.metric.italic ?? 0);
  const desiredRatio = propsWidth / propsHeight;
  const boxRatio = width / height;
  let fontSize;
  if (desiredRatio < boxRatio) fontSize = propsWidth / width;
  else fontSize = propsHeight / height;

  box.div.style.position = "relative";
  return (
    <div
      style={{
        fontSize,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: propsHeight,
        width: propsWidth,
        color: props.color ?? theme.text1,
      }}
      ref={divRef(box.div)}
    />
  );
};

export const IconToggleRight = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    transform={`scale(-1, 1)`}
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path d="M9 11c.628-.836 1-1.874 1-3a4.978 4.978 0 0 0-1-3h4a3 3 0 1 1 0 6H9z" />
    <path d="M5 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0 1A5 5 0 1 0 5 3a5 5 0 0 0 0 10z" />
  </svg>
));

export const IconToggleLeft = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    transform={`scale(1, 1)`}
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path d="M9 11c.628-.836 1-1.874 1-3a4.978 4.978 0 0 0-1-3h4a3 3 0 1 1 0 6H9z" />
    <path d="M5 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0 1A5 5 0 1 0 5 3a5 5 0 0 0 0 10z" />
  </svg>
));

export const IconKeyboard = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      stroke="null"
      d="m14.76442,3.03125l-13.59134,0c-0.3277,0 -0.64196,0.11628 -0.87366,0.32336c-0.23172,0.20706 -0.36191,0.48796 -0.36191,0.78081l0,7.72917c0,0.29282 0.13019,0.57372 0.36191,0.78087c0.23171,0.20703 0.54596,0.3233 0.87366,0.3233l13.59134,0c0.32767,0 0.64201,-0.11627 0.87368,-0.3233c0.23167,-0.20714 0.3619,-0.48804 0.3619,-0.78087l0,-7.72917c0,-0.29285 -0.13023,-0.57375 -0.3619,-0.78081c-0.23167,-0.20708 -0.546,-0.32336 -0.87368,-0.32336zm0,8.83333l-13.59134,0l0,-7.72917l13.59134,0l0,7.72917zm-3.70673,-6.625l-1.23558,0l0,1.10417l1.23558,0l0,-1.10417zm-1.23558,2.20833l-1.23558,0l0,1.10417l1.23558,0l0,-1.10417zm2.47115,-2.20833l1.23558,0l0,1.10417l-1.23558,0l0,-1.10417zm1.23558,4.41667l-1.23558,0l0,1.10417l1.23558,0l0,-1.10417zm-8.64904,0l6.17788,0l0,1.10417l-6.17788,0l0,-1.10417zm8.64904,-2.20833l-2.47115,0l0,1.10417l2.47115,0l0,-1.10417zm-6.17788,-2.20833l1.23558,0l0,1.10417l-1.23558,0l0,-1.10417zm0,2.20833l-1.23558,0l0,1.10417l1.23558,0l0,-1.10417zm-4.94231,2.20833l1.23558,0l0,1.10417l-1.23558,0l0,-1.10417zm0,-4.41667l1.23558,0l0,1.10417l-1.23558,0l0,-1.10417zm3.70673,0l-1.23558,0l0,1.10417l1.23558,0l0,-1.10417zm-3.70673,2.20833l2.47115,0l0,1.10417l-2.47115,0l0,-1.10417z"
      clipRule="evenodd"
      fillRule="evenodd"
    />
  </svg>
));

export const IconSave = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.353 1.146L14.853 2.646L15 3V14.5L14.5 15H1.5L1 14.5V1.5L1.5 1H13L13.353 1.146ZM2 2V14H14V3.208L12.793 2H11V6H4V2H2ZM8 2V5H10V2H8Z"
    />
  </svg>
));

export const IconNewFile = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 7H3V4H0V3H3V0H4V3H7V4H4V7ZM10.5 1.09998L13.9 4.59998L14 5V13.5L13.5 14H3.5L3 13.5V8H4V13H13V6H9V2H5V1H10.2L10.5 1.09998ZM10 2V5H12.9L10 2Z"
    />
  </svg>
));

export const IconNewFolder = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7 3H4V0H3V3H0V4H3V7H4V4H7V3ZM5.5 7H5V6H5.3L6.1 5.1L6.5 5H14V4H8V3H14.5L15 3.5V13.5L14.5 14H1.5L1 13.5V6.5V6V5H2V6V6.5V13H14V7V6H6.7L5.9 6.9L5.5 7Z"
    />
  </svg>
));

export const IconCollapseAll = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path d="M9 9H4V10H9V9Z" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 3L6 2H13L14 3V10L13 11H11V13L10 14H3L2 13V6L3 5H5V3ZM6 5H10L11 6V10H13V3H6V5ZM10 6H3V13H10V6Z"
    />
  </svg>
));

export const IconMinus = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13,7H3C2.45,7,2,7.45,2,8c0,0.55,0.45,1,1,1h10c0.55,0,1-0.45,1-1
			C14,7.45,13.55,7,13,7z"
    />
  </svg>
));

export const IconPlus = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13,7H9V3c0-0.55-0.45-1-1-1S7,2.45,7,3v4H3C2.45,7,2,7.45,2,8
   c0,0.55,0.45,1,1,1h4v4c0,0.55,0.45,1,1,1s1-0.45,1-1V9h4c0.55,0,1-0.45,1-1C14,7.45,13.55,7,13,7z"
    />
  </svg>
));

export const IconRemove = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.99,6.99h-6c-0.55,0-1,0.45-1,1s0.45,1,1,1h6c0.55,0,1-0.45,1-1
			S11.54,6.99,10.99,6.99z M7.99-0.01c-4.42,0-8,3.58-8,8s3.58,8,8,8s8-3.58,8-8S12.41-0.01,7.99-0.01z M7.99,13.99
			c-3.31,0-6-2.69-6-6s2.69-6,6-6s6,2.69,6,6S11.31,13.99,7.99,13.99z"
    />
  </svg>
));

export const IconSelect = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1024 1024"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path d="M281.611519 767.961602h-204.78976C34.481476 767.961602 0.025599 733.505725 0.025599 691.165442v-614.369282C0.025599 34.455877 34.481476 0 76.821759 0h716.764162c42.340283 0 76.79616 34.455877 76.79616 76.79616v358.382081a25.59872 25.59872 0 0 1-51.19744 0v-358.382081a25.59872 25.59872 0 0 0-25.59872-25.59872h-716.764162a25.59872 25.59872 0 0 0-25.59872 25.59872v614.369282a25.59872 25.59872 0 0 0 25.59872 25.59872h204.78976a25.59872 25.59872 0 0 1 0 51.19744z"></path>
    <path d="M665.59232 1023.948803a25.59872 25.59872 0 0 1-23.755612-16.075997l-86.882056-217.179541-151.698015 173.354533A25.59872 25.59872 0 0 1 358.40768 947.20384v-767.961602a25.59872 25.59872 0 0 1 42.852257-18.943053l563.171841 511.974401a25.547523 25.547523 0 0 1-17.202339 44.541773H729.077146l88.366782 220.865757a25.59872 25.59872 0 0 1-14.284086 33.278336l-127.9936 51.19744a26.0083 26.0083 0 0 1-9.522724 1.843108z m-102.39488-307.184641a25.59872 25.59872 0 0 1 23.755612 16.075996l92.872157 232.231588 80.482376-32.203189-92.872157-232.231589a25.547523 25.547523 0 0 1 23.755612-35.121444h189.788911L409.60512 236.99295v641.964702l134.342083-153.541123a25.649918 25.649918 0 0 1 19.250237-8.754762z"></path>
  </svg>
));

export const IconSettingsGear = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19.85 8.75L24 9.57996V14.42L19.85 15.25L22.2 18.77L18.77 22.2L15.25 19.85L14.42 24H9.57996L8.75 19.85L5.22998 22.2L1.80005 18.77L4.15002 15.25L0 14.42V9.57996L4.15002 8.75L1.80005 5.22998L5.22998 1.80005L8.75 4.15002L9.57996 0H14.42L15.25 4.15002L18.77 1.80005L22.2 5.22998L19.85 8.75ZM18.28 13.8199L22.28 13.01V11.01L18.28 10.2L17.74 8.90002L20.03 5.46997L18.6 4.04004L15.17 6.32996L13.87 5.79004L13.0601 1.79004H11.0601L10.25 5.79004L8.94995 6.32996L5.52002 4.04004L4.08997 5.46997L6.38 8.90002L5.83997 10.2L1.83997 11.01V13.01L5.83997 13.8199L6.38 15.12L4.08997 18.55L5.52002 19.98L8.94995 17.6899L10.25 18.23L11.0601 22.23H13.0601L13.87 18.23L15.17 17.6899L18.6 19.98L20.03 18.55L17.74 15.12L18.28 13.8199ZM10.0943 9.14807C10.6584 8.77118 11.3216 8.56995 12 8.56995C12.9089 8.57258 13.7798 8.93484 14.4225 9.57751C15.0652 10.2202 15.4274 11.0911 15.43 12C15.43 12.6784 15.2288 13.3416 14.8519 13.9056C14.475 14.4697 13.9394 14.9093 13.3126 15.1689C12.6859 15.4286 11.9962 15.4965 11.3308 15.3641C10.6654 15.2318 10.0543 14.9051 9.57457 14.4254C9.09488 13.9457 8.7682 13.3345 8.63585 12.6692C8.50351 12.0038 8.57143 11.3141 8.83104 10.6874C9.09065 10.0606 9.53029 9.52496 10.0943 9.14807ZM11.0499 13.4218C11.3311 13.6097 11.6618 13.71 12 13.71C12.2249 13.7113 12.4479 13.668 12.656 13.5825C12.8641 13.4971 13.0531 13.3712 13.2121 13.2122C13.3712 13.0531 13.497 12.8641 13.5825 12.656C13.668 12.4479 13.7113 12.2249 13.7099 12C13.7099 11.6618 13.6096 11.3311 13.4217 11.0499C13.2338 10.7687 12.9669 10.5496 12.6544 10.4202C12.3419 10.2907 11.9981 10.2569 11.6664 10.3229C11.3347 10.3889 11.03 10.5517 10.7909 10.7909C10.5517 11.03 10.3888 11.3347 10.3229 11.6664C10.2569 11.9981 10.2907 12.342 10.4202 12.6544C10.5496 12.9669 10.7687 13.2339 11.0499 13.4218Z"
    />
  </svg>
));

export const IconDelete = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.99,4.99c0-0.55-0.45-1-1-1c-0.28,0-0.53,0.11-0.71,0.29L7.99,6.58L5.7,4.29
			C5.52,4.1,5.27,3.99,4.99,3.99c-0.55,0-1,0.45-1,1c0,0.28,0.11,0.53,0.29,0.71l2.29,2.29l-2.29,2.29
			c-0.18,0.18-0.29,0.43-0.29,0.71c0,0.55,0.45,1,1,1c0.28,0,0.53-0.11,0.71-0.29l2.29-2.29l2.29,2.29
			c0.18,0.18,0.43,0.29,0.71,0.29c0.55,0,1-0.45,1-1c0-0.28-0.11-0.53-0.29-0.71L9.41,7.99L11.7,5.7
			C11.88,5.52,11.99,5.27,11.99,4.99z M7.99-0.01c-4.42,0-8,3.58-8,8s3.58,8,8,8s8-3.58,8-8S12.41-0.01,7.99-0.01z M7.99,13.99
			c-3.31,0-6-2.69-6-6s2.69-6,6-6s6,2.69,6,6S11.31,13.99,7.99,13.99z"
    />
  </svg>
));

export const IconEdit = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.25,10.26l2.47,2.47l6.69-6.69L9.95,3.56L3.25,10.26z M0.99,14.99l3.86-1.39
			l-2.46-2.44L0.99,14.99z M13.24,0.99c-0.48,0-0.92,0.2-1.24,0.51l-1.44,1.44l2.47,2.47l1.44-1.44c0.32-0.32,0.51-0.75,0.51-1.24
			C14.99,1.78,14.21,0.99,13.24,0.99z"
    />
  </svg>
));

export const IconCross = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.41,8l3.29-3.29C12.89,4.53,13,4.28,13,4c0-0.55-0.45-1-1-1
			c-0.28,0-0.53,0.11-0.71,0.29L8,6.59L4.71,3.29C4.53,3.11,4.28,3,4,3C3.45,3,3,3.45,3,4c0,0.28,0.11,0.53,0.29,0.71L6.59,8
			l-3.29,3.29C3.11,11.47,3,11.72,3,12c0,0.55,0.45,1,1,1c0.28,0,0.53-0.11,0.71-0.29L8,9.41l3.29,3.29C11.47,12.89,11.72,13,12,13
			c0.55,0,1-0.45,1-1c0-0.28-0.11-0.53-0.29-0.71L9.41,8z"
    />
  </svg>
));

export const IconAlignLeft = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9,9H5c-0.55,0-1,0.45-1,1v3c0,0.55,0.45,1,1,1h4c0.55,0,1-0.45,1-1v-3
			C10,9.45,9.55,9,9,9z M1,0C0.45,0,0,0.45,0,1v14c0,0.55,0.45,1,1,1s1-0.45,1-1V1C2,0.45,1.55,0,1,0z M14,2H5C4.45,2,4,2.45,4,3v3
			c0,0.55,0.45,1,1,1h9c0.55,0,1-0.45,1-1V3C15,2.45,14.55,2,14,2z"
    />
  </svg>
));

export const IconAlignVerticalCenter = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13,2H9V1c0-0.55-0.45-1-1-1S7,0.45,7,1v1H3C2.45,2,2,2.45,2,3v3
			c0,0.55,0.45,1,1,1h4v2H6c-0.55,0-1,0.45-1,1v3c0,0.55,0.45,1,1,1h1v1c0,0.55,0.45,1,1,1s1-0.45,1-1v-1h1c0.55,0,1-0.45,1-1v-3
			c0-0.55-0.45-1-1-1H9V7h4c0.55,0,1-0.45,1-1V3C14,2.45,13.55,2,13,2z"
    />
  </svg>
));

export const IconReset = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path d="M10,5 C10,5.55 10.45,6 11,6 L15,6 C15.55,6 16,5.55 16,5 L16,1 C16,0.45 15.55,0 15,0 C14.45,0 14,0.45 14,1 L14,2.74 C12.54,1.07 10.4,0 8,0 C3.58,0 0,3.58 0,8 C0,12.06 3.02,15.4 6.94,15.92 C6.96,15.92 6.98,15.93 7,15.93 C7.33,15.97 7.66,16 8,16 C12.42,16 16,12.42 16,8 C16,7.45 15.55,7 15,7 C14.45,7 14,7.45 14,8 C14,11.31 11.31,14 8,14 C7.29,14 6.63,13.85 6,13.62 L6,13.63 C3.67,12.81 2,10.61 2,8 C2,4.69 4.69,2 8,2 C9.77,2 11.36,2.78 12.46,4 L11,4 C10.45,4 10,4.45 10,5 Z"></path>
  </svg>
));

export const IconMove = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.71,7.29l-2-2C13.53,5.11,13.28,5,13,5c-0.55,0-1,0.45-1,1
			c0,0.28,0.11,0.53,0.29,0.71L12.59,7H9V3.41l0.29,0.29C9.47,3.89,9.72,4,10,4c0.55,0,1-0.45,1-1c0-0.28-0.11-0.53-0.29-0.71l-2-2
			C8.53,0.11,8.28,0,8,0S7.47,0.11,7.29,0.29l-2,2C5.11,2.47,5,2.72,5,3c0,0.55,0.45,1,1,1c0.28,0,0.53-0.11,0.71-0.29L7,3.41V7
			H3.41l0.29-0.29C3.89,6.53,4,6.28,4,6c0-0.55-0.45-1-1-1C2.72,5,2.47,5.11,2.29,5.29l-2,2C0.11,7.47,0,7.72,0,8
			c0,0.28,0.11,0.53,0.29,0.71l2,2C2.47,10.89,2.72,11,3,11c0.55,0,1-0.45,1-1c0-0.28-0.11-0.53-0.29-0.71L3.41,9H7v3.59l-0.29-0.29
			C6.53,12.11,6.28,12,6,12c-0.55,0-1,0.45-1,1c0,0.28,0.11,0.53,0.29,0.71l2,2C7.47,15.89,7.72,16,8,16s0.53-0.11,0.71-0.29l2-2
			C10.89,13.53,11,13.28,11,13c0-0.55-0.45-1-1-1c-0.28,0-0.53,0.11-0.71,0.29L9,12.59V9h3.59l-0.29,0.29C12.11,9.47,12,9.72,12,10
			c0,0.55,0.45,1,1,1c0.28,0,0.53-0.11,0.71-0.29l2-2C15.89,8.53,16,8.28,16,8C16,7.72,15.89,7.47,15.71,7.29z"
    />
  </svg>
));

export const IconUndo = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4,11c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S5.1,11,4,11z M11,4H3.41l1.29-1.29
			C4.89,2.53,5,2.28,5,2c0-0.55-0.45-1-1-1C3.72,1,3.47,1.11,3.29,1.29l-3,3C0.11,4.47,0,4.72,0,5c0,0.28,0.11,0.53,0.29,0.71l3,3
			C3.47,8.89,3.72,9,4,9c0.55,0,1-0.45,1-1c0-0.28-0.11-0.53-0.29-0.71L3.41,6H11c1.66,0,3,1.34,3,3s-1.34,3-3,3H7v2h4
			c2.76,0,5-2.24,5-5S13.76,4,11,4z"
    />
  </svg>
));

export const IconRedo = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12,11c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S13.1,11,12,11z M15.71,4.29l-3-3
			C12.53,1.11,12.28,1,12,1c-0.55,0-1,0.45-1,1c0,0.28,0.11,0.53,0.29,0.71L12.59,4H5C2.24,4,0,6.24,0,9s2.24,5,5,5h4v-2H5
			c-1.66,0-3-1.34-3-3s1.34-3,3-3h7.59l-1.29,1.29C11.11,7.47,11,7.72,11,8c0,0.55,0.45,1,1,1c0.28,0,0.53-0.11,0.71-0.29l3-3
			C15.89,5.53,16,5.28,16,5C16,4.72,15.89,4.47,15.71,4.29z"
    />
  </svg>
));

export const IconChevronRight = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.71,7.29l-4-4C6.53,3.11,6.28,3,6,3C5.45,3,5,3.45,5,4
			c0,0.28,0.11,0.53,0.29,0.71L8.59,8l-3.29,3.29C5.11,11.47,5,11.72,5,12c0,0.55,0.45,1,1,1c0.28,0,0.53-0.11,0.71-0.29l4-4
			C10.89,8.53,11,8.28,11,8C11,7.72,10.89,7.47,10.71,7.29z"
    />
  </svg>
));

export const IconChevronLeft = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.41,8l3.29-3.29C10.89,4.53,11,4.28,11,4c0-0.55-0.45-1-1-1
			C9.72,3,9.47,3.11,9.29,3.29l-4,4C5.11,7.47,5,7.72,5,8c0,0.28,0.11,0.53,0.29,0.71l4,4C9.47,12.89,9.72,13,10,13
			c0.55,0,1-0.45,1-1c0-0.28-0.11-0.53-0.29-0.71L7.41,8z"
    />
  </svg>
));

export const IconChevronUp = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.71,9.29l-4-4C8.53,5.11,8.28,5,8,5S7.47,5.11,7.29,5.29l-4,4
			C3.11,9.47,3,9.72,3,10c0,0.55,0.45,1,1,1c0.28,0,0.53-0.11,0.71-0.29L8,7.41l3.29,3.29C11.47,10.89,11.72,11,12,11
			c0.55,0,1-0.45,1-1C13,9.72,12.89,9.47,12.71,9.29z"
    />
  </svg>
));

export const IconChevronDown = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12,5c-0.28,0-0.53,0.11-0.71,0.29L8,8.59L4.71,5.29C4.53,5.11,4.28,5,4,5
			C3.45,5,3,5.45,3,6c0,0.28,0.11,0.53,0.29,0.71l4,4C7.47,10.89,7.72,11,8,11s0.53-0.11,0.71-0.29l4-4C12.89,6.53,13,6.28,13,6
			C13,5.45,12.55,5,12,5z"
    />
  </svg>
));

export const IconLock = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      d="M13.96,7H12V3.95C12,1.77,10.21,0,8,0S4,1.77,4,3.95V7H1.96C1.41,7,1,7.35,1,7.9v6.91C1,15.35,1.41,16,1.96,16
	h12c0.55,0,1.04-0.65,1.04-1.19V7.9C15,7.35,14.51,7,13.96,7z M6,7V3.95c0-1.09,0.9-1.97,2-1.97s2,0.88,2,1.97V7H6z"
    />
  </svg>
));

export const IconUnlock = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.99-0.01c-2.21,0-4,1.79-4,4v3h-7c-0.55,0-1,0.45-1,1v7c0,0.55,0.45,1,1,1h12
			c0.55,0,1-0.45,1-1v-7c0-0.55-0.45-1-1-1h-3v-3c0-1.1,0.9-2,2-2s2,0.9,2,2v1c0,0.55,0.45,1,1,1s1-0.45,1-1v-1
			C15.99,1.78,14.2-0.01,11.99-0.01z"
    />
  </svg>
));

export const IconList = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2,6C0.9,6,0,6.9,0,8c0,1.1,0.9,2,2,2s2-0.9,2-2C4,6.9,3.1,6,2,6z M6,3h9
			c0.55,0,1-0.45,1-1c0-0.55-0.45-1-1-1H6C5.45,1,5,1.45,5,2C5,2.55,5.45,3,6,3z M2,12c-1.1,0-2,0.9-2,2c0,1.1,0.9,2,2,2s2-0.9,2-2
			C4,12.9,3.1,12,2,12z M15,7H6C5.45,7,5,7.45,5,8c0,0.55,0.45,1,1,1h9c0.55,0,1-0.45,1-1C16,7.45,15.55,7,15,7z M15,13H6
			c-0.55,0-1,0.45-1,1c0,0.55,0.45,1,1,1h9c0.55,0,1-0.45,1-1C16,13.45,15.55,13,15,13z M2,0C0.9,0,0,0.9,0,2c0,1.1,0.9,2,2,2
			s2-0.9,2-2C4,0.9,3.1,0,2,0z"
    />
  </svg>
));

export const IconCode = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.71,7.29l-3-3C12.53,4.11,12.28,4,12,4c-0.55,0-1,0.45-1,1
			c0,0.28,0.11,0.53,0.29,0.71L13.59,8l-2.29,2.29C11.11,10.47,11,10.72,11,11c0,0.55,0.45,1,1,1c0.28,0,0.53-0.11,0.71-0.29l3-3
			C15.89,8.53,16,8.28,16,8C16,7.72,15.89,7.47,15.71,7.29z M5,5c0-0.55-0.45-1-1-1C3.72,4,3.47,4.11,3.29,4.29l-3,3
			C0.11,7.47,0,7.72,0,8c0,0.28,0.11,0.53,0.29,0.71l3,3C3.47,11.89,3.72,12,4,12c0.55,0,1-0.45,1-1c0-0.28-0.11-0.53-0.29-0.71
			L2.41,8l2.29-2.29C4.89,5.53,5,5.28,5,5z M9,2C8.52,2,8.13,2.35,8.04,2.81l-2,10C6.03,12.87,6,12.93,6,13c0,0.55,0.45,1,1,1
			c0.48,0,0.87-0.35,0.96-0.81l2-10C9.97,3.13,10,3.07,10,3C10,2.45,9.55,2,9,2z"
    />
  </svg>
));

export const IconFiles = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path d="M17.5 0H8.5L7 1.5V6H2.5L1 7.5V22.5699L2.5 24H14.5699L16 22.5699V18H20.7L22 16.5699V4.5L17.5 0ZM17.5 2.12L19.88 4.5H17.5V2.12ZM14.5 22.5H2.5V7.5H7V16.5699L8.5 18H14.5V22.5ZM20.5 16.5H8.5V1.5H16V6H20.5V16.5Z" />
  </svg>
));

export const IconFlash = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4,8c0-0.55-0.45-1-1-1H1C0.45,7,0,7.45,0,8c0,0.55,0.45,1,1,1h2
  C3.55,9,4,8.55,4,8z M8,4c0.55,0,1-0.45,1-1V1c0-0.55-0.45-1-1-1S7,0.45,7,1v2C7,3.55,7.45,4,8,4z M3.79,5.21
  C3.97,5.39,4.22,5.5,4.5,5.5c0.55,0,1-0.45,1-1c0-0.28-0.11-0.53-0.29-0.71l-1.5-1.5C3.53,2.11,3.28,2,3,2C2.45,2,2,2.45,2,3
  c0,0.28,0.11,0.53,0.29,0.71L3.79,5.21z M4.5,10.5c-0.28,0-0.53,0.11-0.71,0.29l-1.5,1.5C2.11,12.47,2,12.72,2,13
  c0,0.55,0.45,1,1,1c0.28,0,0.53-0.11,0.71-0.29l1.5-1.5c0.18-0.18,0.29-0.43,0.29-0.71C5.5,10.95,5.05,10.5,4.5,10.5z M11.5,5.5
  c0.28,0,0.53-0.11,0.71-0.29l1.5-1.5C13.89,3.53,14,3.28,14,3c0-0.55-0.45-1-1-1c-0.28,0-0.53,0.11-0.71,0.29l-1.5,1.5
  C10.61,3.97,10.5,4.22,10.5,4.5C10.5,5.05,10.95,5.5,11.5,5.5z M12.21,10.79c-0.18-0.18-0.43-0.29-0.71-0.29c-0.55,0-1,0.45-1,1
  c0,0.28,0.11,0.53,0.29,0.71l1.5,1.5C12.47,13.89,12.72,14,13,14c0.55,0,1-0.45,1-1c0-0.28-0.11-0.53-0.29-0.71L12.21,10.79z
   M15,7h-2c-0.55,0-1,0.45-1,1c0,0.55,0.45,1,1,1h2c0.55,0,1-0.45,1-1C16,7.45,15.55,7,15,7z M8,5C6.34,5,5,6.34,5,8s1.34,3,3,3
  s3-1.34,3-3S9.66,5,8,5z M8,9C7.45,9,7,8.55,7,8c0-0.55,0.45-1,1-1s1,0.45,1,1C9,8.55,8.55,9,8,9z M8,12c-0.55,0-1,0.45-1,1v2
  c0,0.55,0.45,1,1,1s1-0.45,1-1v-2C9,12.45,8.55,12,8,12z"
    />
  </svg>
));

export const IconMoon = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      d="M15,11.38C13.77,14.11,11.03,16,7.85,16C3.51,16,0,12.49,0,8.15C0,4.97,1.89,2.23,4.62,1
		C4.17,1.99,3.92,3.08,3.92,4.23c0,4.33,3.51,7.85,7.85,7.85C12.92,12.08,14.01,11.83,15,11.38z"
    />
  </svg>
));

export const IconCheck = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.4315 3.3232L5.96151 13.3232L5.1708 13.2874L1.8208 8.5174L2.63915 7.94268L5.61697 12.1827L13.6684 2.67688L14.4315 3.3232Z"
    />
  </svg>
));

export const IconClose = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.41,8l3.29-3.29C12.89,4.53,13,4.28,13,4c0-0.55-0.45-1-1-1
			c-0.28,0-0.53,0.11-0.71,0.29L8,6.59L4.71,3.29C4.53,3.11,4.28,3,4,3C3.45,3,3,3.45,3,4c0,0.28,0.11,0.53,0.29,0.71L6.59,8
			l-3.29,3.29C3.11,11.47,3,11.72,3,12c0,0.55,0.45,1,1,1c0.28,0,0.53-0.11,0.71-0.29L8,9.41l3.29,3.29C11.47,12.89,11.72,13,12,13
			c0.55,0,1-0.45,1-1c0-0.28-0.11-0.53-0.29-0.71L9.41,8z"
    />
  </svg>
));

export const IconTrash = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10 3H12H13V4H12V13L11 14H4L3 13V4H2V3H5V2C5 1.73478 5.10531 1.48038 5.29285 1.29285C5.48038 1.10531 5.73478 1 6 1H9C9.26522 1 9.51962 1.10531 9.70715 1.29285C9.89469 1.48038 10 1.73478 10 2V3ZM9 2H6V3H9V2ZM4 13H11V4H4V13ZM6 5H5V12H6V5ZM7 5H8V12H7V5ZM9 5H10V12H9V5Z"
    />
  </svg>
));

export const IconDuplicate = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15,0H5C4.45,0,4,0.45,4,1v2h2V2h8v7h-1v2h2c0.55,0,1-0.45,1-1V1
			C16,0.45,15.55,0,15,0z M11,4H1C0.45,4,0,4.45,0,5v10c0,0.55,0.45,1,1,1h10c0.55,0,1-0.45,1-1V5C12,4.45,11.55,4,11,4z M10,14H2V6
			h8V14z"
    />
  </svg>
));

export const IconJson = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6 2.98361V2.97184V2H5.91083C5.59743 2 5.29407 2.06161 5.00128 2.18473C4.70818 2.30798 4.44942 2.48474 4.22578 2.71498C4.00311 2.94422 3.83792 3.19498 3.73282 3.46766L3.73233 3.46898C3.63382 3.7352 3.56814 4.01201 3.53533 4.29917L3.53519 4.30053C3.50678 4.5805 3.4987 4.86844 3.51084 5.16428C3.52272 5.45379 3.52866 5.74329 3.52866 6.03279C3.52866 6.23556 3.48974 6.42594 3.412 6.60507L3.4116 6.60601C3.33687 6.78296 3.23423 6.93866 3.10317 7.07359C2.97644 7.20405 2.82466 7.31055 2.64672 7.3925C2.4706 7.46954 2.28497 7.5082 2.08917 7.5082H2V7.6V8.4V8.4918H2.08917C2.28465 8.4918 2.47001 8.53238 2.64601 8.61334L2.64742 8.61396C2.82457 8.69157 2.97577 8.79762 3.10221 8.93161L3.10412 8.93352C3.23428 9.0637 3.33659 9.21871 3.41129 9.39942L3.41201 9.40108C3.48986 9.58047 3.52866 9.76883 3.52866 9.96721C3.52866 10.2567 3.52272 10.5462 3.51084 10.8357C3.4987 11.1316 3.50677 11.4215 3.53516 11.7055L3.53535 11.7072C3.56819 11.9903 3.63387 12.265 3.73232 12.531L3.73283 12.5323C3.83793 12.805 4.00311 13.0558 4.22578 13.285C4.44942 13.5153 4.70818 13.692 5.00128 13.8153C5.29407 13.9384 5.59743 14 5.91083 14H6V13.2V13.0164H5.91083C5.71095 13.0164 5.52346 12.9777 5.34763 12.9008C5.17396 12.8191 5.02194 12.7126 4.89086 12.5818C4.76386 12.4469 4.66104 12.2911 4.58223 12.1137C4.50838 11.9346 4.47134 11.744 4.47134 11.541C4.47134 11.3127 4.4753 11.0885 4.48321 10.8686C4.49125 10.6411 4.49127 10.4195 4.48324 10.2039C4.47914 9.98246 4.46084 9.76883 4.42823 9.56312C4.39513 9.35024 4.33921 9.14757 4.26039 8.95536C4.18091 8.76157 4.07258 8.57746 3.93616 8.40298C3.82345 8.25881 3.68538 8.12462 3.52283 8C3.68538 7.87538 3.82345 7.74119 3.93616 7.59702C4.07258 7.42254 4.18091 7.23843 4.26039 7.04464C4.33913 6.85263 4.39513 6.65175 4.42826 6.44285C4.46082 6.2333 4.47914 6.01973 4.48324 5.80219C4.49127 5.58262 4.49125 5.36105 4.48321 5.13749C4.4753 4.9134 4.47134 4.68725 4.47134 4.45902C4.47134 4.26019 4.50833 4.07152 4.58238 3.89205C4.66135 3.71034 4.76421 3.55475 4.89086 3.42437C5.02193 3.28942 5.17461 3.18275 5.34802 3.10513C5.5238 3.02427 5.71113 2.98361 5.91083 2.98361H6ZM10 13.0164V13.0282V14H10.0892C10.4026 14 10.7059 13.9384 10.9987 13.8153C11.2918 13.692 11.5506 13.5153 11.7742 13.285C11.9969 13.0558 12.1621 12.805 12.2672 12.5323L12.2677 12.531C12.3662 12.2648 12.4319 11.988 12.4647 11.7008L12.4648 11.6995C12.4932 11.4195 12.5013 11.1316 12.4892 10.8357C12.4773 10.5462 12.4713 10.2567 12.4713 9.96721C12.4713 9.76444 12.5103 9.57406 12.588 9.39493L12.5884 9.39399C12.6631 9.21704 12.7658 9.06134 12.8968 8.92642C13.0236 8.79595 13.1753 8.68945 13.3533 8.6075C13.5294 8.53046 13.715 8.4918 13.9108 8.4918H14V8.4V7.6V7.5082H13.9108C13.7153 7.5082 13.53 7.46762 13.354 7.38666L13.3526 7.38604C13.1754 7.30844 13.0242 7.20238 12.8978 7.06839L12.8959 7.06648C12.7657 6.9363 12.6634 6.78129 12.5887 6.60058L12.588 6.59892C12.5101 6.41953 12.4713 6.23117 12.4713 6.03279C12.4713 5.74329 12.4773 5.45379 12.4892 5.16428C12.5013 4.86842 12.4932 4.57848 12.4648 4.29454L12.4646 4.29285C12.4318 4.00971 12.3661 3.73502 12.2677 3.46897L12.2672 3.46766C12.1621 3.19499 11.9969 2.94422 11.7742 2.71498C11.5506 2.48474 11.2918 2.30798 10.9987 2.18473C10.7059 2.06161 10.4026 2 10.0892 2H10V2.8V2.98361H10.0892C10.2891 2.98361 10.4765 3.0223 10.6524 3.09917C10.826 3.18092 10.9781 3.28736 11.1091 3.41823C11.2361 3.55305 11.339 3.70889 11.4178 3.88628C11.4916 4.0654 11.5287 4.25596 11.5287 4.45902C11.5287 4.68727 11.5247 4.91145 11.5168 5.13142C11.5088 5.35894 11.5087 5.58049 11.5168 5.79605C11.5209 6.01754 11.5392 6.23117 11.5718 6.43688C11.6049 6.64976 11.6608 6.85243 11.7396 7.04464C11.8191 7.23843 11.9274 7.42254 12.0638 7.59702C12.1765 7.74119 12.3146 7.87538 12.4772 8C12.3146 8.12462 12.1765 8.25881 12.0638 8.40298C11.9274 8.57746 11.8191 8.76157 11.7396 8.95536C11.6609 9.14737 11.6049 9.34825 11.5717 9.55715C11.5392 9.7667 11.5209 9.98027 11.5168 10.1978C11.5087 10.4174 11.5087 10.6389 11.5168 10.8625C11.5247 11.0866 11.5287 11.3128 11.5287 11.541C11.5287 11.7398 11.4917 11.9285 11.4176 12.1079C11.3386 12.2897 11.2358 12.4452 11.1091 12.5756C10.9781 12.7106 10.8254 12.8173 10.652 12.8949C10.4762 12.9757 10.2889 13.0164 10.0892 13.0164H10Z"
    />
  </svg>
));

export const IconManyToOne = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3 2C2.44772 2 2 2.44772 2 3C2 3.55228 2.44772 4 3 4C3.55228 4 4 3.55228 4 3C4 2.44772 3.55228 2 3 2ZM3 0C4.38538 0 5.55143 0.939058 5.89635 2.21537C6.06412 2.25873 6.23506 2.31081 6.40608 2.37338C7.48214 2.76706 8.64278 3.61487 8.98058 5.30389C9.14217 6.11182 9.64501 6.51404 10.274 6.74577C10.7489 5.71528 11.7909 5 13 5C14.6569 5 16 6.34315 16 8C16 9.65685 14.6569 11 13 11C11.7909 11 10.7489 10.2847 10.274 9.25423C9.64501 9.48596 9.14217 9.88818 8.98058 10.6961C8.64278 12.3851 7.48214 13.2329 6.40608 13.6266C6.23506 13.6892 6.06411 13.7413 5.89635 13.7846C5.55143 15.0609 4.38538 16 3 16C1.34315 16 0 14.6569 0 13C0 11.3431 1.34315 10 3 10C4.20909 10 5.25112 10.7153 5.72603 11.7458C6.35498 11.514 6.85783 11.1118 7.01942 10.3039C7.23462 9.22788 7.78375 8.49328 8.43222 8C7.78375 7.50672 7.23462 6.77212 7.01942 5.69612C6.85783 4.88818 6.35499 4.48597 5.72603 4.25424C5.25112 5.28473 4.20909 6 3 6C1.34315 6 0 4.65685 0 3C0 1.34315 1.34315 0 3 0ZM4 13C4 12.4477 3.55228 12 3 12C2.44772 12 2 12.4477 2 13C2 13.5523 2.44772 14 3 14C3.55228 14 4 13.5523 4 13ZM12 8C12 8.55228 12.4477 9 13 9C13.5523 9 14 8.55228 14 8C14 7.44772 13.5523 7 13 7C12.4477 7 12 7.44772 12 8Z"
    />
  </svg>
));

export const IconFlows = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.5,6c-1.21,0-2.22,0.86-2.45,2h-1.3L5.74,4L4.99,4.75L8.25,8h-3.3
			C4.72,6.86,3.71,6,2.5,6C1.12,6,0,7.12,0,8.5C0,9.88,1.12,11,2.5,11c1.21,0,2.22-0.86,2.45-2h3.3l-3.26,3.25L5.74,13l4.01-4h1.3
			c0.23,1.14,1.24,2,2.45,2c1.38,0,2.5-1.12,2.5-2.5C16,7.12,14.88,6,13.5,6z"
    />
  </svg>
));

export const IconPropertiesFlipped = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
    transform={`scale(-1, 1)`}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2,6C0.9,6,0,6.9,0,8c0,1.1,0.9,2,2,2s2-0.9,2-2C4,6.9,3.1,6,2,6z M6,3h9
			c0.55,0,1-0.45,1-1c0-0.55-0.45-1-1-1H6C5.45,1,5,1.45,5,2C5,2.55,5.45,3,6,3z M2,12c-1.1,0-2,0.9-2,2c0,1.1,0.9,2,2,2s2-0.9,2-2
			C4,12.9,3.1,12,2,12z M15,7H6C5.45,7,5,7.45,5,8c0,0.55,0.45,1,1,1h9c0.55,0,1-0.45,1-1C16,7.45,15.55,7,15,7z M15,13H6
			c-0.55,0-1,0.45-1,1c0,0.55,0.45,1,1,1h9c0.55,0,1-0.45,1-1C16,13.45,15.55,13,15,13z M2,0C0.9,0,0,0.9,0,2c0,1.1,0.9,2,2,2
			s2-0.9,2-2C4,0.9,3.1,0,2,0z"
    />
  </svg>
));

export const IconScreenFull = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path d="M3 12H13V4H3V12ZM5 6H11V10H5V6ZM2 6H1V2.5L1.5 2H5V3H2V6ZM15 2.5V6H14V3H11V2H14.5L15 2.5ZM14 10H15V13.5L14.5 14H11V13H14V10ZM2 13H5V14H1.5L1 13.5V10H2V13Z" />
  </svg>
));

export const IconMaximize = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.99,8.99c-0.28,0-0.53,0.11-0.71,0.29l-3.29,3.29v-1.59c0-0.55-0.45-1-1-1
			s-1,0.45-1,1v4c0,0.55,0.45,1,1,1h4c0.55,0,1-0.45,1-1s-0.45-1-1-1H3.41L6.7,10.7c0.18-0.18,0.29-0.43,0.29-0.71
			C6.99,9.44,6.54,8.99,5.99,8.99z M14.99-0.01h-4c-0.55,0-1,0.45-1,1s0.45,1,1,1h1.59L9.28,5.29C9.1,5.47,8.99,5.72,8.99,5.99
			c0,0.55,0.45,1,1,1c0.28,0,0.53-0.11,0.71-0.29l3.29-3.29v1.59c0,0.55,0.45,1,1,1s1-0.45,1-1v-4C15.99,0.44,15.54-0.01,14.99-0.01
			z"
    />
  </svg>
));

export const IconLink = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.99,11.99c0.28,0,0.53-0.11,0.71-0.29l6-6c0.18-0.18,0.29-0.43,0.29-0.71
			c0-0.55-0.45-1-1-1c-0.28,0-0.53,0.11-0.71,0.29l-6,6c-0.18,0.18-0.29,0.43-0.29,0.71C3.99,11.54,4.44,11.99,4.99,11.99z
			 M8.84,9.97l-2.44,2.44l-1,1l-0.01-0.01c-0.36,0.36-0.85,0.6-1.4,0.6c-1.1,0-2-0.9-2-2c0-0.55,0.24-1.04,0.6-1.4l-0.01-0.01l1-1
			l2.44-2.44C5.69,7.05,5.35,6.99,4.99,6.99c-1.1,0-2.09,0.46-2.81,1.19L2.16,8.16l-1,1l0.02,0.02c-0.73,0.72-1.19,1.71-1.19,2.81
			c0,2.21,1.79,4,4,4c1.1,0,2.09-0.46,2.81-1.19l0.02,0.02l1-1L7.8,13.8c0.73-0.72,1.19-1.71,1.19-2.81
			C8.99,10.64,8.93,10.3,8.84,9.97z M15.99,3.99c0-2.21-1.79-4-4-4c-1.1,0-2.09,0.46-2.81,1.19L9.16,1.16l-1,1l0.02,0.02
			C7.46,2.9,6.99,3.89,6.99,4.99c0,0.36,0.06,0.69,0.15,1.02l2.44-2.44l1-1l0.01,0.01c0.36-0.36,0.85-0.6,1.4-0.6c1.1,0,2,0.9,2,2
			c0,0.55-0.24,1.04-0.6,1.4l0.01,0.01l-1,1L9.97,8.84c0.33,0.09,0.67,0.15,1.02,0.15c1.1,0,2.09-0.46,2.81-1.19l0.02,0.02l1-1
			L14.8,6.8C15.53,6.08,15.99,5.1,15.99,3.99z"
    />
  </svg>
));

export const IconSplitVertical = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path d="M14 1H3L2 2V13L3 14H14L15 13V2L14 1ZM14 13H3V8H14V13ZM14 7H3V2H14V7Z" />
  </svg>
));

export const IconTick = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14,3c-0.28,0-0.53,0.11-0.71,0.29L6,10.59L2.71,7.29C2.53,7.11,2.28,7,2,7
			C1.45,7,1,7.45,1,8c0,0.28,0.11,0.53,0.29,0.71l4,4C5.47,12.89,5.72,13,6,13s0.53-0.11,0.71-0.29l8-8C14.89,4.53,15,4.28,15,4
			C15,3.45,14.55,3,14,3z"
    />
  </svg>
));

export const IconCircle = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      d="M8,0C3.6,0,0,3.6,0,8s3.6,8,8,8s8-3.6,8-8S12.4,0,8,0L8,0z M8,14c-3.3,0-6-2.7-6-6
			s2.7-6,6-6s6,2.7,6,6S11.3,14,8,14L8,14z"
    />
  </svg>
));

export const IconExchange = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.99,5.99c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S3.1,5.99,1.99,5.99z
			 M6.14,7.85c0.09,0.09,0.22,0.15,0.35,0.15c0.28,0,0.5-0.22,0.5-0.5c0-0.14-0.06-0.26-0.15-0.35L5.7,5.99h5.79
			c0.28,0,0.5-0.22,0.5-0.5s-0.22-0.5-0.5-0.5H5.7l1.15-1.15c0.09-0.09,0.15-0.22,0.15-0.35c0-0.28-0.22-0.5-0.5-0.5
			c-0.14,0-0.26,0.06-0.35,0.15l-2,2C4.05,5.23,3.99,5.35,3.99,5.49s0.06,0.26,0.15,0.35L6.14,7.85z M13.99,5.99c-1.1,0-2,0.9-2,2
			s0.9,2,2,2s2-0.9,2-2S15.1,5.99,13.99,5.99z M9.85,8.14C9.75,8.05,9.63,7.99,9.49,7.99c-0.28,0-0.5,0.22-0.5,0.5
			c0,0.14,0.06,0.26,0.15,0.35l1.15,1.15H4.49c-0.28,0-0.5,0.22-0.5,0.5s0.22,0.5,0.5,0.5h5.79l-1.15,1.15
			c-0.09,0.09-0.15,0.22-0.15,0.35c0,0.28,0.22,0.5,0.5,0.5c0.14,0,0.26-0.06,0.35-0.15l2-2c0.09-0.09,0.15-0.22,0.15-0.35
			s-0.06-0.26-0.15-0.35L9.85,8.14z"
    />
  </svg>
));

export const IconSplitRows = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
    transform="rotate(90)"
  >
    <path
      d="M12,10c0,0.55,0.45,1,1,1c0.28,0,0.53-0.11,0.71-0.29l2-2
			C15.89,8.53,16,8.28,16,8c0-0.28-0.11-0.53-0.29-0.71l-2-2C13.53,5.11,13.28,5,13,5c-0.55,0-1,0.45-1,1
			c0,0.28,0.11,0.53,0.29,0.71L12.59,7H9V2h3v1.71c0.31-0.13,0.64-0.21,1-0.21s0.69,0.08,1,0.21V1c0-0.55-0.45-1-1-1H3
			C2.45,0,2,0.45,2,1v2.71C2.31,3.58,2.64,3.5,3,3.5s0.69,0.08,1,0.21V2h3v5H3.41l0.29-0.29C3.89,6.53,4,6.28,4,6c0-0.55-0.45-1-1-1
			C2.72,5,2.47,5.11,2.29,5.29l-2,2C0.11,7.47,0,7.72,0,8c0,0.28,0.11,0.53,0.29,0.71l2,2C2.47,10.89,2.72,11,3,11
			c0.55,0,1-0.45,1-1c0-0.28-0.11-0.53-0.29-0.71L3.41,9H7v5H4v-1.71c-0.31,0.13-0.64,0.21-1,0.21s-0.69-0.08-1-0.21V15
			c0,0.55,0.45,1,1,1h10c0.55,0,1-0.45,1-1v-2.71c-0.31,0.13-0.64,0.21-1,0.21s-0.69-0.08-1-0.21V14H9V9h3.59l-0.29,0.29
			C12.11,9.47,12,9.72,12,10z"
    />
  </svg>
));

export const IconExport = createIcon(props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width={props.width}
    height={props.height}
    fill={props.color}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4,6c0.28,0,0.53-0.11,0.71-0.29L7,3.41V11c0,0.55,0.45,1,1,1s1-0.45,1-1V3.41
			l2.29,2.29C11.47,5.89,11.72,6,12,6c0.55,0,1-0.45,1-1c0-0.28-0.11-0.53-0.29-0.71l-4-4C8.53,0.11,8.28,0,8,0S7.47,0.11,7.29,0.29
			l-4,4C3.11,4.47,3,4.72,3,5C3,5.55,3.45,6,4,6z M15,11c-0.55,0-1,0.45-1,1v2H2v-2c0-0.55-0.45-1-1-1s-1,0.45-1,1v3
			c0,0.55,0.45,1,1,1h14c0.55,0,1-0.45,1-1v-3C16,11.45,15.55,11,15,11z"
    />
  </svg>
));
