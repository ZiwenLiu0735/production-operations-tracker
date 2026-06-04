import { useEffect, useState } from "react";
import { Button } from "./Button";
import { getEditorName, setEditorName } from "../utils/editorIdentity";
import { inputClass } from "./settings/SettingsUi";

interface EditorNameModalProps {
  onConfirm: (name: string) => void;
  onClose?: () => void;
}

export function EditorNameModal({ onConfirm, onClose }: EditorNameModalProps) {
  const [name, setName] = useState(getEditorName() ?? "");

  function handleConfirm() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setEditorName(trimmed);
    onConfirm(trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-md rounded-2xl border border-surface-600 bg-surface-800 p-6 shadow-2xl">
        <h2 className="text-xl font-bold">Editor Name Required</h2>
        <p className="mt-2 text-sm text-white/50">
          Enter your name for the audit trail. This is stored on this device and attached to all
          archive edits.
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${inputClass} mt-4`}
          placeholder="Alex Morgan"
          autoFocus
        />
        <div className="mt-6 grid grid-cols-2 gap-3">
          {onClose && (
            <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            size="lg"
            fullWidth
            className={onClose ? "" : "col-span-2"}
            disabled={!name.trim()}
            onClick={handleConfirm}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

export function useEditorNameAction() {
  const [pendingAction, setPendingAction] = useState<((name: string) => void) | null>(null);

  function runWithEditorName(action: (editedBy: string) => void) {
    const existing = getEditorName();
    if (existing) {
      action(existing);
      return;
    }
    setPendingAction(() => action);
  }

  function handleConfirm(name: string) {
    pendingAction?.(name);
    setPendingAction(null);
  }

  function handleClose() {
    setPendingAction(null);
  }

  const modal = pendingAction ? (
    <EditorNameModal onConfirm={handleConfirm} onClose={handleClose} />
  ) : null;

  return { runWithEditorName, editorModal: modal };
}

export function useEnsureEditorName() {
  const [ready, setReady] = useState(() => Boolean(getEditorName()));

  useEffect(() => {
    setReady(Boolean(getEditorName()));
  }, []);

  return { ready, setReady };
}
