import type { Change } from "../types.ts";

export function convertChangesToXML(changes: Change[]) {
  let xml = "";
  for (const change of changes) {
    if (change.added) {
      xml += "<ins>";
    } else if (change.removed) {
      xml += "<del>";
    }

    xml += escapeHTML(change.value);

    if (change.added) {
      xml += "</ins>";
    } else if (change.removed) {
      xml += "</del>";
    }
  }
  return xml;
}

function escapeHTML(s: string) {
  return s.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
