import {
  build,
  Cases,
  Cr,
  Econ,
  editMatTrans,
  Equal,
  Expr,
  findAllAtDepth,
  findAllExprNode,
  findExprNodeByUid,
  findMaxDepth,
  findSameNodes,
  getIsym,
  I,
  ISym,
  ISymX,
  makeChar,
  makeDelims,
  makeHAtomList,
  makeSupSub,
  makeSymbol,
  Matrix,
  neverReach,
  notNil,
  oneOf,
  PlaceHolder,
  randUID,
  replaceExprNode,
  T,
  TeXBox,
  TMS,
  TMSM,
  traverseExprTree,
  TwE,
  validateExprTree,
} from "../../../math";
import { assign, entries, isNil, keys, remove, times, toPairs } from "lodash";
import { ReactElement, useEffect, useRef, useState } from "react";
import { addMouseListener, mousePos, removeMouseListener } from "../../../common/globals";
import { useTheme } from "../../../common/theme";
import { cd, distance, inRegion, modNumber, nearest, Position, regionCenter, Updater } from "../../../common/utils";
import {
  DiscreteSwitch,
  DraggableButton,
  DropdownButton,
  DropdownSelect,
  DropdownSelectButton,
  FloatingWindow,
  HotKeyButton,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconClose,
  IconFlows,
  IconMaximize,
  IconMinus,
  IconPlus,
  IconPropertiesFlipped,
  IconRedo,
  IconSelect,
  IconSettingsGear,
  IconTick,
  IconTrash,
  IconUndo,
  Input,
  TeXBoxIcon,
  TeXExpr,
} from "../../../common/widgets";

