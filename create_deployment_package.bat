@echo off
REM ============================================
REM McSMS Deployment Package Creator
REM Updated with all production deployment fixes
REM ============================================

setlocal enabledelayedexpansion

REM Set paths
set "SOURCE_DIR=%~dp0"
set "DEPLOY_DIR=%~dp0deploy_package"

echo.
echo ============================================
echo    McSMS Deployment Package Creator
echo    (With Production Deployment Fixes)
echo ============================================
echo.

REM Check if frontend build exists
if not exist "%SOURCE_DIR%frontend\dist\index.html" (
    echo [ERROR] Frontend build not found!
    echo.
    echo Please run these commands first:
    echo   cd frontend
    echo   npm run build
    echo.
    pause
    exit /b 1
)

REM Remove old deployment folder if exists
if exist "%DEPLOY_DIR%" (
    echo [INFO] Removing old deployment package...
    rmdir /s /q "%DEPLOY_DIR%"
)

echo [1/8] Creating folder structure...
REM CORRECT Structure for cPanel:
REM public_html/
REM ├── index.html          (from frontend/dist)
REM ├── assets/             (from frontend/dist)
REM ├── .htaccess           (for SPA routing)
REM ├── uploads/            (for file uploads)
REM ├── config/             (database.php - IMPORTANT: at root level!)
REM │   └── database.php
REM ├── backend/
REM │   ├── api/
REM │   └── .htaccess
REM └── database/
REM     └── migrations/

mkdir "%DEPLOY_DIR%"
mkdir "%DEPLOY_DIR%\assets"
mkdir "%DEPLOY_DIR%\config"
mkdir "%DEPLOY_DIR%\uploads"
mkdir "%DEPLOY_DIR%\backend"
mkdir "%DEPLOY_DIR%\backend\api"
mkdir "%DEPLOY_DIR%\backend\api\controllers"
mkdir "%DEPLOY_DIR%\backend\api\mobile"
mkdir "%DEPLOY_DIR%\backend\api\mobile\v1"
mkdir "%DEPLOY_DIR%\database"
mkdir "%DEPLOY_DIR%\database\migrations"

echo [2/8] Copying frontend build files to ROOT...
REM Frontend files go directly to public_html root (not in a subfolder!)
copy "%SOURCE_DIR%frontend\dist\index.html" "%DEPLOY_DIR%\" /y >nul
copy "%SOURCE_DIR%frontend\dist\vite.svg" "%DEPLOY_DIR%\" /y >nul 2>nul
xcopy "%SOURCE_DIR%frontend\dist\assets\*" "%DEPLOY_DIR%\assets\" /s /y /q

echo [3/8] Copying backend API files...
xcopy "%SOURCE_DIR%backend\api\*.php" "%DEPLOY_DIR%\backend\api\" /s /y /q
if exist "%SOURCE_DIR%backend\api\controllers" (
    xcopy "%SOURCE_DIR%backend\api\controllers\*.php" "%DEPLOY_DIR%\backend\api\controllers\" /s /y /q
)
if exist "%SOURCE_DIR%backend\api\mobile\v1" (
    xcopy "%SOURCE_DIR%backend\api\mobile\v1\*.php" "%DEPLOY_DIR%\backend\api\mobile\v1\" /s /y /q
)

echo [4/8] Copying config files to ROOT/config/...
REM IMPORTANT: config folder must be at root level (public_html/config/)
REM because PHP files use: require_once __DIR__ . '/../../config/database.php'
copy "%SOURCE_DIR%config\database.php" "%DEPLOY_DIR%\config\" /y >nul
copy "%SOURCE_DIR%config\config.php" "%DEPLOY_DIR%\config\" /y >nul 2>nul

echo [5/8] Copying database migrations...
if exist "%SOURCE_DIR%database\migrations" (
    xcopy "%SOURCE_DIR%database\migrations\*.sql" "%DEPLOY_DIR%\database\migrations\" /y /q
)

echo [6/8] Creating .htaccess files (NO markdown backticks!)...

