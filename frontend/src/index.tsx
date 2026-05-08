import React from "react";
import { views } from "@apache-superset/core";
import SqlVisualizerPanel from "./components/SqlVisualizerPanel";

views.registerView(
  { id: "msyavuz.sql-visualizer.main", name: "Sql Visualizer" },
  "sqllab.panels",
  () => <SqlVisualizerPanel />,
);
