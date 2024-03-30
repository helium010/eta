import { FC, ReactNode } from "react";
import { useTheme } from "../../../common/theme";

export const SideBarExpand: FC<{ expand: number; expandItems: ReactNode[] }> = props => {
  const theme = useTheme();

  return <div style={{ height: "100%", background: theme.bg2 }}>{props.expandItems}</div>;
};