export function ExprEdit(props: {
  econ: Econ;
  setEcon: (update: (old: Econ) => Econ) => void;
  close: () => void;
  fullScreen: () => void;
}) {
  const theme = useTheme();

  const econHistory = useRef({ past: [] as Econ[], future: [] as Econ[] }).current;

  const [interState, setInterState] = useState(initExprInterState());

  const selectedIsym = isNil(interState.selectedIsym) ? null : getIsym(interState.selectedIsym);

  useEffect(() =>
    addMouseListener("mouseup", 1, () => {
      setInterState({ ...interState, draggedExprNode: null, draggedIsym: null });
    })
  );

  // SECTION ExprEdit
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* ANCHOR Top buttons
       */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex" }}>
            <HotKeyButton
              hotKey="Q"
              onClick={() =>
                setInterState({ ...interState, placeholderSelectionIndex: interState.placeholderSelectionIndex - 1 })
              }
            >
              <IconChevronLeft />
            </HotKeyButton>
            <HotKeyButton
              hotKey="W"
              onClick={() =>
                setInterState({ ...interState, placeholderSelectionIndex: interState.placeholderSelectionIndex + 1 })
              }
            >
              <IconChevronRight />
            </HotKeyButton>
            <HotKeyButton
              hotKey="E"
              onClick={() =>
                setInterState({ ...interState, exprNodeSelectionIndex: interState.exprNodeSelectionIndex - 1 })
              }
            >
              <IconChevronDown />
            </HotKeyButton>
            <HotKeyButton
              hotKey="R"
              onClick={() =>
                setInterState({ ...interState, exprNodeSelectionIndex: interState.exprNodeSelectionIndex + 1 })
              }
            >
              <IconChevronUp />
            </HotKeyButton>
            <HotKeyButton
              hotKey="T"
              onClick={() => setInterState({ ...interState, selectingExprNode: !interState.selectingExprNode })}
            >
              <IconSelect />
            </HotKeyButton>
            <HotKeyButton hotKey="Y" onClick={() => dispatchEvent({ type: "confirm" })}>
              <IconTick />
            </HotKeyButton>
            <div
              className="clickable"
              style={{
                background: interState.showCreators ? theme.bghlt : "",
                padding: theme.size / 4,
                display: "flex",
              }}
              onClick={() => setInterState({ ...interState, showCreators: !interState.showCreators })}
            >
              <IconPlus />
            </div>
            <div
              className="clickable"
              style={{ background: interState.showIsyms ? theme.bghlt : "", padding: theme.size / 4, display: "flex" }}
              onClick={() => setInterState({ ...interState, showIsyms: !interState.showIsyms })}
            >
              <TeXBoxIcon box={makeChar("x", "Math-Italic", TMS.D)} />
            </div>
            <div
              className="clickable"
              style={{
                background: interState.showSettings ? theme.bghlt : "",
                padding: theme.size / 4,
                display: "flex",
              }}
              onClick={() => setInterState({ ...interState, showSettings: !interState.showSettings })}
            >
              <IconSettingsGear />
            </div>
            <div
              className="clickable"
              style={{
                background: interState.showInfer ? theme.bghlt : "",
                padding: theme.size / 4,
                display: "flex",
              }}
              onClick={() => setInterState({ ...interState, showInfer: !interState.showInfer })}
            >
              <IconPropertiesFlipped />
            </div>
            <div
              className="clickable"
              style={{
                background: interState.showTrans ? theme.bghlt : "",
                padding: theme.size / 4,
                display: "flex",
              }}
              onClick={() => setInterState({ ...interState, showTrans: !interState.showTrans })}
            >
              <IconFlows />
            </div>
            <HotKeyButton
              hotKey={["ctrl", "Z"]}
              onClick={() => {
                if (econHistory.past.length > 0) {
                  const econ = econHistory.past.pop()!;
                  setEcon(old => econ, "future");
                }
              }}
            >
              <IconUndo />
            </HotKeyButton>
            <HotKeyButton
              hotKey={["ctrl", "shift", "Z"]}
              onClick={() => {
                if (econHistory.future.length > 0) {
                  const econ = econHistory.future.pop()!;
                  econHistory.past.push(cd(props.econ));
                  props.setEcon(old => econ);
                }
              }}
            >
              <IconRedo />
            </HotKeyButton>
            <HotKeyButton
              hotKey={"X"}
              onClick={() => {
                dispatchEvent({ type: "trash" });
              }}
            >
              <IconTrash />
            </HotKeyButton>
          </div>

          <div style={{ display: "flex" }}>
            <div
              className="clickable"
              style={{
                height: theme.size * 1.5,
                width: theme.size * 1.5,
                padding: theme.size / 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => props.fullScreen()}
            >
              <IconMaximize height={theme.size * (10 / 14)} width={theme.size * (10 / 14)} />
            </div>
            <div
              className="clickable"
              style={{
                height: theme.size * 1.5,
                width: theme.size * 1.5,
                padding: theme.size / 4,
                display: "flex",
                alignItems: "center",
              }}
              onClick={() => props.close()}
            >
              <IconClose />
            </div>
          </div>
        </div>
      </div>
      {/* ANCHOR Floating windows.
       */}
      <div style={{ display: "flex", position: "relative" }}>
        <FloatingWindow show={interState.showCreators}>
          <ExprCreators createExpr={newExpr => setInterState({ ...interState, draggedExprNode: newExpr })} />
        </FloatingWindow>
        <FloatingWindow show={interState.showIsyms} initialPosition={{ left: theme.size * 2, top: 0 }}>
          <ExprIsyms
            isyms={props.econ.isyms}
            setIsyms={isyms => setEcon(old => ({ ...old, isyms }))}
            selected={interState.selectedIsym}
            select={selected => setInterState(old => ({ ...old, selectedIsym: selected }))}
            drag={dragged => setInterState(old => ({ ...old, draggedIsym: dragged }))}
            touching={interState.touchingIsym}
            touch={touched => dispatchEvent({ type: "touchIsym", payload: touched })}
          />
        </FloatingWindow>
        <FloatingWindow
          show={!isNil(selectedIsym)}
          initialPosition={{ left: theme.size * 2 + 60, top: 0 }}
          close={() => setInterState({ ...interState, selectedIsym: null })}
        >
          {selectedIsym && (
            <ExprIsymDetail
              isym={selectedIsym}
              setIsym={newIsym => {
                props.setEcon(old => ({
                  ...old,
                  isyms: old.isyms.map(i => (i.suid === interState.selectedIsym ? newIsym : i)),
                }));
              }}
            />
          )}
        </FloatingWindow>
        <FloatingWindow
          show={!isNil(interState.selectedExprNode)}
          initialPosition={{ left: theme.size * 2 + 60, top: 80 }}
          close={() => setInterState({ ...interState, selectedExprNode: null })}
        >
          {interState.selectedExprNode && (
            <>
              <ExprNodeDetail
                node={interState.selectedExprNode}
                setNode={newNode => {
                  setInterState({
                    ...interState,
                    selectedExprNode: newNode,
                  });
                  dispatchEvent({
                    type: "updateSelectedNode",
                    payload: old => ({
                      ...old,
                      expr: replaceExprNode(old.expr, interState.selectedExprNode!.uid, newNode),
                    }),
                  });
                }}
              />
            </>
          )}
        </FloatingWindow>
        <FloatingWindow
          show={!isNil(interState.selectedExprNode) && interState.showInfer}
          initialPosition={{ left: 90, top: 200 }}
          close={() => setInterState({ ...interState, showInfer: false })}
        >
          {interState.selectedExprNode && interState.showInfer && (
            <>
              <ExprNodeInfer node={interState.selectedExprNode} isyms={props.econ.isyms} />
            </>
          )}
        </FloatingWindow>
        <FloatingWindow
          show={!isNil(interState.selectedExprNode) && interState.showTrans}
          initialPosition={{ left: 90, top: 200 }}
          close={() => setInterState({ ...interState, showTrans: false })}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {interState.selectedExprNode && interState.showTrans && (
              <>
                <ExprNodeTransButtons
                  econ={{ expr: interState.selectedExprNode, isyms: props.econ.isyms }}
                  buttonPadding={`${theme.size / 2}px`}
                  transform={newEcon => {
                    validateExprTree(newEcon.expr);
                    setInterState(old => ({ ...old, selectedExprNode: newEcon.expr }));
                    props.setEcon(old => ({ ...old, isyms: newEcon.isyms }));
                    dispatchEvent({
                      type: "updateSelectedNode",
                      payload: old => ({
                        ...old,
                        expr: replaceExprNode(old.expr, interState.selectedExprNode!.uid, newEcon.expr),
                      }),
                    });
                  }}
                  interState={interState}
                  setInterState={setInterState}
                />
              </>
            )}
          </div>
        </FloatingWindow>
        <FloatingWindow
          show={!isNil(interState.selectedExprNode) && interState.selectedExprNode.type === "Matrix"}
          initialPosition={{ left: 260, top: 80 }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {interState.selectedExprNode && interState.selectedExprNode.type === "Matrix" && (
              <>
                <ExprNodeMatrixEdit
                  econ={{ expr: interState.selectedExprNode, isyms: props.econ.isyms }}
                  setEcon={newEcon => {
                    setInterState(old => ({ ...old, selectedExprNode: newEcon.expr }));
                    props.setEcon(old => ({ ...old, isyms: newEcon.isyms }));
                    dispatchEvent({
                      type: "updateSelectedNode",
                      payload: old => ({
                        ...old,
                        expr: replaceExprNode(old.expr, interState.selectedExprNode!.uid, newEcon.expr),
                      }),
                    });
                  }}
                  interState={interState}
                  setInterState={setInterState}
                />
              </>
            )}
          </div>
        </FloatingWindow>
        <FloatingWindow show={interState.showSettings} initialPosition={{ left: 100, top: 100 }}>
          <div style={{ padding: theme.size / 4 }}>
            <div
              className="clickable"
              style={{
                background: interState.showSameNodesAsSelected ? theme.bg2 : "",
                whiteSpace: "pre",
                padding: theme.size / 4,
              }}
              onClick={() =>
                setInterState({ ...interState, showSameNodesAsSelected: !interState.showSameNodesAsSelected })
              }
            >
              Show same nodes as selected
            </div>
          </div>
        </FloatingWindow>
        <FloatingWindow
          show={!isNil(selectedIsym) && oneOf(selectedIsym.type, IsymTypeWithDomain)}
          initialPosition={{ left: 260, top: 0 }}
        >
          {selectedIsym && oneOf(selectedIsym.type, IsymTypeWithDomain) && (
            <ExprIsymDomain
              isym={selectedIsym as any}
              setIsym={newIsym => {
                const newIsyms = props.econ.isyms.map(i => (i.suid === interState.selectedIsym ? newIsym : i));
                setEcon(old => ({ ...old, isyms: newIsyms }));
              }}
              isyms={props.econ.isyms}
              interState={interState}
              setInterState={setInterState}
            />
          )}
        </FloatingWindow>
        <FloatingWindow
          show={!isNil(selectedIsym) && selectedIsym.type === "function"}
          initialPosition={{ left: 260, top: 0 }}
        >
          {selectedIsym && selectedIsym.type === "function" && (
            <ExprIsymFunction
              isym={selectedIsym}
              setIsym={newIsym => {
                const newIsyms = props.econ.isyms.map(i => (i.suid === interState.selectedIsym ? newIsym : i));
                setEcon(old => ({ ...old, isyms: newIsyms }));
              }}
              isyms={props.econ.isyms}
              interState={interState}
              setInterState={setInterState}
            />
          )}
        </FloatingWindow>
        <FloatingWindow
          show={!isNil(selectedIsym) && selectedIsym.type === "node-replacement"}
          initialPosition={{ left: 260, top: 0 }}
        >
          {selectedIsym && selectedIsym.type === "node-replacement" && (
            <ExprIsymReplaced
              isym={selectedIsym}
              setIsym={newIsym => {
                const newIsyms = props.econ.isyms.map(i => (i.suid === interState.selectedIsym ? newIsym : i));
                setEcon(old => ({ ...old, isyms: newIsyms }));
              }}
              isyms={props.econ.isyms}
              interState={interState}
              setInterState={setInterState}
            />
          )}
        </FloatingWindow>
      </div>
      {/* ANCHOR Inter
       */}
      <div style={{ flex: "1 1" }}>
        <ExprInter econ={props.econ} setEcon={setEcon} state={interState} setState={setInterState} />
      </div>

      {/* ANCHOR Dragger
       */}
      {interState.draggedExprNode && (
        <ExprDragger>
          {(() => {
            const placeholders = findAllExprNode(interState.draggedExprNode, "PlaceHolder");
            const box = build({ expr: interState.draggedExprNode, isyms: props.econ.isyms });
            if (placeholders.length > 0) {
              const index = modNumber(interState.placeholderSelectionIndex, placeholders.length);
              box.boxOf(placeholders[index]).div.style.color = theme.textSelected;
            }
            return <TeXExpr box={box} />;
          })()}
        </ExprDragger>
      )}
      {interState.draggedIsym && (
        <ExprDragger>
          <TeXExpr box={makeSymbol(getIsym(interState.draggedIsym).name, TMS.D)} />
        </ExprDragger>
      )}
    </div>
  );
  // !SECTION

  function setEcon(update: (old: Econ) => Econ, toHistory: "past" | "future" = "past") {
    if (toHistory === "past") {
      econHistory.future.splice(0);
      econHistory.past.push(cd(props.econ));
    } else {
      econHistory.future.push(cd(props.econ));
    }
    props.setEcon(update);
  }

  function getIsym(suid: string) {
    const isym = props.econ.isyms.find(i => i.suid === suid);
    notNil(isym);
    return isym;
  }
}

type ETAEvent =
  | { type: "trash" }
  | { type: "updateSelectedNode"; payload: Updater<Econ> }
  | { type: "touchIsym"; payload: string }
  | { type: "touchExprNode"; payload: Expr }
  | { type: "confirm" };
const eventListeners: [ETAEvent["type"], number, (e: ETAEvent) => void][] = [];

const addEventListener: <T extends ETAEvent["type"]>(
  type: T,
  order: -1 | 0 | 1,
  fn: (e: Extract<ETAEvent, { type: T }>) => void
) => () => void = (type, order, fn) => {
  eventListeners.push([type, order, fn as any]);
  eventListeners.sort((a, b) => a[1] - b[1]);
  return () => removeEventListener(fn);
};

const removeEventListener = (fn: any) => {
  remove(eventListeners, ([, , iterFn]) => iterFn === fn);
};

const dispatchEvent = (e: ETAEvent) => {
  eventListeners.slice().forEach(([iterType, , fn]) => iterType === e.type && fn(e));
};

const initExprInterState = () => ({
  exprNodeSelectionIndex: 0,
  placeholderSelectionIndex: 0,
  draggedExprNode: null as null | Expr,
  selectedExprNode: null as null | Expr,
  draggedIsym: null as null | string,
  selectedIsym: null as null | string,
  selectingExprNode: false,
  touchingExprNode: false,
  touchingIsym: false,
  showCreators: true,
  showIsyms: true,
  showSettings: false,
  showSameNodesAsSelected: true,
  showInfer: false,
  showTrans: false,
});

type ExprInterState = ReturnType<typeof initExprInterState>;
type SetExprInterState = (fn: (old: ExprInterState) => ExprInterState) => void;

const allExprInterPositions: [string, Position][] = [];

// SECTION ExprInter
function ExprInter(props: {
  econ: Econ;
  setEcon: (fn: (old: Econ) => Econ) => void;
  state: ExprInterState;
  setState: SetExprInterState;
  fontSize?: number;
}) {
  const { setEcon, state, setState } = props;

  const theme = useTheme();

  const shadeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const interUid = useRef(randUID()).current;

  useEffect(() =>
    addEventListener("trash", 0, () => {
      if (props.state.selectedExprNode) {
        props.setEcon(old => ({
          ...old,
          expr: replaceExprNode(old.expr, props.state.selectedExprNode!.uid, ph()),
        }));
      }
    })
  );

  useEffect(() =>
    addEventListener("updateSelectedNode", 0, e => {
      props.setEcon(e.payload);
    })
  );

  useEffect(() => {
    const container = containerRef.current;
    if (isNil(container)) return;
    if (container.getClientRects().length === 0) {
      return;
    }
    const center = regionCenter(container.getClientRects()[0]);
    allExprInterPositions.push([interUid, center]);

    const removeMouseListener = addMouseListener("mousemove", 0, () => {
      const container = containerRef.current;
      if (isNil(container)) return;
      if (container.getClientRects().length === 0) {
        return;
      }
      const center = regionCenter(container.getClientRects()[0]);
      const interUid = randUID();
      allExprInterPositions.map(i => (i[0] === interUid ? [interUid, center] : i));
    });

    return () => {
      remove(allExprInterPositions, i => i[0] === interUid);
      removeMouseListener();
    };
  }, [interUid]);

  useEffect(() => {
    const container = containerRef.current!;
    if (isNil(container)) return;
    const expr = props.econ.expr;
    const { div, boxOf } = build(props.econ);
    container.append(div);

    function update(type: "mousedown" | "mousemove" | "mouseup") {
      // Reset highlight of
      // - all nodes' color
      // - all nodes' background
      // - all nodes' left border
      // - highlight shade

      traverseExprTree(expr, node => (boxOf(node).div.style.color = ""));
      traverseExprTree(expr, node => (boxOf(node).div.style.backgroundColor = ""));
      traverseExprTree(expr, node => (boxOf(node).div.style.borderLeft = ""));
      if (shadeRef.current) {
        shadeRef.current.innerHTML = "";
      }

      if (container.getClientRects().length === 0) {
        return;
      }

      const selfDis = distance(regionCenter(container.getClientRects()[0]), mousePos);

      const isNearestInter = allExprInterPositions.every(i => i[0] === interUid || distance(i[1], mousePos) > selfDis);

      const allAvailableNodes = findAllAtDepth(expr, modNumber(state.exprNodeSelectionIndex, findMaxDepth(expr)));

      // ANCHOR Dragging expr node
      if (!isNil(state.draggedExprNode) && isNearestInter) {
        const nearestExprNode = nearest(mousePos, allAvailableNodes, node =>
          regionCenter(boxOf(node).div.getClientRects()[0])
        );
        const allPlaceholdersInDraggedNode = findAllExprNode(state.draggedExprNode, "PlaceHolder");

        // If any of following conditions is match, do nothing and return.
        // - no available node found
        // - nearest node is not a placeholder and no placeholder found in dragged node
        if (
          isNil(nearestExprNode) ||
          (nearestExprNode.type !== "PlaceHolder" && allPlaceholdersInDraggedNode.length === 0)
        ) {
          return;
        }

        // Highlight
        // - all available nodes
        // - nearest node
        allAvailableNodes.forEach(node => (boxOf(node).div.style.color = theme.textAvaiable));
        boxOf(nearestExprNode).div.style.color = theme.textSelected;

        // If mouseup
        if (type === "mouseup") {
          // If nearest node is a placeholder, insert new node into it.
          if (nearestExprNode.type === "PlaceHolder") {
            setEcon(old => ({ ...old, expr: replaceExprNode(expr, nearestExprNode.uid, state.draggedExprNode!) }));
          }

          // If nearest node is not a placeholder, insert node into dragged node's placeholder and replace it.
          else {
            const index = modNumber(state.placeholderSelectionIndex, allPlaceholdersInDraggedNode.length);
            setEcon(old => ({
              ...old,
              expr: replaceExprNode(
                expr,
                nearestExprNode.uid,
                replaceExprNode(state.draggedExprNode!, allPlaceholdersInDraggedNode[index].uid, nearestExprNode)
              ),
            }));
          }
        }
      }

      // ANCHOR Dragging isym
      else if (!isNil(state.draggedIsym) && isNearestInter) {
        const nearestPlaceholder = nearest(mousePos, findAllExprNode(expr, "PlaceHolder"), ph =>
          regionCenter(boxOf(ph).div.getClientRects()[0])
        );

        // If no placeholder found, do nothing and return.
        if (isNil(nearestPlaceholder)) {
          return;
        }

        // Highlight nearest placeholder.
        boxOf(nearestPlaceholder).div.style.color = theme.textSelected;

        // If mouseup
        if (type === "mouseup") {
          setEcon(old => ({
            ...old,
            expr: replaceExprNode(expr, nearestPlaceholder.uid, {
              type: "Symbol",
              uid: randUID(),
              isym: state.draggedIsym!,
            }),
          }));
        }
      }

      // ANCHOR Selecting node
      else if (state.selectingExprNode && isNearestInter) {
        const nearestExprNode = nearest(mousePos, allAvailableNodes, node =>
          regionCenter(boxOf(node).div.getClientRects()[0])
        );

        // If no available node found, do nothing and return.
        if (isNil(nearestExprNode)) {
          return;
        }

        // Highlight
        // - all available nodes
        // - nearest node
        allAvailableNodes.forEach(node => (boxOf(node).div.style.color = theme.textAvaiable));
        boxOf(nearestExprNode).div.style.color = theme.textSelected;

        // If mouswdown
        if (type === "mousedown") {
          setState(old => ({ ...old, selectingExprNode: false, selectedExprNode: nearestExprNode }));
        }
      }

      // ANCHOR Touhcing node
      else if (state.touchingExprNode && isNearestInter) {
        const nearestExprNode = nearest(mousePos, allAvailableNodes, node =>
          regionCenter(boxOf(node).div.getClientRects()[0])
        );

        // If no available node found, do nothing and return.
        if (isNil(nearestExprNode)) {
          return;
        }

        // Highlight
        // - all available nodes
        // - nearest node
        allAvailableNodes.forEach(node => (boxOf(node).div.style.color = theme.textAvaiable));
        boxOf(nearestExprNode).div.style.color = theme.textTouch;

        // If mouswdown
        if (type === "mousedown") {
          dispatchEvent({ type: "touchExprNode", payload: nearestExprNode });
        }
      }

      // ANCHOR Selected node
      if (state.selectedExprNode) {
        if (isNil(findExprNodeByUid(props.econ.expr, state.selectedExprNode.uid))) {
          return;
        }

        const rect = boxOf(state.selectedExprNode).div.getClientRects()[0];
        if (shadeRef.current && rect) {
          const { left, top, height, width } = rect;
          const newShade = document.createElement("div");
          newShade.className = "selection-box";

          assign(newShade.style, {
            left: `${left - 2}px`,
            top: `${top - 2}px`,
            height: `${height + 4}px`,
            width: `${width + 4}px`,
            border: `solid 1px ${theme.textSelected}`,
          });
          shadeRef.current.append(newShade);
        }
        if (state.showSameNodesAsSelected && shadeRef.current) {
          const sameNodes = findSameNodes(props.econ.expr, state.selectedExprNode);
          for (const sn of sameNodes) {
            const box = boxOf(sn);
            const rect = box.div.getClientRects()[0];
            if (rect) {
              const { left, top, height, width } = rect;
              const newShade = document.createElement("div");
              newShade.className = "selection-box";
              assign(newShade.style, {
                left: `${left - 2}px`,
                top: `${top - 2}px`,
                height: `${height + 4}px`,
                width: `${width + 4}px`,
                border: `dashed 1px ${theme.textSelected}`,
              });
              shadeRef.current.append(newShade);
            }
          }
        }
      }
    }
    // !SECTION

    update("mousemove");
    const onMouse = (e: MouseEvent) => update(e.type as any);
    addMouseListener("mousedown", 0, onMouse);
    addMouseListener("mousemove", 0, onMouse);
    addMouseListener("mouseup", 0, onMouse);
    return () => {
      container.innerHTML = "";
      removeMouseListener(onMouse);
    };
  });

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontSize: props.fontSize ?? theme.size * 2 }} ref={containerRef} />
      <div ref={shadeRef} />
    </div>
  );
}

