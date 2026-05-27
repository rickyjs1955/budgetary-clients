import * as vscode from "vscode";

import { showDashboard } from "./commands/show_dashboard";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("budgetary.showDashboard", () => {
      showDashboard(context);
    }),
  );
}

export function deactivate(): void {}
