export function generateOptions(
  options: CallableFunction | Record<string, unknown>,
  defaults: Record<string, unknown>,
) {
  if (typeof options === "function") {
    defaults.callback = options;
  } else if (options) {
    for (const name in Object.keys(options)) {
      /* istanbul ignore else */
      defaults[name] = options[name];
    }
  }
  return defaults;
}