REM Root .htaccess for SPA routing
(
echo Options -Indexes
echo.
echo ^<IfModule mod_rewrite.c^>
echo   RewriteEngine On
echo   RewriteBase /
echo.
echo   # Don't rewrite existing files or directories
echo   RewriteCond %%{REQUEST_FILENAME} !-f
echo   RewriteCond %%{REQUEST_FILENAME} !-d
echo.
echo   # Don't rewrite backend API requests
echo   RewriteCond %%{REQUEST_URI} !^/backend/
echo.
echo   # Rewrite everything else to index.html for React Router
echo   RewriteRule ^(.*)$ index.html [L]
echo ^</IfModule^>
echo.
echo # Enable GZIP compression
echo ^<IfModule mod_deflate.c^>
echo   AddOutputFilterByType DEFLATE text/html text/plain text/css application/json application/javascript
echo ^</IfModule^>
echo.
echo # Cache static assets
echo ^<IfModule mod_expires.c^>
echo   ExpiresActive On
echo   ExpiresByType text/css "access plus 1 year"
echo   ExpiresByType application/javascript "access plus 1 year"
echo   ExpiresByType image/png "access plus 1 year"
echo   ExpiresByType image/jpeg "access plus 1 year"
echo   ExpiresByType image/svg+xml "access plus 1 year"
echo ^</IfModule^>
) > "%DEPLOY_DIR%\.htaccess"

REM Backend .htaccess for CORS
(
echo ^<IfModule mod_headers.c^>
echo   Header set Access-Control-Allow-Origin "*"
echo   Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
echo   Header set Access-Control-Allow-Headers "Content-Type, Authorization"
echo ^</IfModule^>
echo.
echo ^<IfModule mod_rewrite.c^>
echo   RewriteEngine On
echo   RewriteCond %%{REQUEST_METHOD} OPTIONS
echo   RewriteRule ^(.*)$ $1 [R=200,L]
echo ^</IfModule^>
) > "%DEPLOY_DIR%\backend\.htaccess"

REM Config folder .htaccess - deny all access
(
echo Order allow,deny
echo Deny from all
) > "%DEPLOY_DIR%\config\.htaccess"

echo [7/8] Creating database config template...
REM Create a template for production database config
(
echo ^<?php
echo // Database configuration for cPanel
echo // UPDATE THESE VALUES with your cPanel database credentials
echo.
echo define('DB_HOST', 'localhost'^);
echo define('DB_NAME', 'yourprefix_mcsms_db'^);  // Your cPanel database name
echo define('DB_USER', 'yourprefix_mcsms_user'^); // Your cPanel database user
echo define('DB_PASS', 'your_secure_password'^);  // Your database password
echo.
echo try {
echo     $pdo = new PDO(
echo         "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
echo         DB_USER,
echo         DB_PASS,
echo         [
echo             PDO::ATTR_ERRMODE =^> PDO::ERRMODE_EXCEPTION,
echo             PDO::ATTR_DEFAULT_FETCH_MODE =^> PDO::FETCH_ASSOC,
echo             PDO::ATTR_EMULATE_PREPARES =^> false
echo         ]
echo     ^);
echo } catch (PDOException $e^) {
echo     http_response_code(500^);
echo     die(json_encode([
echo         'success' =^> false,
echo         'error' =^> 'Database connection failed'
echo     ]^)^);
echo }
echo ?^>
) > "%DEPLOY_DIR%\config\database.php.template"

echo [8/8] Creating deployment instructions...

