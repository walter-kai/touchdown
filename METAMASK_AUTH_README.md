# Authentication System

## Google OAuth Authentication (Planned)

The application uses a simple username-based registration system and is being prepared for Google OAuth integration.

### Current Authentication

**Simple Registration (No Wallet Required)**

Users create accounts by providing:
- Username (required, minimum 3 characters)
- Email (optional)
- Referral code (optional)

### Authentication Flow

```
POST /auth/simple
Body: {
  username: string,
  email?: string,
  referralId?: string
}

Response: {
  success: true,
  data: {
    accessToken: string,
    user: { ... },
    expiresIn: number
  }
}
```

### Session Management

- JWT tokens expire after 24 hours
- Token is stored in localStorage
- User session is restored on app reload

### Planned: Google OAuth Integration

Google OAuth will be added to provide:
- Seamless sign-in with Google accounts
- No password management required
- Improved security and user experience
- Optional: Link Google account to existing username-based accounts

### Migration from MetaMask

**Completed Changes:**
- ✅ Removed MetaMask SDK dependencies
- ✅ Removed wallet connection requirements
- ✅ Updated UI to remove MetaMask references
- ✅ Simplified onboarding to username-based registration
- ✅ Cleaned up navigation components
- ✅ Updated landing pages and documentation

**Legacy Support:**
- The MetaMask authentication endpoint (`/auth/metamask`) remains available for backwards compatibility but is deprecated

### Implementation Notes

For developers planning to add Google OAuth:

1. Install Google OAuth library: `npm install @react-oauth/google`
2. Create Google OAuth credentials in Google Cloud Console
3. Add `GoogleOAuthProvider` wrapper in App.tsx
4. Create new endpoint: `/auth/google`
5. Update LoginModal to include "Sign in with Google" button
6. Store Google user ID alongside username in Firestore

### Security Features

- JWT-based authentication
- Secure token storage
- Username uniqueness validation
- Optional email verification (future enhancement)
- Rate limiting on auth endpoints (recommended)
