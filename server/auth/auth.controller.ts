import { Request, Response, NextFunction } from 'express';
import { authenticateWithGoogle, getGoogleAuthUrl, handleGoogleCallback, testAutoLogin } from './auth.service';
import catchAsync from '../utils/catch-async';
import ApiError from '../utils/api-error';

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
  console.log('=== INITIATE GOOGLE LOGIN ===');
  const authUrl = getGoogleAuthUrl();
  console.log('Auth URL:', authUrl);
  console.log('============================');
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

  // Send success message to parent window with styled page
  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authenticating...</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(to bottom, #000000, #0a0a0f);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: white;
          }
          .container {
            background: #181a23;
            border: 1px solid rgba(0, 255, 231, 0.3);
            border-radius: 0.5rem;
            padding: 2rem 3rem;
            text-align: center;
            box-shadow: 0 0 20px rgba(0, 255, 231, 0.15);
          }
          .spinner {
            width: 40px;
            height: 40px;
            margin: 0 auto 1rem;
            border: 3px solid rgba(0, 255, 231, 0.2);
            border-top-color: #00ffe7;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .message {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
          }
          .success {
            color: #00ffe7;
            margin-top: 0.5rem;
            font-size: 0.875rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <div class="message">Authenticating...</div>
          <div class="success" id="status"></div>
        </div>
        <script>
          (function() {
            try {
              // Show success message
              document.getElementById('status').textContent = 'Login successful!';
              
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
            } catch (e) { 
              console.error('Error storing auth data:', e);
            }
            
            // Send postMessage to opener
            try {
              if (window.opener) {
                window.opener.postMessage(
                  {
                    type: 'GOOGLE_AUTH_SUCCESS',
                    token: '${result.accessToken}',
                    user: ${JSON.stringify(result.user)}
                  },
                  '*'
                );
              }
            } catch (e) {
              console.error('Error sending postMessage:', e);
            }
            
            // Close window after a short delay to ensure messages are sent
            setTimeout(function() {
              try {
                window.close();
                // If window.close() doesn't work (some browsers block it), try alternative
                if (!window.closed) {
                  window.opener = null;
                  window.open('', '_self');
                  window.close();
                }
              } catch (e) {
                console.error('Error closing window:', e);
                document.getElementById('status').textContent = 'Please close this window';
              }
            }, 500);
          })();
        </script>
      </body>
    </html>
  `);
});

/**
 * GET /test
 * Auto-login for development/testing
 */
export const testLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const result = await testAutoLogin();

  // Send success page that stores token and redirects with styled page
  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Login</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(to bottom, #000000, #0a0a0f);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: white;
          }
          .container {
            background: #181a23;
            border: 1px solid rgba(0, 255, 231, 0.3);
            border-radius: 0.5rem;
            padding: 2rem 3rem;
            text-align: center;
            box-shadow: 0 0 20px rgba(0, 255, 231, 0.15);
          }
          .spinner {
            width: 40px;
            height: 40px;
            margin: 0 auto 1rem;
            border: 3px solid rgba(0, 255, 231, 0.2);
            border-top-color: #00ffe7;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .message {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
          }
          .success {
            color: #00ffe7;
            margin-top: 0.5rem;
            font-size: 0.875rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <div class="message">Test Login</div>
          <div class="success">Redirecting...</div>
        </div>
        <script>
          // Store in localStorage
          var ttlMs = ${result.expiresIn} * 1000;
          var expiryTime = Date.now() + ttlMs;
          localStorage.setItem('dexter_access_token', '${result.accessToken}');
          localStorage.setItem('dexter_token_expiry', String(expiryTime));
          localStorage.setItem('dexter_user', '${JSON.stringify(result.user).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}');
          
          // Redirect to home
          setTimeout(function() {
            window.location.href = '/';
          }, 500);
        </script>
      </body>
    </html>
  `);
});