function ExprDragger(props: { children: ReactElement }) {
  const ref = useRef<HTMLDivElement>(null);

  function updateDivPos() {
    const div = ref.current;
    if (isNil(div)) return;
    div.style.left = `${mousePos.x}px`;
    div.style.top = `${mousePos.y}px`;
    div.style.visibility = "visible";
  }

  useEffect(() => {
    const draggerDiv = ref.current;
    if (isNil(draggerDiv)) return;
    const _cursor = document.body.style.cursor;
    document.body.style.cursor = "crosshair";

    addMouseListener("mousemove", 0, updateDivPos);
    return () => {
      removeMouseListener(updateDivPos);
      document.body.style.cursor = _cursor;
    };
  });

  return (
    <div ref={ref} style={{ position: "fixed", visibility: "hidden", zIndex: 2 }}>
      {props.children}
    </div>
  );
}

function ExprCreators(props: { createExpr: (expr: Expr) => void }) {
  const theme = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {exprCreators.map(({ name, tex, newExpr }) => {
        return (
          <DraggableButton key={name} onStartDragging={() => props.createExpr(newExpr())}>
            <div className="clickable" style={{ display: "flex", padding: theme.size / 4 }}>
              <TeXBoxIcon box={tex()} />
            </div>
          </DraggableButton>
        );
      })}
    </div>
  );
}

