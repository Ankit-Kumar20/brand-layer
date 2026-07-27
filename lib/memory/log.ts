type LogFields = Record<string, unknown>;

function formatFields(fields?: LogFields) {
  if (!fields || Object.keys(fields).length === 0) return "";
  return ` ${JSON.stringify(fields)}`;
}

/** Structured step logger for the memory pipeline. */
export function memoryLog(
  step: string,
  message: string,
  fields?: LogFields,
) {
  console.log(`[memory:${step}] ${message}${formatFields(fields)}`);
}

export function memoryWarn(
  step: string,
  message: string,
  fields?: LogFields,
) {
  console.warn(`[memory:${step}] ${message}${formatFields(fields)}`);
}

export function memoryError(
  step: string,
  message: string,
  fields?: LogFields,
) {
  console.error(`[memory:${step}] ${message}${formatFields(fields)}`);
}
