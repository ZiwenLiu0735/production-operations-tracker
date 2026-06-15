import { useEffect, useState } from "react";
import type { AppRole } from "../../context/AuthContext";
import {
  createManagedUser,
  listManagedUsers,
  updateManagedUser,
  type ManagedUser,
} from "../../repositories/userManagementRepository";
import { Button } from "../Button";
import {
  inputClass,
  selectClass,
  SettingsCard,
  SettingsField,
  SettingsPanel,
} from "./SettingsUi";

interface UsersTabProps {
  currentUserId: string;
  onUsersChanged: () => Promise<void>;
}

const ROLES: { value: AppRole; label: string }[] = [
  { value: "operator", label: "Operator" },
  { value: "supervisor", label: "Supervisor" },
  { value: "admin", label: "Admin" },
];

export function UsersTab({
  currentUserId,
  onUsersChanged,
}: UsersTabProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void listManagedUsers()
      .then((managedUsers) => {
        if (active) setUsers(managedUsers);
      })
      .catch((loadError: unknown) => {
        if (active) setError(userErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleChanged(user: ManagedUser) {
    setUsers((current) =>
      current
        .map((item) => (item.userId === user.userId ? user : item))
        .sort((a, b) => a.employeeNumber - b.employeeNumber),
    );
    await onUsersChanged();
  }

  async function handleCreated(user: ManagedUser) {
    setUsers((current) =>
      [...current, user].sort((a, b) => a.employeeNumber - b.employeeNumber),
    );
    await onUsersChanged();
  }

  return (
    <SettingsPanel
      title="Users"
      description="Create and manage login accounts, employee details, roles, and account access."
    >
      <CreateUserCard onCreated={handleCreated} />

      {error && <p className="text-sm text-red-300">{error}</p>}
      {loading && <p className="text-sm text-white/40">Loading users…</p>}

      {!loading && (
        <div className="space-y-3">
          {users.map((user) => (
            <ManagedUserCard
              key={user.userId}
              user={user}
              isCurrentUser={user.userId === currentUserId}
              onChanged={handleChanged}
            />
          ))}
          {users.length === 0 && (
            <p className="text-sm text-white/40">No users configured.</p>
          )}
        </div>
      )}
    </SettingsPanel>
  );
}

function CreateUserCard({
  onCreated,
}: {
  onCreated: (user: ManagedUser) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [legalName, setLegalName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [role, setRole] = useState<AppRole>("operator");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsedEmployeeNumber = Number(employeeNumber);
  const canCreate =
    email.trim() &&
    temporaryPassword.length >= 8 &&
    Number.isInteger(parsedEmployeeNumber) &&
    parsedEmployeeNumber > 0 &&
    legalName.trim() &&
    !saving;

  async function handleCreate() {
    if (!canCreate) return;

    setSaving(true);
    setError(null);
    try {
      const user = await createManagedUser({
        email,
        temporaryPassword,
        employeeNumber: parsedEmployeeNumber,
        legalName,
        preferredName,
        role,
      });
      await onCreated(user);
      setEmail("");
      setTemporaryPassword("");
      setEmployeeNumber("");
      setLegalName("");
      setPreferredName("");
      setRole("operator");
    } catch (createError) {
      setError(userErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsCard>
      <div className="mb-4">
        <p className="text-sm font-semibold text-white">Create User</p>
        <p className="mt-1 text-xs text-white/45">
          The temporary password is sent separately to the user and is never
          stored in the application database.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SettingsField label="Email">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            disabled={saving}
          />
        </SettingsField>
        <SettingsField label="Temporary Password">
          <input
            type="password"
            value={temporaryPassword}
            onChange={(event) => setTemporaryPassword(event.target.value)}
            className={inputClass}
            minLength={8}
            placeholder="At least 8 characters"
            disabled={saving}
          />
        </SettingsField>
        <SettingsField label="Employee Number">
          <input
            type="number"
            min="1"
            step="1"
            value={employeeNumber}
            onChange={(event) => setEmployeeNumber(event.target.value)}
            className={inputClass}
            disabled={saving}
          />
        </SettingsField>
        <SettingsField label="Role">
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as AppRole)}
            className={selectClass}
            disabled={saving}
          >
            {ROLES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </SettingsField>
        <SettingsField label="Legal Name">
          <input
            value={legalName}
            onChange={(event) => setLegalName(event.target.value)}
            className={inputClass}
            disabled={saving}
          />
        </SettingsField>
        <SettingsField label="Preferred Name">
          <input
            value={preferredName}
            onChange={(event) => setPreferredName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleCreate();
            }}
            className={inputClass}
            disabled={saving}
          />
        </SettingsField>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          size="md"
          onClick={() => void handleCreate()}
          disabled={!canCreate}
        >
          {saving ? "Creating…" : "Create User"}
        </Button>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </SettingsCard>
  );
}

function ManagedUserCard({
  user,
  isCurrentUser,
  onChanged,
}: {
  user: ManagedUser;
  isCurrentUser: boolean;
  onChanged: (user: ManagedUser) => Promise<void>;
}) {
  const [email, setEmail] = useState(user.email);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState(
    String(user.employeeNumber),
  );
  const [legalName, setLegalName] = useState(user.legalName);
  const [preferredName, setPreferredName] = useState(
    user.preferredName ?? "",
  );
  const [role, setRole] = useState<AppRole>(user.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsedEmployeeNumber = Number(employeeNumber);
  const valid =
    email.trim() &&
    Number.isInteger(parsedEmployeeNumber) &&
    parsedEmployeeNumber > 0 &&
    legalName.trim();
  const hasChanges =
    email.trim().toLowerCase() !== user.email.toLowerCase() ||
    parsedEmployeeNumber !== user.employeeNumber ||
    legalName.trim() !== user.legalName ||
    preferredName.trim() !== (user.preferredName ?? "") ||
    role !== user.role ||
    temporaryPassword.length > 0;

  async function save(active = user.active) {
    if (!valid || saving) return;

    setSaving(true);
    setError(null);
    try {
      const updated = await updateManagedUser(user.userId, {
        email,
        temporaryPassword: temporaryPassword || undefined,
        employeeNumber: parsedEmployeeNumber,
        legalName,
        preferredName,
        role,
        active,
      });
      setTemporaryPassword("");
      await onChanged(updated);
    } catch (updateError) {
      setError(userErrorMessage(updateError));
    } finally {
      setSaving(false);
    }
  }

  function changeAccess() {
    const nextActive = !user.active;
    if (
      !nextActive &&
      !window.confirm(
        `Deactivate ${user.preferredName ?? user.legalName}? They will no longer be able to sign in.`,
      )
    ) {
      return;
    }
    void save(nextActive);
  }

  return (
    <SettingsCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-white">
            #{user.employeeNumber} {user.preferredName ?? user.legalName}
          </p>
          <p className="text-xs text-white/45">{user.email}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            user.active
              ? "bg-brand-600/20 text-brand-400"
              : "bg-surface-700 text-white/40"
          }`}
        >
          {user.active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SettingsField label="Email">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            disabled={saving}
          />
        </SettingsField>
        <SettingsField label="New Temporary Password">
          <input
            type="password"
            value={temporaryPassword}
            onChange={(event) => setTemporaryPassword(event.target.value)}
            className={inputClass}
            minLength={8}
            placeholder="Leave blank to keep current password"
            disabled={saving}
          />
        </SettingsField>
        <SettingsField label="Employee Number">
          <input
            type="number"
            min="1"
            step="1"
            value={employeeNumber}
            onChange={(event) => setEmployeeNumber(event.target.value)}
            className={inputClass}
            disabled={saving}
          />
        </SettingsField>
        <SettingsField label="Role">
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as AppRole)}
            className={selectClass}
            disabled={saving || isCurrentUser}
          >
            {ROLES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </SettingsField>
        <SettingsField label="Legal Name">
          <input
            value={legalName}
            onChange={(event) => setLegalName(event.target.value)}
            className={inputClass}
            disabled={saving}
          />
        </SettingsField>
        <SettingsField label="Preferred Name">
          <input
            value={preferredName}
            onChange={(event) => setPreferredName(event.target.value)}
            className={inputClass}
            disabled={saving}
          />
        </SettingsField>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button
          size="md"
          variant="secondary"
          onClick={changeAccess}
          disabled={saving || isCurrentUser}
        >
          {user.active ? "Deactivate" : "Reactivate"}
        </Button>
        <Button
          size="md"
          onClick={() => void save()}
          disabled={
            !valid ||
            !hasChanges ||
            saving ||
            (temporaryPassword.length > 0 && temporaryPassword.length < 8)
          }
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
      {isCurrentUser && (
        <p className="mt-3 text-xs text-white/40">
          Your own admin role and account access cannot be changed here.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </SettingsCard>
  );
}

function userErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unable to save user.";

  if (message.toLowerCase().includes("duplicate")) {
    return "That email or employee number is already in use.";
  }

  return message;
}
