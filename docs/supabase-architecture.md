# Supabase Architecture

## First Release Scope

- Users must sign in before using the application.
- Supabase is the source of truth for shared production data.
- The first release requires an internet connection.
- Offline writes and background synchronization are deferred.
- The existing React pages and calculation utilities should be reused.

## Authentication And Roles

Supabase Auth owns credentials and login sessions. Application-specific user
data lives in `public.profiles`, linked one-to-one with `auth.users`.

Initial roles:

- `admin`: manage users, master data, sessions, and archives.
- `supervisor`: start and operate sessions, review and edit archives.
- `operator`: review their own sessions and production records.

New accounts should be invited or created by an administrator. Public sign-up
should remain disabled.

Every application user is also an employee. Supabase Auth owns the login,
`profiles` owns the application role, and `employees` owns the worker's business
identity:

```text
auth.users 1---1 profiles 1---1 employees
```

The Auth trigger creates a profile with the default `operator` role. The admin
Users workflow runs in a Supabase Edge Function and creates the Auth user,
employee, and profile link together. An active login without an employee link
cannot access operational data.

## Database Model

### Identity

- `profiles`
  - `id` references `auth.users`
  - `employee_id` uniquely references `employees`
  - `display_name`
  - `role`
  - `active`
  - timestamps

### Master Data

- `facilities`
- `rooms`
- `employees`

Facilities own rooms. Employees are production workers and are separate from
application users. Master-data records should normally be deactivated rather
than deleted so historical sessions continue to reference valid records.

### Production Sessions

- `sessions`
  - facility and session metadata
  - status: `active`, `completed`, or `deleted`
  - start and end timestamps
  - optional Cadillac metadata
- `session_rooms`
- `session_supervisors`
- `session_employees`
- `weight_entries`

Join tables preserve the many-to-many relationships already supported by the
frontend. Session participant tables also store name and employee-number
snapshots so historical reports do not change when master data is edited.

Starting a session uses the `start_production_session` database function. It
creates the session, room links, supervisor links, and employee links in one
transaction. If any selected record is invalid, none of the rows are saved.

The frontend calls `start_production_activity_session`, which preserves the
specific activity (`trim`, `deleaf`, `chop`, `skirt`, `package`, or `sorting`)
and maps it to the underlying `trim` or `hourly` tracking mode.

The live workflow uses database functions for its writes:

- `add_session_employee`
- `remove_session_employee`
- `record_weight_entry`
- `update_weight_entry`
- `delete_weight_entry`
- `complete_production_session`

Weight entries and session participants are soft-removed so existing production
records remain traceable. A completed session is the archive record; the data is
not copied into a second archive table. Session and employee totals are derived
from active weight entries.

### Audit

- `audit_logs`
  - actor
  - action
  - target table and record
  - previous and new values
  - timestamp

Session totals and employee totals are derived from active `weight_entries`.
They should not be stored as independently editable values.

## Security

Row Level Security must be enabled on every table exposed through the Supabase
API.

- Authenticated active users may read the operational data needed by the app.
- Admins may manage profiles and master data.
- Admins may manage all sessions.
- Supervisors may create and operate sessions to which they are assigned.
- Operators may read sessions in which they participated and only their own
  employee and weight-entry rows.
- The browser receives only the project URL and publishable key.
- Secret or service-role keys must never be placed in Vite environment
  variables or committed to Git.
- Auth administration runs only in the `user-management` Edge Function. The
  function validates the caller as an active admin before using service-role
  access.
- Accounts are deactivated instead of physically deleted so historical session
  references remain intact.

## Frontend Boundaries

Pages and presentational components remain in place. Persistence is replaced
behind repository modules:

```text
Page -> Context/hook -> Repository -> Supabase client -> PostgreSQL
```

Existing calculation and export utilities remain frontend code where they are
pure transformations. Authorization, durable storage, constraints, and audit
integrity belong in the database.

## Migration Sequence

1. Add the Supabase CLI and initialize `supabase/`.
2. Create migrations for profiles, roles, and the Auth profile trigger.
3. Create migrations for master data.
4. Create migrations for sessions, participants, entries, and audit logs.
5. Add constraints, indexes, and RLS policies.
6. Generate TypeScript database types.
7. Add the Supabase browser client and login screen.
8. Migrate master-data contexts from local storage.
9. Migrate the live session workflow.
10. Migrate archives and audit editing.
11. Remove replaced local-storage persistence and the placeholder sync queue.

Each schema change must be committed as a migration. Do not make untracked
schema changes directly in the hosted Supabase project.