const exprCreators: {
  name: string;
  tex: () => TeXBox;
  newExpr: () => Expr;
}[] = [
  {
    name: "Equal",
    tex: () => makeChar("=", "Main-Regular", TMS.D),
    newExpr: () => ({ type: "Equal", uid: randUID(), left: ph(), right: ph() }),
  },
  {
    name: "Rational",
    tex: () => makeChar("1", "Main-Regular", TMS.D),
    newExpr: () => ({ type: "Rational", uid: randUID(), p: 1n, q: 1n }),
  },
  {
    name: "i",
    tex: () => makeChar("i", "Math-Italic", TMS.D),
    newExpr: Cr.i,
  },
  {
    name: "e",
    tex: () => makeChar("e", "Math-Italic", TMS.D),
    newExpr: Cr.e,
  },
  {
    name: "pi",
    tex: () => makeChar("\\pi", "Math-Italic", TMS.D),
    newExpr: Cr.pi,
  },
  {
    name: "infty",
    tex: () => makeChar("\\infty", "Main-Regular", TMS.D),
    newExpr: () => ({ type: "SpecialConstant", uid: randUID(), name: "infty" }),
  },
  {
    name: "Add",
    tex: () => makeChar("+", "Main-Regular", TMS.D),
    newExpr: () => Cr.Add(ph(), ph()),
  },
  {
    name: "Mul",
    tex: () => makeChar("\\times", "Main-Regular", TMS.D),
    newExpr: () => Cr.Mul(ph(), ph()),
  },
  {
    name: "Fraction",
    tex: () => makeChar("\\div", "Main-Regular", TMS.D),
    newExpr: () => ({ type: "Fraction", uid: randUID(), num: ph(), den: ph() }),
  },
  {
    name: "Compare",
    tex: () => makeChar("<", "Main-Regular", TMS.D),
    newExpr: () => ({ type: "Compare", uid: randUID(), first: ph(), rest: [["<", ph()]] }),
  },
  {
    name: "LogicOp",
    tex: () => makeChar("\\lor", "Main-Regular", TMS.D),
    newExpr: () => ({ type: "LogicOp", op: "\\land", subs: [ph(), ph()], uid: randUID() }),
  },
  {
    name: "Pow",
    tex: () =>
      makeSupSub(makeChar("x", "Math-Italic", TMS.D), makeChar("y", "Math-Italic", TMSM.sup[TMS.D]), undefined, TMS.D),
    newExpr: () => Cr.Pow(ph(), ph()),
  },
  {
    name: "Norm",
    tex: () => makeDelims("|", makeChar("x", "Math-Italic", TMS.D), "|", TMS.D),
    newExpr: () => ({ type: "Norm", uid: randUID(), sub: ph() }),
  },
  {
    name: "ComplexConjudage",
    tex: () =>
      makeSupSub(makeChar("x", "Math-Italic", TMS.D), makeChar("*", "Main-Regular", TMSM.sup[TMS.D]), undefined, TMS.D),
    newExpr: () => ({ type: "ComplexConjugate", uid: randUID(), sub: ph() }),
  },
  {
    name: "Derivative",
    tex: () => makeHAtomList([makeChar("d", "Math-Italic", TMS.D)], TMS.D),
    newExpr: () => Cr.Derivative(ph(), ph(), 1n),
  },
  {
    name: "SpecialFunction",
    tex: () =>
      makeHAtomList(
        [..."fn"].map(c => makeChar(c, "Main-Regular", TMS.D)),
        TMS.D
      ),
    newExpr: () => Cr.SpecialFunction("sin", ph()),
  },
  {
    name: "Matrix",
    tex: () =>
      makeHAtomList(
        [
          makeChar("[", "Main-Regular", TMS.D),
          makeChar("x", "Math-Italic", TMS.D),
          makeChar("]", "Main-Regular", TMS.D),
        ],
        TMS.D
      ),
    newExpr: () => Cr.Matrix([[ph()]]),
  },
  {
    name: "Integral",
    tex: () => makeChar("\\int", "Main-Regular", TMS.D),
    newExpr: () => ({ type: "Integral", uid: randUID(), integrand: ph(), var: ph() }),
  },
  {
    name: "Cases",
    tex: () => makeChar("{", "Main-Regular", TMS.D),
    newExpr: () => ({
      type: "Cases",
      uid: randUID(),
      subs: [
        { expr: ph(), cond: ph() },
        { expr: ph(), cond: ph() },
      ],
    }),
  },
  {
    name: "Group",
    tex: () => makeChar("G", "Main-Regular", TMS.D),
    newExpr: () => ({ type: "Group", uid: randUID(), subs: [ph(), ph()] }),
  },
];

