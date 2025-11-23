# Uploads Directory

This directory contains user-uploaded files organized by category.

## Structure:
- `hosts/` - Host profile images uploaded by users

## Notes:
- Files are automatically named with UUIDs to prevent conflicts
- The server validates file types and sizes before saving
- Files are served via FastAPI's StaticFiles middleware
- Access uploaded files at: `/uploads/{category}/{filename}`