import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);

// Remove splash spinner after React mounts
const splash = document.getElementById("splash-spinner");
if (splash) splash.remove();