const ph: () => PlaceHolder = () => ({
  type: "PlaceHolder",
  uid: randUID(),
});

function ExprIsyms(props: {
  isyms: readonly ISym[];
  setIsyms: (isyms: ISym[]) => void;
  selected: string | null;
  select: (selected: string | null) => void;
  drag: (dragged: string) => void;
  touching: boolean;
  touch: (isym: string) => void;
}) {
  const theme = useTheme();
  const [state, setState] = useState({
    showCreate: false,
  });
  return (
    <div style={{ width: 50 }}>
      <div style={{}}>
        <DropdownSelect
          options={["variable", "function", "constant", "indeterminate-constant", "context"]}
          open={state.showCreate}
          close={() => setState({ ...state, showCreate: false })}
          select={op => {
            let newIsym: ISym;
            if (op === "variable") {
              newIsym = { type: "variable", name: "x", suid: randUID(), domain: { type: "Z" } };
            } else if (op === "function") {
              newIsym = { type: "function", name: "x", suid: randUID(), vars: [] };
            } else if (op === "constant") {
              newIsym = { type: "constant", name: "x", suid: randUID(), domain: { type: "Z" } };
            } else if (op === "indeterminate-constant") {
              newIsym = { type: "indeterminate-constant", name: "x", suid: randUID(), domain: { type: "Z" } };
            } else if (op === "context") {
              newIsym = { type: "context", name: "x", suid: randUID() };
            } else {
              neverReach();
            }
            const index = props.isyms.findIndex(i => i.suid === props.selected);
            const newIsyms = [...props.isyms];
            if (index >= 0) {
              newIsyms.splice(index + 1, 0, newIsym);
            } else {
              newIsyms.push(newIsym);
            }
            props.setIsyms(newIsyms);
            props.select(newIsym.suid);
          }}
        >
          <div
            className="clickable"
            style={{ display: "flex", flex: "1 1", justifyContent: "center" }}
            onClick={() => setState({ ...state, showCreate: true })}
          >
            <IconPlus />
          </div>
        </DropdownSelect>
      </div>
      <div>
        {props.isyms.map(isym => {
          const selected = props.selected ? isym.suid === props.selected : false;
          return (
            <DraggableButton key={isym.suid} onStartDragging={() => props.drag(isym.suid)}>
              <div
                key={isym.suid}
                className="clickable"
                style={{ padding: theme.size / 4, background: selected ? theme.bghlt : "" }}
                onClick={() => {
                  if (props.touching) {
                    props.touch(isym.suid);
                  } else {
                    props.select(selected ? null : isym.suid);
                  }
                }}
              >
                <TeXExpr box={makeSymbol(isym.name, TMS.D)} />
              </div>
            </DraggableButton>
          );
        })}
      </div>
    </div>
  );
}

