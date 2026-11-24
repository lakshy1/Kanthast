// The encoder leaves two placeholders in each lesson's playlists. This fills them in per request:
// every segment becomes a short lived signed link straight to storage, and the key link points back
// at this server (where access is checked again).
export const KEY_URI_PLACEHOLDER = "KEY_URI_PLACEHOLDER";

export function rewriteMediaPlaylist(text, signSegment) {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) return line.replace(KEY_URI_PLACEHOLDER, "../key");
      return signSegment(trimmed);
    })
    .join("\n");
}
