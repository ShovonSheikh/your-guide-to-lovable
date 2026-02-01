I will implement the following changes to address your requests:

### 1. Enable Name/Email Editing for Logged-in Users
**Problem:** You cannot edit the name and email fields when creating a ticket because they are currently locked to your profile.
**Solution:**
- Update `TicketForm.tsx` to remove the `disabled={!!profile}` restriction on the Name and Email fields.
- This allows you (or an admin) to edit these fields freely, even when logged in.

### 2. Refine & Simplify TopNavbar
**Problem:** The navigation bar looks cluttered ("misplaced"), especially for admins who see extra buttons.
**Solution:**
- **Hide Marketing Links:** When a user is logged in, I will hide "How it Works" and "Pricing" from the top bar (they remain accessible in the footer). This frees up significant space.
- **Retain Core Links:** Keep "Explore" and "Support" visible for all users.
- **Style Improvements:**
  - Change the "Admin" button to a cleaner, less dominant style (Ghost variant or Icon-based) so it doesn't compete with the "Dashboard" button.
  - Adjust spacing to make the layout more balanced and concise.

These changes will make the admin view much cleaner while preserving functionality.