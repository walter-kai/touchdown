import { Request, Response, NextFunction } from 'express';
import { authenticateWithGoogle, getGoogleAuthUrl, handleGoogleCallback } from './auth.service';
import catchAsync from '../../utils/catch-async';
import ApiError from '../../utils/api-error';

interface GoogleAuthRequest {
  idToken: string;
}

/**
 * POST /auth/google
 * Authenticate user with Google ID token
 */
export const authenticateGoogle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { idToken }: GoogleAuthRequest = req.body;

  if (!idToken) {
    throw new ApiError(400, 'Missing required field: idToken');
  }

  const result = await authenticateWithGoogle({ idToken });

  return res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * GET /auth/google/login
 * Redirect to Google OAuth consent screen
 */
export const initiateGoogleLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const authUrl = getGoogleAuthUrl();
  res.redirect(authUrl);
  return res as any;
});

/**
 * GET /auth/google/callback
 * Handle Google OAuth callback
 */
export const googleCallback = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    throw new ApiError(400, 'Missing authorization code');
  }

  const result = await handleGoogleCallback(code);

  // If client requested JSON, return structured data instead of HTML page
  const wantsJson =
    (typeof req.headers.accept === 'string' && req.headers.accept.includes('application/json')) ||
    (typeof req.query.format === 'string' && req.query.format.toLowerCase() === 'json');

  if (wantsJson) {
    return res.status(200).json({ success: true, data: result });
  }

  // Send success message to parent window
  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Login Successful</title>
      </head>
      <body>
        <script>
          try {
            // Persist directly into opener's localStorage as a robust fallback
            if (window.opener && window.opener.localStorage) {
              var ttlMs = (typeof ${result.expiresIn} === 'number' ? ${result.expiresIn} : ${7 * 24 * 60 * 60}) * 1000;
              var expiryTime = Date.now() + ttlMs;
              window.opener.localStorage.setItem('dexter_access_token', '${result.accessToken}');
              window.opener.localStorage.setItem('dexter_token_expiry', String(expiryTime));
              window.opener.localStorage.setItem('dexter_user', '${JSON.stringify(result.user).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}');
              // Also write oauth result to trigger storage listeners
              window.opener.localStorage.setItem('dexter_oauth_result', JSON.stringify({ type: 'GOOGLE_AUTH_SUCCESS', token: '${result.accessToken}', user: ${JSON.stringify(result.user)}, expiresIn: ${result.expiresIn} }));
            }
          } catch (e) { /* ignore */ }
          window.opener.postMessage(
            {
              type: 'GOOGLE_AUTH_SUCCESS',
              token: '${result.accessToken}',
              user: ${JSON.stringify(result.user)}
            },
            '*'
          );
          window.close();
        </script>
        <p>Login successful! This window will close automatically...</p>
      </body>
    </html>
  `);
});
