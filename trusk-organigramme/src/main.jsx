import React from "react";
import { createRoot } from "react-dom/client";
import OrgChart from "./OrgChart";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <OrgChart />
  </React.StrictMode>
);
