import { FC } from "react";
import { useTheme } from "../../../common/theme";
import { Icon } from "../../../common/widgets";

export const ActivityBar: FC<{ icons: Icon[]; expand: number; setExpand: (i: number) => void }> = props => {
  const theme = useTheme();
  return (
    <div
      style={{
        backgroundColor: theme.bg3,
      }}
    >
      {props.icons.map((Icon, i) => (
        <div
          key={i}
          className="clickable"
          style={{
            borderLeft: props.expand === i ? `solid 2px ${theme.text1} !important` : "",
            padding: theme.size / 2,
          }}
          onClick={() => props.setExpand(props.expand !== i ? i : -1)}
        >
          <Icon color={props.expand === i ? theme.text1 : theme.text2} height={theme.size * 2} width={theme.size * 2} />
        </div>
      ))}
    </div>
  );
};