function ExprIsymDetail(props: { isym: ISym; setIsym: (isym: ISym) => void }) {
  const theme = useTheme();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "50px 100px",
        padding: theme.size / 2,
        position: "relative",
      }}
    >
      <div style={{ color: theme.text2 }}>Name</div>
      <Input
        value={props.isym.name}
        setValue={newName => props.setIsym({ ...props.isym, name: newName })}
        validate={newName => {
          try {
            makeSymbol(newName, TMS.D);
            return true;
          } catch (error) {
            return false;
          }
        }}
      />

      <div style={{ color: theme.text2 }}>suid</div>
      <div
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: theme.text2,
        }}
      >
        {props.isym.suid}
      </div>
      <div style={{ color: theme.text2 }}>Type</div>

      <div style={{ color: theme.text2, whiteSpace: "pre", textOverflow: "ellipsis", overflow: "hidden" }}>
        {props.isym.type}
      </div>
    </div>
  );
}

const IsymTypeWithDomain = ["constant", "variable", "indeterminate-constant"] as const;
function ExprIsymDomain(props: {
  isym: ISymX<(typeof IsymTypeWithDomain)[number]>;
  setIsym: (newIsym: ISym) => void;
  isyms: readonly ISym[];
  interState: ExprInterState;
  setInterState: SetExprInterState;
}) {
  const theme = useTheme();
  return (
    <div>
      <div
        style={{ padding: theme.size / 2, display: "grid", gridTemplateColumns: "50px 100px", alignItems: "center" }}
      >
        <div style={{ color: theme.text2 }}>Type</div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            className="clickable"
            style={{ padding: theme.size / 4, background: props.isym.domain.type === "Z" ? theme.bghlt : "" }}
            onClick={() => props.setIsym({ ...props.isym, domain: { type: "Z" } })}
          >
            <TeXBoxIcon height={theme.size * (3 / 4)} box={makeChar("Z", "AMS-Regular", TMS.D)} />
          </div>
          <div
            className="clickable"
            style={{ padding: theme.size / 4, background: props.isym.domain.type === "R" ? theme.bghlt : "" }}
            onClick={() => props.setIsym({ ...props.isym, domain: { type: "R" } })}
          >
            <TeXBoxIcon height={theme.size * (3 / 4)} box={makeChar("R", "AMS-Regular", TMS.D)} />
          </div>
          <div
            className="clickable"
            style={{ padding: theme.size / 4, background: props.isym.domain.type === "R-expr" ? theme.bghlt : "" }}
            onClick={() => props.setIsym({ ...props.isym, domain: { type: "R-expr", expr: ph() } })}
          >
            R-expr
          </div>
        </div>
      </div>
      {props.isym.domain.type === "R-expr" && (
        <div style={{ padding: theme.size / 2 }}>
          <ExprInter
            econ={{ expr: props.isym.domain.expr, isyms: props.isyms }}
            setEcon={update => {
              const { expr } = update({ expr: (props.isym.domain as any).expr, isyms: props.isyms });
              props.setIsym({ ...props.isym, domain: { ...props.isym.domain, type: "R-expr", expr } });
            }}
            state={props.interState}
            setState={props.setInterState}
          />
        </div>
      )}
    </div>
  );
}

