import { JSONParse, JSONStringify } from "../../math";
import { isNil } from "lodash";
import { useEffect, useState } from "react";
import { IconFiles } from "../../common/widgets";
import { Note, NoteState } from "./Note/Note";
import { Explorer, ExplorerNodeState } from "./SideBar/Explorer";
import { SideBar } from "./SideBar/SideBar";

export function Notebook() {
  const [state, setState] = useState({
    explorerRoots: [] as ExplorerNodeState[],
  });

  const [noteState, setNoteState] = useState<NoteState>({ cells: [] });

  useEffect(() => {
    const savedState = localStorage.getItem("noteState");
    if (!isNil(savedState)) {
      try {
        setNoteState(JSONParse(savedState));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("noteState", JSONStringify(noteState));
  }, [noteState]);

  return (
    <div
      style={{
        display: "flex",
        overflow: "hidden",
        height: "100%",
      }}
    >
      <SideBar
        items={[
          [
            IconFiles,
            <Explorer
              key={0}
              roots={state.explorerRoots}
              setRoot={explorerRoots => setState({ ...state, explorerRoots })}
            />,
          ],
        ]}
      />
      <div style={{ flex: "1 1", minWidth: 0 }}>
        <Note state={noteState} setState={setNoteState} />
      </div>
    </div>
  );
}
