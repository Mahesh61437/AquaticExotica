# Django JWT Integration Guide

This guide explains how the React frontend integrates with Django JWT authentication.

## Overview

The frontend has been updated to work with Django's JWT authentication system. When a user logs in successfully, the Django backend returns JWT tokens that are stored locally and automatically included in subsequent API requests.

## Key Changes Made

### 1. Updated User Interface
- Modified the `User` interface to match Django's response structure
- Added `DjangoAuthResponse` interface for login responses
- Made `fullName` optional since Django might not provide it

### 2. Token Management
- Added token storage utilities using localStorage
- Access token stored as `aquaticexotica_access_token`
- Refresh token stored as `aquaticexotica_refresh_token`
- Added `getAccessToken()` method to AuthContext

### 3. Updated Authentication Flow
- `signIn()` now handles Django JWT response format
- Tokens are automatically stored upon successful login
- User object is created from Django response data
- `signOut()` clears stored tokens

### 4. Automatic Token Inclusion
- Updated `apiRequest()` to automatically include Authorization header
- All API calls now include `Bearer <token>` header when available
- Updated `getQueryFn()` for React Query to include tokens

## Django Response Format

The Django login API returns:
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isAdmin": false,
  "username": "user@example.com",
  "email": "user@example.com",
  "id": 2
}
```

## Frontend User Object

The frontend converts this to:
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string; // Uses username if not provided
  isAdmin: boolean;
  addresses?: Address[];
}
```

## API Request Headers

All authenticated requests now include:
```
Authorization: Bearer <access_token>
```

## Testing

Use the test component at `/test` to verify the integration:
1. Click "Test Login" to attempt authentication
2. Check console for any errors
3. Click "Show Token" to verify token storage
4. Click "Test Logout" to clear tokens

## Environment Variables

Make sure your `.env` file includes:
```
VITE_API_BASE=https://your-django-backend-url.com
```

## Security Notes

- Tokens are stored in localStorage (consider httpOnly cookies for production)
- Access tokens are automatically included in all API requests
- Tokens are cleared on logout or 401 errors
- Consider implementing token refresh logic for expired tokens

## Next Steps

1. Implement token refresh logic using the refresh token
2. Add token expiration handling
3. Consider using httpOnly cookies for better security
4. Add automatic token refresh before expiration 