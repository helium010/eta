/* eslint-disable import/first */
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

import "./fonts/fonts.css";
import "@fontsource/roboto";
import "@fontsource/roboto-mono";
import "katex/dist/katex.min.css";
import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { App } from "./view/App";

function Index() {
  return (
    <div>
      <App />
    </div>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <Index />
  </React.StrictMode>,
  document.getElementById("root")
);
