# Academic Calendar Deployment Guide

## Prerequisites
- Access to cPanel File Manager
- Access to phpMyAdmin
- SSH access or Terminal access in cPanel
- Node.js installed on production server (for building frontend)

## Files to Deploy

### Backend Files
- `backend/api/academic_calendar.php`
- `backend/api/migrations/add_academic_calendar.sql`

### Frontend Files
- `frontend/src/components/AcademicCalendarSetup.jsx`
- `frontend/src/pages/admin/Terms.jsx`
- `frontend/src/config.js` (already updated to production URLs)

## Deployment Steps

### Step 1: Upload Backend Files via cPanel File Manager

1. Log in to cPanel
2. Go to **File Manager**
3. Navigate to `public_html/backend/api/`
4. Upload `academic_calendar.php`
5. Navigate to `public_html/backend/api/migrations/`
6. Upload `add_academic_calendar.sql`

### Step 2: Run Database Migration via phpMyAdmin

1. Log in to cPanel
2. Go to **phpMyAdmin**
3. Select your database
4. Click the **SQL** tab
5. Copy the contents of `add_academic_calendar.sql`
6. Paste into the SQL editor
7. Click **Go** to execute
8. Verify the migration was successful:
   - Check that `academic_years` table exists
   - Check that `academic_terms` table has new columns (`year_id`, `is_current`)
   - Check that `system_config` table has new fields (`auto_transition_terms`, `term_transition_notice_days`, `default_term_duration_days`)

### Step 3: Upload Frontend Files via cPanel File Manager

1. Go to **File Manager**
2. Navigate to `public_html/frontend/src/components/`
3. Upload `AcademicCalendarSetup.jsx`
4. Navigate to `public_html/frontend/src/pages/admin/`
5. Upload `Terms.jsx`
6. Navigate to `public_html/frontend/src/`
7. Upload `config.js`

### Step 4: Build Frontend for Production

**Option A: Using cPanel Terminal (Recommended)**
1. Log in to cPanel
2. Go to **Terminal**
3. Navigate to frontend directory:
   ```bash
   cd public_html/frontend
   ```
4. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
5. Build for production:
   ```bash
   npm run build
   ```
6. This creates the production build in `public_html/frontend/dist/`

**Option B: Using SSH**
1. SSH into your server
2. Navigate to frontend directory:
   ```bash
   cd public_html/frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build for production:
   ```bash
   npm run build
   ```

**Option C: Build Locally and Upload**
1. On your local machine:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. Upload the contents of `frontend/dist/` to `public_html/` on your server

### Step 5: Update Web Server Configuration

If your web server is not already serving from the `dist` folder:

**For Apache:**
1. In cPanel, go to **Domains**
2. Find your domain and click **Manage**
3. Update the document root to point to `public_html/frontend/dist/` or ensure your current document root serves the built files correctly

**For Nginx:**
Update your Nginx configuration to serve from the `dist` folder.

### Step 6: Test the Deployment

1. Visit your production site: `https://eea.mcaforo.com`
2. Navigate to the **Terms** page
3. Verify the following:
   - "Setup Calendar" button appears (purple button with Settings icon)
   - "Auto-Transition" button appears (orange button with RefreshCw icon)
   - Current academic period display banner appears
4. Click "Setup Calendar" and complete the wizard:
   - Enter academic year name (e.g., "2024/2025")
   - Select number of terms (3)
   - Enter duration per term (90 days)
   - Click "Create Academic Calendar"
5. Verify the academic year and terms were created
6. Test the auto-transition feature

## Troubleshooting

### Issue: academic_calendar.php returns 404
- Verify the file was uploaded to the correct location: `public_html/backend/api/academic_calendar.php`
- Check file permissions (should be 644)
- Clear browser cache

### Issue: Migration fails
- Check that the database user has CREATE TABLE and ALTER TABLE permissions
- Verify the database connection details in `config/database.php` are correct
- Check for any syntax errors in the SQL

### Issue: Frontend build fails
- Ensure Node.js is installed on the server (version 14 or higher)
- Run `npm install` to install dependencies
- Check for any build errors in the console output

### Issue: Terms page shows errors
- Check browser console for specific error messages
- Verify the API_BASE_URL in `config.js` is correct for production
- Ensure the migration was run successfully

### Issue: Setup Calendar button not appearing
- Verify `Terms.jsx` was uploaded correctly
- Clear browser cache and reload the page
- Check that the component is properly imported

## Post-Deployment Checklist

- [ ] academic_calendar.php uploaded to production
- [ ] Database migration executed successfully
- [ ] AcademicCalendarSetup.jsx uploaded to production
- [ ] Terms.jsx uploaded to production
- [ ] config.js updated with production URLs
- [ ] Frontend built successfully
- [ ] Web server serving built files
- [ ] "Setup Calendar" button visible in Terms page
- [ ] "Auto-Transition" button visible in Terms page
- [ ] Current academic period display visible
- [ ] Setup wizard tested successfully
- [ ] Academic year created
- [ ] Terms auto-generated
- [ ] Auto-transition feature tested

## Rollback Instructions

If deployment fails:

1. **Rollback Backend:**
   - Delete `academic_calendar.php` from `public_html/backend/api/`
   - In phpMyAdmin, run SQL to drop the new tables/columns if needed

2. **Rollback Frontend:**
   - Restore previous versions of `Terms.jsx` and `AcademicCalendarSetup.jsx`
   - Rebuild frontend with previous code
   - Or restore from backup

3. **Rollback Database:**
   ```sql
   DROP TABLE IF EXISTS academic_years;
   ALTER TABLE academic_terms DROP COLUMN year_id;
   ALTER TABLE academic_terms DROP COLUMN is_current;
   ALTER TABLE system_config DROP COLUMN auto_transition_terms;
   ALTER TABLE system_config DROP COLUMN term_transition_notice_days;
   ALTER TABLE system_config DROP COLUMN default_term_duration_days;
   ```

## Support

If you encounter any issues during deployment:
1. Check the browser console for JavaScript errors
2. Check the server error logs in cPanel
3. Verify file permissions (PHP files should be 644)
4. Ensure the database migration was successful
5. Test the API endpoints directly using curl or Postman
