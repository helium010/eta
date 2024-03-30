import { FC, ReactElement, useState } from "react";
import { Icon } from "../../../common/widgets";
import { ActivityBar } from "./ActivityBar";
import { SideBarExpand } from "./SideBarExpand";

export const SideBar: FC<{ items: [Icon, ReactElement][] }> = props => {
  const [expand, setExpand] = useState(-1);

  return (
    <div
      style={{
        display: "flex",
      }}
    >
      <ActivityBar expand={expand} setExpand={setExpand} icons={props.items.map(i => i[0])} />
      {expand >= 0 ? <SideBarExpand expand={expand} expandItems={props.items.map(i => i[1])} /> : false}
    </div>
  );
};
