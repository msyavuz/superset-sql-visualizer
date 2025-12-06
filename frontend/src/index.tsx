import React from "react";
import { core } from "@apache-superset/core";
import SqlVisualizerPanel from "./components/SqlVisualizerPanel";

export const activate = (context: core.ExtensionContext) => {
  context.disposables.push(
    core.registerViewProvider("sql_visualizer.main", () => <SqlVisualizerPanel />)
  );
  console.log("Sql Visualizer extension activated");
};

export const deactivate = () => {
  console.log("Sql Visualizer extension deactivated");
};
