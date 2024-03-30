import { setThemeMode, useTheme } from "../common/theme";
import { IconFlash, IconMoon } from "../common/widgets";
import { Notebook } from "./Notebook/Notebook";

export function App() {
  const theme = useTheme();
  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: theme.bg1,
        color: theme.text1,
        fontFamily: theme.fontFamily,
        fontSize: theme.size,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          background: theme.bg3,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", paddingLeft: theme.size / 4 }}>
          <div>ETA Notebook</div>
        </div>
        <div
          className="clickable"
          style={{ display: "flex", padding: theme.size / 4 }}
          onClick={() => setThemeMode(theme.mode === "dark" ? "light" : "dark")}
        >
          {theme.mode === "dark" ? <IconFlash /> : <IconMoon />}
        </div>
      </div>
      <div style={{ flexGrow: 1, overflow: "hidden" }}>
        <Notebook />
      </div>
    </div>
  );
}
