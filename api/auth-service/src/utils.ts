export function getErrorMsg(err: unknown) {
  const msg = err && typeof err === "object" && "detail" in err && typeof err.detail === "string"
    ? err.detail
    : "Internal Server Error";

  return msg.endsWith(".") ? msg.slice(0, -1) : msg;
}
