/* See LICENSE file for terms of use */

/*
 * Text diff implementation.
 *
 * This library supports the following APIS:
 * JsDiff.diffChars: Character by character diff
 * JsDiff.diffWords: Word (as defined by \b regex) diff which ignores whitespace
 * JsDiff.diffLines: Line based diff
 *
 * JsDiff.diffCss: Diff targeted at CSS content
 *
 * These methods are based on the implementation proposed in
 * "An O(ND) Difference Algorithm and its Variations" (Myers, 1986).
 * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */
import Diff from "./diff/base.ts";
import { diffChars } from "./diff/charcter.ts";
import { diffWords, diffWordsWithSpace } from "./diff/word.ts";
import { diffLines, diffTrimmedLines } from "./diff/line.ts";
import { diffSentences } from "./diff/sentence.ts";

import { diffCss } from "./diff/css.ts";
import { canonicalize, diffJson } from "./diff/json.ts";

import { diffArrays } from "./diff/array.ts";

import { applyPatch, applyPatches } from "./patch/apply.ts";
import { parsePatch } from "./patch/parse.ts";
import { merge } from "./patch/merge.ts";
import {
  createPatch,
  createTwoFilesPatch,
  structuredPatch,
} from "./patch/create.ts";

import { convertChangesToDMP } from "./convert/dmp.ts";
import { convertChangesToXML } from "./convert/xml.ts";

export {
  applyPatch,
  applyPatches,
  canonicalize,
  convertChangesToDMP,
  convertChangesToXML,
  createPatch,
  createTwoFilesPatch,
  Diff,
  diffArrays,
  diffChars,
  diffCss,
  diffJson,
  diffLines,
  diffSentences,
  diffTrimmedLines,
  diffWords,
  diffWordsWithSpace,
  merge,
  parsePatch,
  structuredPatch,
};
