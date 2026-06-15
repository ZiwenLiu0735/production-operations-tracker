import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AppRole = "admin" | "supervisor" | "operator";

interface UserManagementRequest {
  action: "list" | "create" | "update";
  userId?: string;
  email?: string;
  temporaryPassword?: string;
  employeeNumber?: number;
  legalName?: string;
  preferredName?: string;
  role?: AppRole;
  active?: boolean;
}

interface ProfileRow {
  id: string;
  display_name: string;
  role: AppRole;
  active: boolean;
  employee_id: string | null;
  employees:
    | {
        id: string;
        employee_number: number;
        legal_name: string;
        preferred_name: string | null;
        active: boolean;
      }
    | null;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase function environment variables.");
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const authorization = request.headers.get("Authorization");
    const token = authorization?.replace(/^Bearer\s+/i, "");

    if (!token) return jsonResponse({ error: "Authentication required." }, 401);

    const {
      data: { user: caller },
      error: callerError,
    } = await adminClient.auth.getUser(token);

    if (callerError || !caller) {
      return jsonResponse({ error: "Invalid authentication token." }, 401);
    }

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from("profiles")
      .select("role, active, employees(active)")
      .eq("id", caller.id)
      .single();

    if (
      callerProfileError ||
      callerProfile?.role !== "admin" ||
      !callerProfile.active ||
      !callerProfile.employees?.active
    ) {
      return jsonResponse({ error: "Active admin access is required." }, 403);
    }

    const body = (await request.json()) as UserManagementRequest;

    switch (body.action) {
      case "list":
        return jsonResponse({ users: await listUsers() });
      case "create":
        return jsonResponse({ user: await createUser(body) }, 201);
      case "update":
        return jsonResponse({
          user: await updateUser(body, caller.id),
        });
      default:
        return jsonResponse({ error: "Unsupported action." }, 400);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to manage users.";
    return jsonResponse({ error: message }, 400);
  }
});

async function listUsers() {
  const { data: authData, error: authError } =
    await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

  if (authError) throw authError;

  const { data: profiles, error: profileError } = await adminClient
    .from("profiles")
    .select(
      "id, display_name, role, active, employee_id, employees(id, employee_number, legal_name, preferred_name, active)",
    )
    .order("display_name");

  if (profileError) throw profileError;

  const authUsers = new Map(
    authData.users.map((user) => [
      user.id,
      {
        email: user.email ?? "",
        lastSignInAt: user.last_sign_in_at ?? null,
      },
    ]),
  );

  return (profiles as ProfileRow[])
    .filter((profile) => profile.employee_id && profile.employees)
    .map((profile) => {
      const authUser = authUsers.get(profile.id);
      const employee = profile.employees!;

      return {
        userId: profile.id,
        employeeId: employee.id,
        email: authUser?.email ?? "",
        employeeNumber: employee.employee_number,
        legalName: employee.legal_name,
        preferredName: employee.preferred_name,
        role: profile.role,
        active: profile.active && employee.active,
        lastSignInAt: authUser?.lastSignInAt ?? null,
      };
    })
    .sort((a, b) => a.employeeNumber - b.employeeNumber);
}

async function createUser(input: UserManagementRequest) {
  const email = requiredText(input.email, "Email").toLowerCase();
  const password = requiredText(input.temporaryPassword, "Temporary password");
  const legalName = requiredText(input.legalName, "Legal name");
  const employeeNumber = validEmployeeNumber(input.employeeNumber);
  const role = validRole(input.role);
  const preferredName = input.preferredName?.trim() || null;

  if (password.length < 8) {
    throw new Error("Temporary password must be at least 8 characters.");
  }

  const { data: employee, error: employeeError } = await adminClient
    .from("employees")
    .insert({
      employee_number: employeeNumber,
      legal_name: legalName,
      preferred_name: preferredName,
    })
    .select("id")
    .single();

  if (employeeError) throw employeeError;

  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: preferredName ?? legalName,
      },
    });

  if (authError || !authData.user) {
    await adminClient.from("employees").delete().eq("id", employee.id);
    throw authError ?? new Error("Unable to create Auth user.");
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      employee_id: employee.id,
      display_name: preferredName ?? legalName,
      role,
      active: true,
    })
    .eq("id", authData.user.id);

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authData.user.id);
    await adminClient.from("employees").delete().eq("id", employee.id);
    throw profileError;
  }

  return {
    userId: authData.user.id,
    employeeId: employee.id,
    email,
    employeeNumber,
    legalName,
    preferredName,
    role,
    active: true,
    lastSignInAt: null,
  };
}

async function updateUser(input: UserManagementRequest, callerId: string) {
  const userId = requiredText(input.userId, "User ID");

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("employee_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile.employee_id) {
    throw profileError ?? new Error("User is not linked to an employee.");
  }

  const role = validRole(input.role);
  const active = input.active ?? true;

  if (userId === callerId && (!active || role !== "admin")) {
    throw new Error("You cannot deactivate or demote your own admin account.");
  }

  const legalName = requiredText(input.legalName, "Legal name");
  const preferredName = input.preferredName?.trim() || null;
  const employeeNumber = validEmployeeNumber(input.employeeNumber);
  const email = requiredText(input.email, "Email").toLowerCase();

  const authUpdates: {
    email: string;
    email_confirm: boolean;
    password?: string;
    ban_duration: string;
    user_metadata: { display_name: string };
  } = {
    email,
    email_confirm: true,
    ban_duration: active ? "none" : "876000h",
    user_metadata: { display_name: preferredName ?? legalName },
  };

  if (input.temporaryPassword) {
    if (input.temporaryPassword.length < 8) {
      throw new Error("Temporary password must be at least 8 characters.");
    }
    authUpdates.password = input.temporaryPassword;
  }

  const { error: authError } = await adminClient.auth.admin.updateUserById(
    userId,
    authUpdates,
  );
  if (authError) throw authError;

  const { error: employeeError } = await adminClient
    .from("employees")
    .update({
      employee_number: employeeNumber,
      legal_name: legalName,
      preferred_name: preferredName,
      active,
    })
    .eq("id", profile.employee_id);
  if (employeeError) throw employeeError;

  const { error: updateProfileError } = await adminClient
    .from("profiles")
    .update({
      display_name: preferredName ?? legalName,
      role,
      active,
    })
    .eq("id", userId);
  if (updateProfileError) throw updateProfileError;

  const users = await listUsers();
  return users.find((user) => user.userId === userId);
}

function requiredText(value: string | undefined, label: string): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  return trimmed;
}

function validEmployeeNumber(value: number | undefined): number {
  if (!Number.isInteger(value) || (value ?? 0) <= 0) {
    throw new Error("Employee number must be a positive whole number.");
  }
  return value!;
}

function validRole(value: AppRole | undefined): AppRole {
  if (!value || !["admin", "supervisor", "operator"].includes(value)) {
    throw new Error("A valid role is required.");
  }
  return value;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
