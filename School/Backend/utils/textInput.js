// Reads one text field from a request body. Anything that is not a string counts as empty,
// so {"a":1} or ["Science"] fail the normal checks instead of turning into "[object Object]" or "Science".
export const textField = (value) => (typeof value === "string" ? value.trim() : "");
