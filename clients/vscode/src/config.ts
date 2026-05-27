import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_BASE_URL = "https://api.budgetary.tools";

export interface ResolvedConfig {
  apiKey: string;
  baseUrl: string;
}

export function configFilePath(home?: string): string {
  return join(home ?? homedir(), ".budgetary", "config.json");
}

export function resolveConfig(
  env: NodeJS.ProcessEnv = process.env,
  home?: string,
): ResolvedConfig | null {
  const fromEnv = env.BUDGETARY_API_KEY;
  if (fromEnv && fromEnv.length > 0) {
    return { apiKey: fromEnv, baseUrl: DEFAULT_BASE_URL };
  }

  const path = configFilePath(home);
  if (!existsSync(path)) return null;

  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as {
      api_key?: unknown;
      base_url?: unknown;
    };
    if (typeof parsed.api_key !== "string" || parsed.api_key.length === 0) {
      return null;
    }
    const baseUrl =
      typeof parsed.base_url === "string" && parsed.base_url.length > 0
        ? parsed.base_url
        : DEFAULT_BASE_URL;
    return { apiKey: parsed.api_key, baseUrl };
  } catch {
    return null;
  }
}
