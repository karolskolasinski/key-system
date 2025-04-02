export function getErrorMsg(err: unknown) {
  return err instanceof Error ? err.message : "Internal Server Error";
}
