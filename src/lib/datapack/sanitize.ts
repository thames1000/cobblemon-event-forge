/**
 * Minecraft resource-location helpers.
 *
 * Namespaces and paths in datapacks may only contain [a-z0-9_.-] (paths also
 * allow `/`). Anything a human types ("Electric Storm Weekend!") has to be
 * coerced into a legal id before it can be used as a file/folder name.
 */

/** Turn arbitrary text into a legal resource-location path segment. */
export function toId(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      // spaces and illegal characters collapse to underscores
      .replace(/[^a-z0-9_./-]+/g, "_")
      // no leading/trailing/duplicate separators
      .replace(/_{2,}/g, "_")
      .replace(/^[_-]+|[_-]+$/g, "") || "untitled"
  );
}

/** A legal namespace: like toId but `/` and `.` are not allowed. */
export function toNamespace(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^[_-]+|[_-]+$/g, "") || "owner_dashboard"
  );
}

const NS_RE = /^[a-z0-9_.-]+$/;
const PATH_RE = /^[a-z0-9_./-]+$/;

export function isValidNamespace(ns: string): boolean {
  return NS_RE.test(ns) && !ns.includes("/");
}

export function isValidPath(p: string): boolean {
  return PATH_RE.test(p);
}
