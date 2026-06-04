const EDITOR_NAME_KEY = "trimtrack-editor-name";

export function getEditorName(): string | null {
  const name = localStorage.getItem(EDITOR_NAME_KEY)?.trim();
  return name || null;
}

export function setEditorName(name: string) {
  localStorage.setItem(EDITOR_NAME_KEY, name.trim());
}

export function getEditorNameOrDefault(): string {
  return getEditorName() ?? "Unknown Editor";
}