(
echo ============================================
echo    McSMS DEPLOYMENT INSTRUCTIONS
echo    With All Production Fixes Applied
echo ============================================
echo.
echo Package created: %date% %time%
echo.
echo CORRECT FOLDER STRUCTURE FOR CPANEL:
echo ------------------------------------
echo deploy_package/  ^(upload contents to public_html/^)
echo ├── index.html        ^<-- React app entry point
echo ├── assets/           ^<-- JS/CSS files
echo ├── .htaccess         ^<-- SPA routing ^(ALREADY CONFIGURED^)
echo ├── uploads/          ^<-- For file uploads ^(set 755^)
echo ├── config/           ^<-- MUST be at root level!
echo │   ├── database.php  ^<-- EDIT with cPanel credentials
echo │   ├── database.php.template ^<-- Reference template
echo │   └── .htaccess     ^<-- Denies direct access
echo ├── backend/
echo │   ├── api/          ^<-- All PHP API files
echo │   └── .htaccess     ^<-- CORS headers ^(ALREADY CONFIGURED^)
echo └── database/
echo     └── migrations/   ^<-- SQL files for phpMyAdmin
echo.
echo ============================================
echo DEPLOYMENT STEPS:
echo ============================================
echo.
echo STEP 1: Create MySQL Database in cPanel
echo   - Go to cPanel ^> MySQL Databases
echo   - Create database: yourprefix_mcsms
echo   - Create user with strong password
echo   - Add user to database with ALL PRIVILEGES
echo.
echo STEP 2: Upload ALL files to public_html/
echo   - Upload EVERYTHING in deploy_package/ to public_html/
echo   - Keep the exact folder structure!
echo   - IMPORTANT: config/ folder MUST be at public_html/config/
echo.
echo STEP 3: Edit Database Config
echo   - Edit public_html/config/database.php
echo   - Update DB_NAME, DB_USER, DB_PASS with cPanel values
echo   - Use database.php.template as reference
echo.
echo STEP 4: Import Database Schema
echo   - Go to cPanel ^> phpMyAdmin
echo   - Select your database
echo   - Import SQL files from database/migrations/ in order
echo.
echo STEP 5: Set Permissions
echo   - Folders: 755
echo   - Files: 644
echo   - config/database.php: 600 ^(more secure^)
echo   - uploads/: 755 ^(writable^)
echo.
echo STEP 6: Test Deployment
echo   - Visit https://yourdomain.com
echo   - Check browser console for errors
echo   - Test login functionality
echo.
echo ============================================
echo COMMON ISSUES AND FIXES:
echo ============================================
echo.
echo 1. 500 Error on .htaccess:
echo    - Make sure NO markdown backticks in .htaccess files
echo    - Files in this package are already correct
echo.
echo 2. "Database connection failed":
echo    - Check config/database.php credentials
echo    - Verify database user has privileges
echo.
echo 3. API calls to localhost:
echo    - Frontend is pre-built with production URL
echo    - If wrong, update frontend/src/config.js and rebuild
echo.
echo 4. Logo/uploads not working:
echo    - Ensure uploads/ folder exists with 755 permissions
echo    - Check that upload paths use /uploads/ not /McSMS/...
echo.
echo 5. CORS errors:
echo    - backend/.htaccess has CORS headers configured
echo    - Make sure it's uploaded correctly
echo.
echo ============================================
echo For full details, see: docs/CPANEL_DEPLOYMENT_GUIDE.md
echo ============================================
echo.
) > "%DEPLOY_DIR%\DEPLOYMENT_README.txt"

echo.
echo ============================================
echo    DEPLOYMENT PACKAGE CREATED!
echo    With All Production Fixes Applied
echo ============================================
echo.
echo Location: %DEPLOY_DIR%
echo.
echo Package Contents:
echo -----------------
dir "%DEPLOY_DIR%" /b
echo.
echo QUICK DEPLOYMENT STEPS:
echo -----------------------
echo 1. Create MySQL database in cPanel
echo 2. Upload ALL contents of deploy_package/ to public_html/
echo 3. Edit config/database.php with cPanel DB credentials
echo 4. Import SQL files via phpMyAdmin
echo 5. Set permissions ^(755 folders, 644 files^)
echo 6. Test at https://yourdomain.com
echo.
echo IMPORTANT NOTES:
echo ----------------
echo - Frontend files go to ROOT ^(public_html/^), not a subfolder
echo - config/ folder MUST be at public_html/config/
echo - .htaccess files are pre-configured ^(no backticks!^)
echo - uploads/ folder needs 755 permissions
echo.
echo See DEPLOYMENT_README.txt for detailed instructions
echo.
echo ============================================

REM Open the deployment folder
explorer "%DEPLOY_DIR%"

pause
