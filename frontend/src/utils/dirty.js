// Generic "has this form changed from what's saved" check — any form can use
// this to gate a Save button or feed the unsaved-changes guard (see
// context/UnsavedChangesContext.jsx). Deep-equality via JSON is enough for the
// flat string/number form-state shapes used across this app.
export function isDirty(current, baseline) {
  return JSON.stringify(current) !== JSON.stringify(baseline)
}
