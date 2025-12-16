# Hospital Management System (Next.js + Supabase)

This project implements a role-based hospital management portal with Supabase Auth, Postgres, and Storage. Admins provision staff and patient logins, doctors capture visits and create diagnostic orders, radiologists/ECG techs upload results, nurses add vitals, and patients can read their own history.

## Prerequisites
- Node.js 18+
- pnpm
- Supabase project with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (used only on the server for admin provisioning)

## Setup
1. Install dependencies
   ```bash
   pnpm install
   ```
2. Copy your Supabase credentials into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
3. Apply the SQL schema to your Supabase instance:
   ```bash
   supabase db push --file scripts/supabase-schema.sql
   ```
   The script creates tables, enums, RLS policies, and the `imaging` storage bucket used for radiology/ECG uploads.
4. Start the dev server
   ```bash
   pnpm dev
   ```

## Accounts & Roles
- **Admin** provisions staff/patient accounts (initial password set by admin).
- Staff categories supported: `doctor`, `radiologist`, `nurse`, `ecg_tech`, `lab_tech`, `pharmacist`, `receptionist`.
- Patient accounts are read-only to their own data. All access is enforced by Postgres RLS.

## Feature map
- **Admin dashboard**: create/deactivate users, view staff/patient lists, high-level metrics.
- **Doctor portal**: document clinical visits, create radiology/ECG orders, assign technicians.
- **Radiologist/ECG tech**: view assigned orders, upload findings + imaging files to Supabase Storage, update status.
- **Nurse**: capture vitals/notes per patient.
- **Patient**: view doctor notes, diagnostic results, nursing reports, and notifications scoped to their account.

## Notifications & files
- Notifications are stored in `notifications` and scoped by RLS to the recipient.
- Imaging and reports are uploaded to the private `imaging` bucket; file paths are linked from `order_results`.

## Notes
- Service-role actions are restricted to server components/server actions only; never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- If you hit dependency download issues in CI, retry with `pnpm install --registry=https://registry.npmjs.org` once network access is available.
