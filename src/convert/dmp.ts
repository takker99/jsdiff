import type { Change } from "../types.ts";

// See: http://code.google.com/p/google-diff-match-patch/wiki/API
export function* convertChangesToDMP(changes: Change[]) {
  for (const change of changes) {
    if (change.added) {
      yield [1, change.value];
    } else if (change.removed) {
      yield [-1, change.value];
    } else {
      yield [0, change.value];
    }
  }
}
