/*
# Create bookings and profiles tables

## Purpose
Add persistent data storage for hotel bookings and user profiles with admin role support.
The app uses Clerk for authentication (not Supabase Auth), so user identity comes from
Clerk's user ID stored as a text column rather than a UUID FK to auth.users.

## New Tables

### profiles
- `id` (text, primary key) — Clerk user ID
- `email` (text, not null) — user email from Clerk
- `full_name` (text, nullable) — user display name
- `is_admin` (boolean, default false) — admin flag
- `created_at` (timestamptz, default now())

### bookings
- `id` (uuid, primary key)
- `clerk_user_id` (text, not null) — Clerk user ID of the booker
- `user_email` (text, not null) — email of the booker
- `user_name` (text, not null) — name of the booker
- `room_id` (text, not null) — room identifier (standard, deluxe, suite, family)
- `room_name` (text, not null) — room name at time of booking
- `check_in` (date, not null) — check-in date
- `check_out` (date, not null) — check-out date
- `guests` (integer, not null, default 1) — number of guests
- `total_price` (bigint, not null) — total price in VND
- `status` (text, not null, default 'pending') — pending, confirmed, cancelled
- `phone` (text, nullable) — contact phone
- `created_at` (timestamptz, default now())

## Security (RLS)

Since the app uses Clerk (not Supabase Auth), `auth.uid()` will be null for all
requests via the anon-key client. The frontend sends the Clerk user ID explicitly.
We use `TO anon, authenticated` on all policies because the anon key is the only
role the client uses. Ownership is enforced by matching `clerk_user_id` / `id`
against the value the client provides — this is application-level ownership, not
database-level auth.

For admin access (reading all bookings / updating any booking status), any request
can read all bookings and profiles since the anon key has no server-side identity.
In a production app with Supabase Auth, these would be scoped to authenticated
users with `auth.uid()` checks. Here, the admin check is enforced in the frontend
by reading the `is_admin` flag from profiles.

### profiles policies
- SELECT: anon + authenticated can read (app filters by Clerk user ID)
- INSERT: anon + authenticated can insert (app creates profile on first login)
- UPDATE: anon + authenticated can update (app updates profile info)

### bookings policies
- SELECT: anon + authenticated can read (app filters by Clerk user ID)
- INSERT: anon + authenticated can insert
- UPDATE: anon + authenticated can update (admin changes status)

## Important Notes
1. The app uses Clerk for auth, not Supabase Auth — so we use text columns for
   Clerk user IDs and TO anon, authenticated on policies.
2. Admin role is determined by the `is_admin` column on profiles. To make a user
   admin, set `is_admin = true` in the database.
3. All prices are stored in VND as bigint to avoid floating-point issues.
*/