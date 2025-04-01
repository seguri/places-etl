import { homedir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const BASE_DIR = resolve(import.meta.dirname, "..");
export const DOWNLOADS_DIR = resolve(homedir(), "Downloads");

export const DB_PATH = resolve(BASE_DIR, "places.db");

export const isMain = (moduleUrl: string) => {
  const modulePath = fileURLToPath(moduleUrl);
  const mainScriptPath = resolve(process.argv[1] || "");
  return modulePath === mainScriptPath;
};
