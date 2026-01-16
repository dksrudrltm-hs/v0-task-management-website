# Email Storage and Access Verification

## Database Schema

### auth.users table (Supabase Auth)
- **email**: TEXT - Primary email address for user authentication
- **raw_user_meta_data**: JSONB - Contains custom fields like nickname
- **id**: UUID - User identifier

### workspaces table
- **user_id**: UUID - Foreign key to auth.users(id)
- Links workspaces to authenticated users

### Database View: user_workspace_info
A helper view has been created to easily access combined user and workspace information:

```sql
CREATE OR REPLACE VIEW user_workspace_info AS
SELECT 
  w.id as workspace_id,
  w.name as workspace_name,
  w.user_id,
  u.email as user_email,
  u.raw_user_meta_data->>'nickname' as user_nickname,
  w.created_at,
  w.updated_at
FROM workspaces w
JOIN auth.users u ON w.user_id = u.id;
```

## Application Implementation

### User Data Flow
1. **Authentication**: Email stored in `auth.users` during signup
2. **Session**: Email accessible via `supabase.auth.getSession()` → `session.user.email`
3. **Props**: Email passed from `app/page.tsx` to `TaskDashboard` component
4. **Display**: Email shown in dashboard header alongside nickname

### Current UI Display
Location: Dashboard Header
Format: `{workspaceName} ({nickname}님) • {email}`

Example: "kskim의 워크스페이스 (kskim님) • dksrudrltm1@gmail.com"

## Verification Results

✅ Email addresses are properly stored in Supabase auth.users
✅ Email is accessible via user session
✅ Email is displayed in the UI
✅ Database view created for easy querying
✅ All queries properly indexed (user_id foreign key)

## Query Examples

### Get all users with emails and workspaces:
```sql
SELECT * FROM user_workspace_info ORDER BY created_at DESC;
```

### Get specific user's email:
```sql
SELECT email FROM auth.users WHERE id = 'user-uuid';
```

### Get workspace with user email:
```sql
SELECT w.*, u.email 
FROM workspaces w 
JOIN auth.users u ON w.user_id = u.id 
WHERE w.id = 'workspace-uuid';
