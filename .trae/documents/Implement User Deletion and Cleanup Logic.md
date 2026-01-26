I will implement the `user.deleted` event handling by creating a dedicated database function for atomic data deletion and updating the edge function to handle storage cleanup.

### 1. Database Migration (New SQL File)
I will create a new migration file (e.g., `supabase/migrations/<timestamp>_add_delete_user_func.sql`) to define a secure RPC function `delete_user_data`.
*   **Functionality**:
    *   Accepts `target_user_id` (Clerk User ID).
    *   Retrieves the internal `profile_id` (UUID).
    *   **Returns File URLs**: Captures `id_front_url`, `id_back_url`, and `selfie_url` from `verification_requests` *before* deletion to allow the edge function to clean up storage.
    *   **Executes Atomic Deletion**: Deletes records in the correct dependency order to satisfy Foreign Key constraints:
        1.  **Set to NULL**: Updates `tips` (supporter), `verification_requests` (reviewer), and `platform_config` (updater) to remove references to the deleted user without losing the records.
        2.  **Delete Dependent Data**: Deletes from `admin_activity_logs`, `billing_records`, `creator_subscriptions`, `funding_goals`, `notification_settings`, `notifications`, `push_subscriptions`, `tips` (as creator), `verification_requests`, `withdrawal_otps`, and `withdrawal_requests`.
        3.  **Delete User**: Deletes the `profiles` record and `admin_roles`/`maintenance_whitelist` entries.
    *   **Data Integrity**: Uses a transaction to ensure all database changes happen or none do.

### 2. Edge Function Update (`supabase/functions/clerk-webhook/index.ts`)
I will modify the `user.deleted` handler to:
1.  **Call RPC**: Invoke the new `delete_user_data` function using `supabase.rpc()`.
2.  **Storage Cleanup**: Use the returned file URLs to delete the actual files from the `verification-documents` bucket using `supabase.storage.from(...).remove()`.
3.  **Logging & Error Handling**:
    *   Log the start and completion of database and storage operations.
    *   Log the number of database records deleted (if returned) and files removed.
    *   Catch and log errors specifically for each stage (DB vs Storage) to ensure visibility.

### 3. Verification
*   The `user.created` and `user.updated` logic will remain untouched.
*   I will ensure the code compiles and follows the existing patterns.
