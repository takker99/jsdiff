export type Comparator = (left: string, right: string) => boolean;
export interface DiffOptions {
  comparator?: Comparator;
  castInput?: (text: string) => string;
  tokenize?: (text: string) => string[];
  removeEmpty?: (tokens: string[]) => string[];
  join?: (tokens: string[]) => string;
  ignoreCase?: boolean;
  useLongestToken?: boolean;
}

export interface Path {
  newPos: number;
  components: Component[];
}
export interface Component {
  value: string;
  count: number;
  added?: boolean;
  removed?: boolean;
}

export function diff(
  oldString: string,
  newString: string,
  options: DiffOptions,
) {
  const {
    comparator,
    ignoreCase = true,
    castInput = (text: string) => text,
    tokenize = (text: string) => text.split(""),
    removeEmpty = (tokens: string[]) => tokens.filter((token) => token),
    join = (tokens: string[]) => tokens.join(""),
    useLongestToken = false,
  } = options ?? {};
  // Allow subclasses to massage the input prior to running
  oldString = castInput(oldString);
  newString = castInput(newString);

  const oldStringArr = removeEmpty(tokenize(oldString));
  const newStringArr = removeEmpty(tokenize(newString));

  const newLen = newStringArr.length;
  const oldLen = oldStringArr.length;
  let editLength = 1;
  const maxEditLength = newLen + oldLen;
  let firstPath: Path = { newPos: -1, components: [] };
  let oldPos = 0;
  const bestPath: (Path | undefined)[] = [];

  // Seed editLength = 0, i.e. the content starts with the same values
  [firstPath, oldPos] = extractCommon(
    firstPath,
    newStringArr,
    oldStringArr,
    0,
    {
      comparator,
      ignoreCase,
    },
  );
  if (firstPath.newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
    // Identity per the equality and tokenizer
    return [{
      value: join(newStringArr),
      count: newStringArr.length,
    }];
  }

  // Main worker method. checks all permutations of a given edit length for acceptance.
  function execEditLength() {
    for (
      let diagonalPath = -1 * editLength;
      diagonalPath <= editLength;
      diagonalPath += 2
    ) {
      let basePath;
      const addPath = bestPath[diagonalPath - 1],
        removePath = bestPath[diagonalPath + 1],
        oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
      if (addPath) {
        // No one else is going to attempt to use this value, clear it
        bestPath[diagonalPath - 1] = undefined;
      }

      const canAdd = addPath && addPath.newPos + 1 < newLen;
      const canRemove = removePath && 0 <= oldPos && oldPos < oldLen;
      if (!canAdd && !canRemove) {
        // If this path is a terminal then prune
        bestPath[diagonalPath] = undefined;
        continue;
      }

      // Select the diagonal that we want to branch from. We select the prior
      // path whose position in the new string is the farthest from the origin
      // and does not pass the bounds of the diff graph
      if (!canAdd || (canRemove && addPath.newPos < removePath.newPos)) {
        basePath = clonePath(removePath);
        pushComponent(basePath.components, undefined, true);
      } else {
        basePath = addPath; // No need to clone, we've pulled it from the list
        basePath.newPos++;
        pushComponent(basePath.components, true, undefined);
      }

      oldPos = extractCommon(
        basePath,
        newStringArr,
        oldStringArr,
        diagonalPath,
        { comparator, ignoreCase },
      );

      // If we have hit the end of both strings, then we are done
      if (basePath.newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
        return buildValues(
          basePath.components,
          newStringArr,
          oldStringArr,
          { useLongestToken, join, comparator, ignoreCase },
        );
      } else {
        // Otherwise track this path as a potential candidate and continue.
        bestPath[diagonalPath] = basePath;
      }
    }

    editLength++;
  }

  // Performs the length of edit iteration. Is a bit fugly as this has to support the
  // sync and async mode which is never fun. Loops over execEditLength until a value
  // is produced.
  while (editLength <= maxEditLength) {
    const ret = execEditLength();
    if (ret) {
      return ret;
    }
  }
}

function extractCommon(
  basePath: Path,
  newString: string[],
  oldString: string[],
  diagonalPath: number,
  options: Pick<DiffOptions, "comparator" | "ignoreCase">,
) {
  const newLen = newString.length;
  const oldLen = oldString.length;
  let newPos = basePath.newPos;
  let oldPos = newPos - diagonalPath;
  let commonCount = 0;

  while (
    newPos + 1 < newLen && oldPos + 1 < oldLen &&
    equals(newString[newPos + 1], oldString[oldPos + 1], options)
  ) {
    newPos++;
    oldPos++;
    commonCount++;
  }

  if (commonCount > 0) {
    basePath.components.push({ count: commonCount });
  }

  basePath.newPos = newPos;
  return [basePath, oldPos] as const;
}
function equals(
  left: string,
  right: string,
  { comparator, ignoreCase }: Pick<DiffOptions, "comparator" | "ignoreCase">,
) {
  return comparator?.(left, right) ??
    (
      left === right ||
      (ignoreCase && left.toLowerCase() === right.toLowerCase())
    );
}
function pushComponent(
  components: Component[],
  added?: boolean,
  removed?: boolean,
) {
  const last = components[components.length - 1];
  if (last && last.added === added && last.removed === removed) {
    // We need to clone here as the component clone operation is just
    // as shallow array clone
    components[components.length - 1] = {
      count: last.count + 1,
      added: added,
      removed: removed,
    };
  } else {
    components.push({ count: 1, added: added, removed: removed });
  }
}

function buildValues(
  components: Component[],
  newString: string[],
  oldString: string[],
  { useLongestToken, join, comparator, ignoreCase }:
    & Pick<
      Required<DiffOptions>,
      "useLongestToken" | "join"
    >
    & Pick<DiffOptions, "comparator" | "ignoreCase">,
) {
  const componentLen = components.length;
  let newPos = 0;
  let oldPos = 0;

  for (let component of components) {
    if (!component.removed) {
      if (!component.added && useLongestToken) {
        let value = newString.slice(newPos, newPos + component.count);
        value = value.map((value, i) => {
          const oldValue = oldString[oldPos + i];
          return oldValue.length > value.length ? oldValue : value;
        });

        component.value = join(value);
      } else {
        component.value = join(
          newString.slice(newPos, newPos + component.count),
        );
      }
      newPos += component.count;

      // Common case
      if (!component.added) {
        oldPos += component.count;
      }
    } else {
      component.value = join(
        oldString.slice(oldPos, oldPos + component.count),
      );
      oldPos += component.count;

      // Reverse add and remove so removes are output first to match common convention
      // The diffing algorithm is tied to add then remove output and this is the simplest
      // route to get the desired output with minimal overhead.
      const index = components.indexOf(component);
      if (index && components[index - 1].added) {
        const tmp = components[index - 1];
        components[index - 1] = component;
        component = tmp;
      }
    }
  }

  // Special case handle for when one terminal is ignored (i.e. whitespace).
  // For this case we merge the terminal into the prior string and drop the change.
  // This is only available for string mode.
  const lastComponent = components[componentLen - 1];
  if (
    componentLen > 1 &&
    typeof lastComponent.value === "string" &&
    (lastComponent.added || lastComponent.removed) &&
    equals("", lastComponent.value, { comparator, ignoreCase })
  ) {
    components[componentLen - 2].value += lastComponent.value;
    components.pop();
  }

  return components;
}

function clonePath(path: Path) {
  return { newPos: path.newPos, components: [...path.components] };
}
