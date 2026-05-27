import { randomBytes } from "node:crypto";
import * as vscode from "vscode";

import { BudgetaryClient, BudgetaryError } from "@budgetary/sdk";

import { resolveConfig } from "../config";
import {
  renderConfigureKey,
  renderDashboard,
  renderError,
  renderLoading,
} from "../webview/render";

let panel: vscode.WebviewPanel | undefined;

function makeNonce(): string {
  return randomBytes(16).toString("base64").replace(/[+/=]/g, "");
}

export function showDashboard(_context: vscode.ExtensionContext): void {
  if (panel) {
    panel.reveal(vscode.ViewColumn.Active);
    void load(panel);
    return;
  }

  panel = vscode.window.createWebviewPanel(
    "budgetary.dashboard",
    "Budgetary Dashboard",
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      // The CSP nailed in our HTML already blocks remote resources; we don't
      // need to enable localResourceRoots because we don't serve any.
      localResourceRoots: [],
    },
  );

  panel.onDidDispose(() => {
    panel = undefined;
  });

  panel.webview.onDidReceiveMessage((msg) => {
    if (msg && typeof msg === "object" && (msg as { type?: unknown }).type === "refresh") {
      if (panel) void load(panel);
    }
  });

  void load(panel);
}

async function load(p: vscode.WebviewPanel): Promise<void> {
  const config = resolveConfig();
  if (config === null) {
    p.webview.html = renderConfigureKey(makeNonce());
    return;
  }

  p.webview.html = renderLoading(makeNonce());

  const client = new BudgetaryClient({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
  });

  try {
    const page = await client.getLedger({ limit: 50, includeOrphans: false });
    p.webview.html = renderDashboard(page.entries, makeNonce());
  } catch (err) {
    const nonce = makeNonce();
    if (err instanceof BudgetaryError) {
      p.webview.html = renderError(err.message, err.requestId, nonce);
    } else {
      p.webview.html = renderError(
        err instanceof Error ? err.message : String(err),
        null,
        nonce,
      );
    }
  }
}
