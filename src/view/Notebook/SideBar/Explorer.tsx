import { isNil } from "lodash";
import { useState } from "react";
import { useTheme } from "../../../common/theme";
import { IconCollapseAll, IconNewFile, IconNewFolder } from "../../../common/widgets";
import type { NoteState } from "../Note/Note";

type DirNode = {
  type: "dir";
  name: string;
  subs: ExplorerNodeState[];
};
type NoteNode = {
  type: "note";
  name: string;
  note: NoteState;
};

export type ExplorerNodeState = DirNode | NoteNode;

export function Explorer(props: { roots: ExplorerNodeState[]; setRoot: (root: ExplorerNodeState[]) => void }) {
  const theme = useTheme();

  const [state, setState] = useState({ selectedNode: null as ExplorerNodeState | null });

  return (
    <div
      style={{
        width: 200,
        height: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", padding: theme.size / 4 }}>
        <div>Explorer</div>
        <div style={{ display: "flex" }}>
          <div
            className="clickable"
            style={{ padding: theme.size / 4, display: "flex" }}
            onClick={() => {
              if (isNil(state.selectedNode)) {
                props.setRoot([...props.roots, { type: "note", name: "Unnamed", note: { cells: [] } }]);
              }
            }}
          >
            <IconNewFile />
          </div>
          <div className="clickable" style={{ padding: theme.size / 4, display: "flex" }}>
            <IconNewFolder />
          </div>
          <div className="clickable" style={{ padding: theme.size / 4, display: "flex" }}>
            <IconCollapseAll />
          </div>
        </div>
      </div>
      {props.roots.map((node, i) => (
        <ExplorerNode key={i} node={node} selectNode={selectedNode => setState({ ...state, selectedNode })} />
      ))}
    </div>
  );
}

function ExplorerNode(props: { node: ExplorerNodeState; selectNode: (node: ExplorerNodeState) => void }) {
  if (props.node.type === "note") {
    return (
      <div className="clickable" onClick={() => props.selectNode(props.node)}>
        {props.node.name}
      </div>
    );
  } else {
    return <div></div>;
  }
}
