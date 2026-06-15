import { supabase } from "../lib/supabase";
import type { AppRole } from "../context/AuthContext";

export interface ManagedUser {
  userId: string;
  employeeId: string;
  email: string;
  employeeNumber: number;
  legalName: string;
  preferredName: string | null;
  role: AppRole;
  active: boolean;
  lastSignInAt: string | null;
}

export interface ManagedUserInput {
  email: string;
  employeeNumber: number;
  legalName: string;
  preferredName: string;
  role: AppRole;
  temporaryPassword?: string;
  active?: boolean;
}

interface FunctionResponse {
  users?: ManagedUser[];
  user?: ManagedUser;
  error?: string;
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const response = await invokeUserManagement({ action: "list" });
  return response.users ?? [];
}

export async function createManagedUser(
  input: ManagedUserInput & { temporaryPassword: string },
): Promise<ManagedUser> {
  const response = await invokeUserManagement({
    action: "create",
    ...input,
  });
  if (!response.user) throw new Error("User was created without a response.");
  return response.user;
}

export async function updateManagedUser(
  userId: string,
  input: ManagedUserInput,
): Promise<ManagedUser> {
  const response = await invokeUserManagement({
    action: "update",
    userId,
    ...input,
  });
  if (!response.user) throw new Error("User was updated without a response.");
  return response.user;
}

async function invokeUserManagement(
  body: Record<string, unknown>,
): Promise<FunctionResponse> {
  const { data, error } = await supabase.functions.invoke<FunctionResponse>(
    "user-management",
    { body },
  );

  if (error) {
    let message = error.message;
    const context = "context" in error ? error.context : null;

    if (context instanceof Response) {
      const responseBody = (await context.json().catch(() => null)) as
        | FunctionResponse
        | null;
      if (responseBody?.error) message = responseBody.error;
    }

    throw new Error(message);
  }

  if (data?.error) throw new Error(data.error);
  return data ?? {};
}