function ExprIsymFunction(props: {
  isym: ISymX<"function">;
  setIsym: (newIsym: ISym) => void;
  isyms: readonly ISym[];
  interState: ExprInterState;
  setInterState: SetExprInterState;
}) {
  const theme = useTheme();
  return (
    <div>
      <div
        style={{
          padding: theme.size / 2,
          display: "grid",
          gridTemplateColumns: "50px minmax(100px, auto)",
          alignItems: "center",
        }}
      >
        <div style={{ color: theme.text2 }}>Vars</div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            className="clickable"
            style={{ display: "flex", padding: theme.size / 4 }}
            onClick={() => {
              props.setInterState(old => ({ ...old, touchingIsym: true }));
              const rm = addEventListener("touchIsym", 0, e => {
                props.setInterState(old => ({ ...old, touchingIsym: false }));
                rm();
                if (!props.isym.vars.includes(e.payload)) {
                  props.setIsym({ ...props.isym, vars: [...props.isym.vars, e.payload] });
                }
              });
            }}
          >
            <IconPlus />
          </div>
          {props.isym.vars.map(v => {
            const vIsym = getIsym(props.isyms, v)!;
            return (
              <div key={v}>
                <TeXBoxIcon box={makeSymbol(vIsym.name, TMS.D)} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ExprIsymReplaced(props: {
  isym: ISymX<"node-replacement">;
  setIsym: (newIsym: ISym) => void;
  isyms: readonly ISym[];
  interState: ExprInterState;
  setInterState: SetExprInterState;
}) {
  const { replaced } = props.isym;
  const theme = useTheme();
  return (
    <div style={{ padding: theme.size / 2 }}>
      <ExprInter
        econ={{ expr: replaced, isyms: props.isyms }}
        setEcon={update => {
          const { expr } = update({ expr: replaced, isyms: props.isyms });
          props.setIsym({ ...props.isym, replaced: expr });
        }}
        state={props.interState}
        setState={props.setInterState}
        fontSize={theme.size}
      />
    </div>
  );
}

function ExprNodeDetail(props: { node: Expr; setNode: (node: Expr) => void }) {
  const theme = useTheme();

  return (
    <div style={{ display: "grid", alignItems: "center", gridTemplateColumns: "50px 100px", padding: theme.size / 2 }}>
      <div style={{ color: theme.text2 }}>Type</div>
      <div>{props.node.type}</div>
      <div style={{ color: theme.text2 }}>uid</div>
      <div
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: theme.text2,
        }}
      >
        {props.node.uid}
      </div>
      <div style={{ color: theme.text2 }}>Parens</div>
      <div
        className="clickable"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
        onClick={() => {
          props.setNode({
            ...props.node,
            parenthesis: isNil(props.node.parenthesis) ? false : !props.node.parenthesis ? true : undefined,
          });
        }}
      >
        {isNil(props.node.parenthesis) ? <div>auto</div> : !props.node.parenthesis ? <div>off</div> : <div>on</div>}
      </div>
      {props.node.type === "Rational" && (
        <>
          <div style={{ color: theme.text2 }}>p</div>
          <Input
            value={props.node.p.toString()}
            setValue={newValue => props.setNode({ ...props.node, p: BigInt(newValue) } as any)}
            validate={newValue => {
              try {
                BigInt(newValue);
                return true;
              } catch (error) {
                return false;
              }
            }}
          />
          <div style={{ color: theme.text2 }}>q</div>
          <Input
            value={props.node.q.toString()}
            setValue={newValue => props.setNode({ ...props.node, q: BigInt(newValue) } as any)}
            validate={newValue => {
              try {
                BigInt(newValue);
                return true;
              } catch (error) {
                return false;
              }
            }}
          />
        </>
      )}
      {props.node.type === "Derivative" && (
        <>
          <div style={{ color: theme.text2 }}>order</div>
          <DiscreteSwitch
            min={1n}
            value={props.node.order}
            setValue={order => props.setNode({ ...props.node, order } as any)}
          />
        </>
      )}
      {props.node.type === "Cases" && (
        <>
          <div style={{ color: theme.text2 }}>Subs</div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              className="clickable"
              style={{ display: "flex", padding: theme.size / 4 }}
              onClick={() =>
                props.setNode({
                  ...props.node,
                  cases: [...(props.node as any).cases, { expr: ph(), cond: ph() }],
                } as any)
              }
            >
              <IconPlus />
            </div>
            <div
              className="clickable"
              style={{ display: "flex", padding: theme.size / 4 }}
              onClick={() =>
                props.setNode({
                  ...props.node,
                  cases: (props.node as Cases).subs.filter(
                    ({ expr, cond }) => expr.type !== "PlaceHolder" || cond.type !== "PlaceHolder"
                  ),
                } as any)
              }
            >
              <IconMinus />
            </div>
          </div>
        </>
      )}
      {props.node.type === "Compare" && (
        <>
          <div style={{ color: theme.text2 }}>Subs</div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              className="clickable"
              style={{ display: "flex", padding: theme.size / 4 }}
              onClick={() => props.setNode({ ...props.node, rest: [...(props.node as any).rest, ["<", ph()]] } as any)}
            >
              <IconPlus />
            </div>
            {props.node.rest.map(([op, expr], i) => (
              <DropdownButton
                icon={<TeXBoxIcon box={makeChar(op, "Main-Regular", TMS.D)} />}
                content={
                  <div>
                    <div
                      className="clickable"
                      style={{ display: "flex", padding: theme.size / 4 }}
                      onClick={() => {
                        const newRest = cd((props.node as any).rest);
                        newRest[i] = ["<", newRest[i][1]];
                        props.setNode({ ...props.node, rest: newRest } as any);
                      }}
                    >
                      <TeXBoxIcon box={makeChar("<", "Main-Regular", TMS.D)} />
                    </div>
                    <div
                      className="clickable"
                      style={{ display: "flex", padding: theme.size / 4 }}
                      onClick={() => {
                        const newRest = cd((props.node as any).rest);
                        newRest[i] = [">", newRest[i][1]];
                        props.setNode({ ...props.node, rest: newRest } as any);
                      }}
                    >
                      <TeXBoxIcon box={makeChar(">", "Main-Regular", TMS.D)} />
                    </div>
                    <div
                      className="clickable"
                      style={{ display: "flex", padding: theme.size / 4 }}
                      onClick={() => {
                        const newRest = cd((props.node as any).rest);
                        newRest[i] = ["\\le", newRest[i][1]];
                        props.setNode({ ...props.node, rest: newRest } as any);
                      }}
                    >
                      <TeXBoxIcon box={makeChar("\\le", "Main-Regular", TMS.D)} />
                    </div>
                    <div
                      className="clickable"
                      style={{ display: "flex", padding: theme.size / 4 }}
                      onClick={() => {
                        const newRest = cd((props.node as any).rest);
                        newRest[i] = ["\\ge", newRest[i][1]];
                        props.setNode({ ...props.node, rest: newRest } as any);
                      }}
                    >
                      <TeXBoxIcon box={makeChar("\\ge", "Main-Regular", TMS.D)} />
                    </div>
                  </div>
                }
              />
            ))}
          </div>
        </>
      )}
      {props.node.type === "LogicOp" && (
        <>
          <div style={{ color: theme.text2 }}>Op</div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              className="clickable"
              style={{
                display: "flex",
                background: props.node.op === "\\land" ? theme.bghlt : "",
                justifyContent: "center",
                alignItems: "center",
                padding: theme.size / 4,
              }}
              onClick={() => props.setNode({ ...props.node, op: "\\land" } as any)}
            >
              <TeXBoxIcon box={makeChar("\\land", "Main-Regular", TMS.D)} />
            </div>
            <div
              className="clickable"
              style={{
                display: "flex",
                background: props.node.op === "\\lor" ? theme.bghlt : "",
                justifyContent: "center",
                alignItems: "center",
                padding: theme.size / 4,
              }}
              onClick={() => props.setNode({ ...props.node, op: "\\lor" } as any)}
            >
              <TeXBoxIcon box={makeChar("\\lor", "Main-Regular", TMS.D)} />
            </div>
          </div>
        </>
      )}
      {(props.node.type === "Add" ||
        props.node.type === "Mul" ||
        props.node.type === "LogicOp" ||
        props.node.type === "Group") && (
        <>
          <div style={{ color: theme.text2 }}>Subs</div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              className="clickable"
              style={{ display: "flex", padding: theme.size / 4 }}
              onClick={() => {
                props.setNode({ ...props.node, subs: [...(props.node as any).subs, ph()] } as any);
              }}
            >
              <IconPlus />
            </div>
            <div
              className="clickable"
              style={{ display: "flex", padding: theme.size / 4 }}
              onClick={() => {
                const newSubs = ((props.node as any).subs as Expr[]).filter(sub => sub.type !== "PlaceHolder");
                if (newSubs.length === 0) {
                  newSubs.push(Cr.PlaceHolder());
                } else if (newSubs.length === 1) {
                  props.setNode(newSubs[0]);
                } else {
                  props.setNode({ ...props.node, subs: newSubs } as any);
                }
              }}
            >
              <IconMinus />
            </div>
          </div>
        </>
      )}
      {props.node.type === "Equal" && (
        <>
          <div style={{ color: theme.text2 }}>Subs</div>
          <div style={{ display: "flex" }}>
            <div
              className="clickable"
              style={{ display: "flex", padding: theme.size / 4 }}
              onClick={() => {
                const { left, right } = props.node as Equal;
                if (left.type === "PlaceHolder") {
                  props.setNode(right);
                } else if (right.type === "PlaceHolder") {
                  props.setNode(left);
                }
              }}
            >
              <IconMinus />
            </div>
          </div>
        </>
      )}
      {props.node.type === "Matrix" && (
        <>
          <div style={{ color: theme.text2 }}>Size</div>
          <div>
            {props.node.subs.length} x {props.node.subs[0].length}
          </div>
          <div style={{ color: theme.text2 }}>Subs</div>
          {(() => {
            const node = props.node;
            const [, n] = [node.subs.length, node.subs[0].length];
            return (
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  className="clickable"
                  style={{ display: "flex", padding: theme.size / 4 }}
                  onClick={() => {
                    props.setNode({ ...props.node, type: "Matrix", subs: [...node.subs, times(n, () => ph())] });
                  }}
                >
                  <IconPlus />
                </div>
                <div
                  className="clickable"
                  style={{ display: "flex", padding: theme.size / 4 }}
                  onClick={() => {
                    props.setNode({ ...props.node, type: "Matrix", subs: node.subs.map(row => [...row, ph()]) });
                  }}
                >
                  <IconPlus />
                </div>
                <div className="clickable" style={{ display: "flex", padding: theme.size / 4 }} onClick={() => {}}>
                  <IconMinus />
                </div>
              </div>
            );
          })()}
        </>
      )}
      {props.node.type === "SpecialFunction" && (
        <>
          <div style={{ color: theme.text2 }}>Func</div>
          <div style={{ display: "flex" }}>
            <DropdownSelectButton
              icon={<span>{props.node.name}</span>}
              options={["sin", "arcsin", "cos", "arccos", "tan", "det", "ln"]}
              select={v => {
                props.setNode({ ...props.node, name: v } as any);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function ExprNodeInfer(props: { node: Expr; isyms: readonly ISym[] }) {
  const theme = useTheme();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto auto",
        alignItems: "center",
        padding: theme.size / 2,
        gap: theme.size / 2,
      }}
    >
      {toPairs(I.infer).map(([name, fn]) => {
        const match = fn({ expr: props.node, isyms: props.isyms });
        return (
          <>
            <div>{name}</div>
            <div
              style={{
                height: theme.size * (3 / 4),
                width: theme.size * (3 / 4),
                borderRadius: theme.size / 2,
                border: `solid 1px ${match ? theme.textSucceed : theme.textDanger}`,
                background: match ? theme.succeed : theme.danger,
              }}
            />
          </>
        );
      })}
    </div>
  );
}

function ExprNodeTransButtons(props: {
  econ: Econ;
  transform: (newEcon: Econ) => void;
  buttonPadding: string;
  interState: ExprInterState;
  setInterState: SetExprInterState;
}) {
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
      {entries(T).map(([groupName, groupTranses]) =>
        (() => {
          const hasTwE = groupName in TwE;
          const transNames = keys((T as any)[groupName]);

          const TwETrans: any[] = [];
          if (hasTwE) {
            transNames.push(...keys((TwE as any)[groupName]));
            TwETrans.push(...(entries((TwE as any)[groupName]) as any));
          }
          return (
            <DropdownSelect
              key={groupName}
              options={transNames}
              open={state.openedTransGroup === groupName}
              select={transName => {
                if (hasTwE && TwETrans.map(i => i[0]).includes(transName)) {
                  props.setInterState(old => ({ ...old, touchingExprNode: true }));
                  const trans = TwETrans.find(i => i[0] === transName)!;
                  const extraArgs: Expr[] = [];
                  const extraCount: number = trans[1].extraArgCount;
                  const rm = addEventListener("touchExprNode", 0, e => {
                    extraArgs.push(e.payload);
                    if (extraCount >= 0 && extraArgs.length >= extraCount) {
                      rm();
                      props.setInterState(old => ({ ...old, touchingExprNode: false }));
                      try {
                        const transformed = trans[1].fn(props.econ, ...extraArgs);
                        props.transform(transformed);
                        setState(old => ({ ...old, transResult: "succeed" }));
                      } catch (e) {
                        console.warn(e);
                        setState(old => ({ ...old, transResult: "failed" }));
                      }
                      timeouts.current.push(
                        window.setTimeout(() => setState(old => ({ ...old, transResult: null })), 500)
                      );
                    }
                  });
                  if (extraCount === -1) {
                    const rm2 = addEventListener("confirm", 0, e => {
                      rm();
                      rm2();
                      props.setInterState(old => ({ ...old, touchingExprNode: false }));
                      try {
                        const transformed = trans[1].fn(props.econ, ...extraArgs);
                        props.transform(transformed);
                        setState(old => ({ ...old, transResult: "succeed" }));
                      } catch (e) {
                        console.warn(e);
                        setState(old => ({ ...old, transResult: "failed" }));
                      }
                      timeouts.current.push(
                        window.setTimeout(() => setState(old => ({ ...old, transResult: null })), 500)
                      );
                    });
                  }
                } else {
                  try {
                    const transformed = (groupTranses as any)[transName](props.econ);
                    props.transform(transformed);
                    setState(old => ({ ...old, transResult: "succeed" }));
                  } catch (e) {
                    console.warn(e);

                    setState(old => ({ ...old, transResult: "failed" }));
                  }
                  timeouts.current.push(window.setTimeout(() => setState(old => ({ ...old, transResult: null })), 500));
                }
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
          );
        })()
      )}
    </div>
  );
}

function ExprNodeMatrixEdit(props: {
  econ: Econ & { expr: Matrix };
  setEcon: (newEcon: Econ) => void;
  interState: ExprInterState;
  setInterState: SetExprInterState;
}) {
  const theme = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {entries(editMatTrans).map(([editName, fn]) => {
        return (
          <div
            key={editName}
            className="clickable"
            style={{ padding: theme.size / 4 }}
            onClick={() => props.setEcon({ ...props.econ, expr: fn(props.econ.expr) })}
          >
            {editName}
          </div>
        );
      })}
    </div>
  );
}
