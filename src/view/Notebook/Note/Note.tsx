import { assert, build, cloneExpr, Cr, Econ, JSONStringify, notImplemented, randUID, T, toLaTeX } from "../../../math";
import { flip as floatingFlip, getScrollParents, useFloating } from "@floating-ui/react-dom";
import { concat, entries, isEqual, isNil, keys, uniqBy, without } from "lodash";
import { useEffect, useRef, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import ReactMarkdown from "react-markdown";
import TextareaAutosize from "react-textarea-autosize";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { addMouseListener, mousePos } from "../../../common/globals";
import { useTheme } from "../../../common/theme";
import { cd, inRegion, SetUpdater, Updater, usePrevious } from "../../../common/utils";
import {
  DropdownSelect,
  IconCheck,
  IconDuplicate,
  IconEdit,
  IconExport,
  IconJson,
  IconLink,
  IconPlus,
  IconSplitRows,
  IconTrash,
} from "../../../common/widgets";
import { ExprEdit } from "./ExprEdit";

type ExprCellState = { uid: string; type: "econ"; econ: Econ };

type MarkdownCellState = { uid: string; type: "markdown"; src: string };

type NoteCellState = ExprCellState | MarkdownCellState;

export type NoteState = {
  cells: NoteCellState[];
};

export function Note(props: { state: NoteState; setState: SetUpdater<NoteState> }) {
  const theme = useTheme();
  const [state, _setState] = useState({
    exprBeingEdited: null as {
      econ: Econ;
      setEcon: (update: (old: Econ) => Econ) => void;
      session: string;
      fullScreen?: boolean;
    } | null,
    selectedCell: null as null | string,
    viceSelectedCell: [] as string[],
    draggedCell: null as null | NoteCellState,
  });

  const setState = _setState as (update: Updater<typeof state>) => void;

  useEffect(() =>
    addMouseListener("mouseup", 1, () => {
      setState(old => ({ ...old, draggedCell: null }));
    })
  );

  const cellContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = cellContainerRef.current!;
    if (isNil(container)) {
      return;
    }

    const rm1 = addMouseListener("mousemove", 0, () => {
      for (let i = 0; i < container.children.length; i++) {
        const child = container.children[i] as HTMLDivElement;
        child.style.filter = "";
      }

      if (isNil(state.draggedCell)) {
        return;
      }

      for (let i = 0; i < container.children.length; i++) {
        const child = container.children[i] as HTMLDivElement;
        const rect = child.getClientRects()[0];
        if (isNil(rect)) {
          return;
        }
        if (mousePos.y > rect.top && mousePos.y < rect.bottom) {
          child.style.filter = `drop-shadow(0px 5px ${theme.textReplace})`;
        }
      }

      if (isNil(state.draggedCell)) {
        return;
      }
    });

    const rm2 = addMouseListener("mouseup", 0, () => {
      if (isNil(state.draggedCell)) {
        return;
      }
      for (let i = 0; i < container.children.length; i++) {
        const child = container.children[i] as HTMLDivElement;
        const rect = child.getClientRects()[0];
        if (isNil(rect)) {
          return;
        }
        if (mousePos.y > rect.top && mousePos.y < rect.bottom) {
          props.setState(old => {
            const dc = state.draggedCell!;
            const newCells = [...old.cells];
            const di = newCells.findIndex(ic => ic.uid === dc.uid);
            if (di < 0 || di === i) return old;
            newCells.splice(di, 1);
            if (di < i) {
              newCells.splice(i, 0, dc);
            } else {
              newCells.splice(i + 1, 0, dc);
            }
            return { ...old, cells: newCells };
          });
        }
      }
    });

    return () => {
      rm1();
      rm2();
    };
  });

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", display: "flex" }}>
      {!(state.exprBeingEdited && state.exprBeingEdited.fullScreen) && (
        <div
          style={{
            minWidth: "50%",
            flex: "1 1",
            padding: theme.size / 4,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              className="clickable"
              style={{ display: "flex", padding: theme.size / 4 }}
              onClick={() => {
                if (!isNil(state.selectedCell)) {
                  const index = props.state.cells.findIndex(iterCell => iterCell.uid === state.selectedCell);
                  if (index >= 0) {
                    let newCells = [...props.state.cells];
                    newCells = newCells.filter(
                      i => i.uid !== state.selectedCell && !state.viceSelectedCell.includes(i.uid)
                    );
                    props.setState(old => ({ ...old, cells: newCells }));
                    setState(old => ({ ...old, selectedCell: null, exprBeingEdited: null }));
                  }
                }
              }}
            >
              <IconTrash />
            </div>
            <div
              className="clickable"
              style={{ display: "flex", alignItems: "center", padding: theme.size / 4, gap: theme.size / 4 }}
              onClick={() => {
                const newCell: NoteCellState = {
                  uid: randUID(),
                  type: "econ",
                  econ: { expr: { type: "PlaceHolder", uid: randUID() }, isyms: [] },
                };
                addNewCell(newCell);
              }}
            >
              <IconPlus />
              <div>Expression</div>
            </div>
            <div
              className="clickable"
              style={{ display: "flex", alignItems: "center", padding: theme.size / 4, gap: theme.size / 4 }}
              onClick={() => {
                const newCell: NoteCellState = { uid: randUID(), type: "markdown", src: "" };
                addNewCell(newCell);
              }}
            >
              <IconPlus />
              <div>Markdown</div>
            </div>
            <div
              className="clickable"
              style={{ display: "flex", padding: theme.size / 4 }}
              onClick={() => {
                if (!isNil(state.selectedCell) && state.viceSelectedCell.length > 0) {
                  const index = props.state.cells.findIndex(iterCell => iterCell.uid === state.selectedCell);
                  const chosenCells: [NoteCellState, number][] = [[props.state.cells[index], index]];
                  state.viceSelectedCell.forEach(c => {
                    const i = props.state.cells.findIndex(ic => ic.uid === c);
                    chosenCells.push([props.state.cells[i], i]);
                  });
                  chosenCells.sort((a, b) => a[1] - b[1]);
                  if (chosenCells.some(c => c[0].type !== "econ")) {
                    return;
                  }
                  let newISyms = chosenCells.map(cc => (cc[0] as ExprCellState).econ.isyms).flat();
                  newISyms = uniqBy(newISyms, iterIsym => iterIsym.suid);
                  let newExprs = chosenCells.map(cc => (cc[0] as ExprCellState).econ.expr);
                  newExprs = newExprs.map(e => (e.type === "Group" ? e.subs : e)).flat();
                  newExprs = newExprs.map(cloneExpr);
                  const newCell: ExprCellState = {
                    type: "econ",
                    uid: randUID(),
                    econ: {
                      isyms: newISyms,
                      expr: Cr.Group(...newExprs),
                    },
                  };
                  props.setState(old => {
                    let newCells = [...old.cells];
                    newCells.splice(index, 0, newCell);
                    newCells = newCells.filter(
                      c => c.uid !== state.selectedCell && !state.viceSelectedCell.includes(c.uid)
                    );
                    return { ...old, cells: newCells };
                  });
                }
              }}
            >
              <IconLink />
            </div>
            <div
              className="clickable"
              style={{ display: "flex", padding: theme.size / 4 }}
              onClick={() => {
                if (state.selectedCell) {
                  props.setState(old => {
                    const cells = [...old.cells];
                    const idx = cells.findIndex(i => i.uid === state.selectedCell);
                    if (idx < 0) {
                      return old;
                    }
                    const cell = cells[idx];
                    if (cell.type !== "econ") {
                      return old;
                    }
                    const { expr, isyms } = cell.econ;
                    if (expr.type !== "Group") {
                      return old;
                    }
                    const subs = expr.subs;
                    const newCells: ExprCellState[] = subs.map(sub => ({
                      type: "econ",
                      econ: { expr: sub, isyms },
                      uid: randUID(),
                    }));
                    cells.splice(idx, 1, ...newCells);
                    return { ...old, cells };
                  });
                }
              }}
            >
              <IconSplitRows />
            </div>
            <div
              className="clickable"
              style={{ display: "flex", padding: theme.size / 4 }}
              onClick={e =>
                state.selectedCell &&
                addNewCell({ ...cd(props.state.cells.find(i => i.uid === state.selectedCell)!), uid: randUID() })
              }
            >
              <IconDuplicate />
            </div>
            <CopyToClipboard
              text={props.state.cells
                .map((cell, i) => {
                  if (cell.type === "markdown") {
                    return cell.src
                      .split("\n")
                      .map(ln => ln.trim())
                      .map(ln => {
                        if (ln.startsWith("# ")) {
                          return `\\section{${ln.slice(2)}}`;
                        }
                        if (ln.startsWith("## ")) {
                          return `\\subsection{${ln.slice(3)}}`;
                        }
                        if (ln.startsWith("### ")) {
                          return `\\subsubsection{${ln.slice(4)}}`;
                        }
                        return ln;
                      })
                      .join("\n");
                  } else if (cell.type === "econ") {
                    const idx = props.state.cells.filter(c => c.type === "econ").indexOf(cell);
                    return `\\begin{align*}\n${toLaTeX(cell.econ)}\\tag{${idx + 1}}\n\\end{align*}`;
                  }
                  notImplemented();
                  return "";
                })
                .join("\n\n")}
            >
              <div
                className="clickable"
                style={{
                  display: "flex",
                  padding: theme.size / 4,
                }}
                onClick={e => [e.stopPropagation()]}
              >
                <IconExport />
              </div>
            </CopyToClipboard>
          </div>
          <div
            ref={cellContainerRef}
            style={{ overflow: "hidden auto", paddingBottom: 200 }}
          >
            {props.state.cells.map((cell, i) => {
              const selected = state.selectedCell === cell.uid;
              const dragged = state.draggedCell?.uid === cell.uid;
              return (
                <div
                  key={cell.uid}
                  className="note-cell"
                  style={{
                    border: selected
                      ? `solid 1px ${theme.textSelected}`
                      : state.viceSelectedCell.includes(cell.uid)
                      ? `solid 1px ${theme.textTouch}`
                      : "",
                    background: theme.bg1,
                    display: "flex",
                    filter: dragged ? "opacity(0.25)" : "",
                    width: "100%",
                  }}
                  onClick={e => {
                    if (e.shiftKey) {
                      setState(old => {
                        if (selected) {
                          return old;
                        }
                        if (!old.viceSelectedCell.includes(cell.uid)) {
                          return { ...old, viceSelectedCell: concat(old.viceSelectedCell, cell.uid) };
                        } else {
                          return { ...old, viceSelectedCell: without(old.viceSelectedCell, cell.uid) };
                        }
                      });
                    } else {
                      setState(old => ({ ...old, selectedCell: selected ? null : cell.uid, viceSelectedCell: [] }));
                    }
                  }}
                >
                  <div
                    className="draggable"
                    style={{ alignSelf: "stretch", width: theme.size / 2, background: theme.bg3 }}
                    onMouseDown={() => {
                      setState(old => ({ ...old, draggedCell: cell }));
                    }}
                  ></div>
                  <div style={{ flex: "1 1", overflow: "hidden" }}>
                    {cell.type === "markdown" ? (
                      <MarkdownCell
                        src={cell.src}
                        setSrc={src => {
                          props.setState(oldState => {
                            const newState = cd(oldState);
                            const index = newState.cells.findIndex(iterCell => iterCell.uid === cell.uid);
                            const newCell: NoteCellState = { ...cell, type: "markdown", src };
                            if (index === -1) {
                              newState.cells.push(newCell);
                            } else {
                              newState.cells[index] = newCell;
                            }
                            return newState;
                          });
                        }}
                      />
                    ) : (
                      (() => {
                        const econ = cell.econ;
                        const idx = props.state.cells.filter(c => c.type === "econ").indexOf(cell);
                        return (
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <div style={{ flex: "1 1" }}>
                              <ExprCell
                                cell={cell}
                                selected={state.selectedCell === cell.uid}
                                edit={() => {
                                  const session = randUID();
                                  const setEcon: (update: (old: Econ) => Econ) => void = update => {
                                    props.setState(oldState => {
                                      const newState = cd(oldState);
                                      const index = newState.cells.findIndex(iterCell => iterCell.uid === cell.uid);
                                      if (index >= 0) {
                                        const oldCell = newState.cells[index];
                                        assert(oldCell.type === "econ");
                                        const newEcon = update(oldCell.econ);
                                        const newCell: NoteCellState = { ...cell, type: "econ", econ: newEcon };
                                        newState.cells[index] = newCell;
                                        setState(old => ({
                                          ...old,
                                          exprBeingEdited: { ...old.exprBeingEdited!, econ: newEcon },
                                        }));
                                      }
                                      return newState;
                                    });
                                  };
                                  setState(old => ({ ...old, exprBeingEdited: { econ, setEcon, session } }));
                                }}
                                transform={newEcon => {
                                  addNewCell({ type: "econ", econ: newEcon, uid: randUID() });
                                }}
                              />
                            </div>
                            <div
                              style={{
                                paddingRight: theme.size,
                                fontSize: theme.size * 1.5,
                                fontFamily: "KaTeX_Main-Regular",
                              }}
                            >
                              ({idx + 1})
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {state.exprBeingEdited && (
        <div style={{ flex: "1 1", minWidth: "50%", borderLeft: `solid 1px ${theme.border}`, overflow: "hidden" }}>
          <ExprEdit
            key={state.exprBeingEdited.session}
            econ={state.exprBeingEdited.econ}
            setEcon={state.exprBeingEdited.setEcon}
            close={() => setState(old => ({ ...old, exprBeingEdited: null }))}
            fullScreen={() =>
              setState(old => ({
                ...old,
                exprBeingEdited: old.exprBeingEdited ? { ...old.exprBeingEdited, fullScreen: true } : null,
              }))
            }
          />
        </div>
      )}
    </div>
  );

  function addNewCell(newCell: NoteCellState) {
    props.setState(old => {
      const newCells = [...old.cells];
      const selectedIndex = newCells.findIndex(iterCell => iterCell.uid === state.selectedCell);
      if (selectedIndex === -1) {
        newCells.push(newCell);
      } else {
        newCells.splice(selectedIndex + 1, 0, newCell);
      }
      return {
        ...old,
        cells: newCells,
      };
    });
    setState(old => ({ ...old, selectedCell: newCell.uid }));
  }
}

function MarkdownCell(props: { src: string; setSrc: (src: string) => void }) {
  const theme = useTheme();

  const [render, setRender] = useState(props.src !== "");

  if (!render) {
    return (
      <div style={{}}>
        <TextareaAutosize
          style={{
            width: "100%",
            background: theme.bg2,
            color: theme.text1,
            resize: "none",
            overflow: "hidden",
          }}
          value={props.src}
          onChange={e => props.setSrc(e.target.value)}
        />
        <div style={{ display: "flex", justifyContent: "left" }}>
          <div className="clickable" style={{ display: "flex" }} onClick={() => setRender(true)}>
            <IconCheck />
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div
        style={{ padding: theme.size / 2 }}
        onDoubleClick={() => {
          setRender(false);
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} children={props.src} />
      </div>
    );
  }
}

function ExprCell(props: {
  cell: ExprCellState;
  edit: () => void;
  selected: boolean;
  transform: (newEcon: Econ) => void;
}) {
  const { econ } = props.cell;

  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  const { x, y, reference, floating, strategy, update, refs } = useFloating({
    placement: "bottom-start",
    middleware: [floatingFlip()],
  });

  const [state, setState] = useState({
    jsonSaved: false,
    texSaved: false,
  });

  const prevExpr = usePrevious(econ);

  useEffect(() => {
    if (isNil(ref.current)) return;
    if (isEqual(prevExpr, econ)) return;

    const container = ref.current;
    const { div } = build(econ);
    container.innerHTML = "";
    container.append(div);
    update();
  });

  // Update on scroll and resize for all relevant nodes
  useEffect(() => {
    if (props.selected) {
      if (!refs.reference.current || !refs.floating.current) {
        return;
      }

      const parents = [...getScrollParents(refs.reference.current), ...getScrollParents(refs.floating.current)];

      parents.forEach(parent => {
        parent.addEventListener("scroll", update);
        parent.addEventListener("resize", update);
      });

      return () => {
        parents.forEach(parent => {
          parent.removeEventListener("scroll", update);
          parent.removeEventListener("resize", update);
        });
      };
    }
  }, [refs.reference, refs.floating, update, props.selected]);

  return (
    <div>
      <div
        ref={reference}
        style={{ display: "flex", justifyContent: "center", padding: theme.size / 2, overflow: "auto hidden" }}
      >
        <div style={{ fontSize: theme.size * 2 }} ref={ref} />
      </div>
      {props.selected && (
        <div
          ref={floating}
          style={{
            display: "flex",
            position: strategy,
            top: y ?? "",
            left: x ?? "",
            background: theme.bg2,
            zIndex: 1,
          }}
        >
          <div
            className="clickable"
            style={{ display: "flex", padding: theme.size / 2 }}
            onClick={e => [e.stopPropagation(), props.edit()]}
          >
            <IconEdit />
          </div>
          <CopyToClipboard
            text={JSONStringify(props.cell)}
            onCopy={() => {
              setState(oldState => ({ ...oldState, jsonSaved: true }));
              setTimeout(() => setState(oldState => ({ ...oldState, jsonSaved: false })), 500);
            }}
          >
            <div
              className="clickable"
              style={{
                display: "flex",
                padding: theme.size / 2,
                background: state.jsonSaved ? theme.succeed : undefined,
              }}
              onClick={e => [e.stopPropagation()]}
            >
              <IconJson />
            </div>
          </CopyToClipboard>
          <CopyToClipboard
            text={toLaTeX(econ)}
            onCopy={() => {
              setState(oldState => ({ ...oldState, texSaved: true }));
              setTimeout(() => setState(oldState => ({ ...oldState, texSaved: false })), 500);
            }}
          >
            <div
              className="clickable"
              style={{
                display: "flex",
                padding: theme.size / 2,
                background: state.texSaved ? theme.succeed : undefined,
              }}
              onClick={e => [e.stopPropagation()]}
            >
              TeX
            </div>
          </CopyToClipboard>
          <ExprCellTransButtons buttonPadding={`${theme.size / 2}px`} econ={econ} transform={props.transform} />
        </div>
      )}
    </div>
  );
}

function ExprCellTransButtons(props: { econ: Econ; transform: (newEcon: Econ) => void; buttonPadding: string }) {
  const theme = useTheme();
  const [state, setState] = useState({
    openedTransGroup: null as null | keyof typeof T,
    transResult: null as null | "failed" | "succeed",
  });
  const ref = useRef<HTMLDivElement>(null);
  const timeouts = useRef<number[]>([]);

  useEffect(() => {
    const removeListener = addMouseListener("mouseup", 1, e => {
      if (ref.current) {
        const rect = ref.current.getClientRects()[0];
        if (rect) {
          if (!inRegion({ x: e.pageX, y: e.pageY }, rect)) {
            timeouts.current.push(window.setTimeout(() => setState(old => ({ ...old, openedTransGroup: null }))));
          }
        }
      }
    });
    return () => {
      removeListener();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      timeouts.current.forEach(id => clearTimeout(id));
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        background:
          state.transResult === "succeed" ? theme.succeed : state.transResult === "failed" ? theme.danger : "",
      }}
    >
      {entries(T).map(([groupName, groupTranses]) => (
        <DropdownSelect
          key={groupName}
          options={keys((T as any)[groupName])}
          open={state.openedTransGroup === groupName}
          select={transName => {
            try {
              const transformed = (groupTranses as any)[transName](props.econ);
              props.transform(transformed);
            } catch (e) {
              console.warn(e);

              setState(old => ({ ...old, transResult: "failed" }));
            }
            timeouts.current.push(window.setTimeout(() => setState(old => ({ ...old, transResult: null })), 500));
          }}
        >
          <div
            className="clickable"
            style={{ display: "flex", padding: props.buttonPadding }}
            onClick={e => [e.stopPropagation(), setState({ ...state, openedTransGroup: groupName as any })]}
          >
            {groupName}
          </div>
        </DropdownSelect>
      ))}
    </div>
  );
}
