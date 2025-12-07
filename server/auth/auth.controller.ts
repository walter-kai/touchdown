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
            console.log('[AUTH] Callback page loaded');
            var authData = {
              type: 'GOOGLE_AUTH_SUCCESS',
              token: '${result.accessToken}',
              user: ${JSON.stringify(result.user)},
              expiresIn: ${result.expiresIn}
            };
            
            try {
              // Show success message
              document.getElementById('status').textContent = 'Login successful!';
              console.log('[AUTH] Attempting to communicate with parent window');
              
              // Method 1: localStorage (works cross-tab)
              try {
                var ttlMs = (typeof ${result.expiresIn} === 'number' ? ${result.expiresIn} : ${7 * 24 * 60 * 60}) * 1000;
                var expiryTime = Date.now() + ttlMs;
                localStorage.setItem('dexter_access_token', '${result.accessToken}');
                localStorage.setItem('dexter_token_expiry', String(expiryTime));
                localStorage.setItem('dexter_user', '${JSON.stringify(result.user).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}');
                localStorage.setItem('dexter_oauth_result', JSON.stringify(authData));
                console.log('[AUTH] Stored auth data in localStorage');
              } catch (e) { 
                console.error('[AUTH] Error storing to localStorage:', e);
              }
              
              // Method 2: Also try to write to opener's localStorage if accessible
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.localStorage.setItem('dexter_access_token', '${result.accessToken}');
                  window.opener.localStorage.setItem('dexter_token_expiry', String(expiryTime));
                  window.opener.localStorage.setItem('dexter_user', '${JSON.stringify(result.user).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}');
                  window.opener.localStorage.setItem('dexter_oauth_result', JSON.stringify(authData));
                  console.log('[AUTH] Stored auth data in opener localStorage');
                }
              } catch (e) {
                console.log('[AUTH] Could not access opener localStorage (expected in production):', e.message);
              }
              
              // Method 3: BroadcastChannel API (modern browsers)
              try {
                var channel = new BroadcastChannel('google_auth_channel');
                channel.postMessage(authData);
                console.log('[AUTH] Sent via BroadcastChannel');
                channel.close();
              } catch (e) {
                console.log('[AUTH] BroadcastChannel not supported:', e.message);
              }
              
              // Method 4: postMessage to opener (traditional method)
              try {
                if (window.opener && !window.opener.closed) {
                  console.log('[AUTH] Sending postMessage to opener');
                  window.opener.postMessage(authData, window.location.origin);
                  window.opener.postMessage(authData, '*');
                  console.log('[AUTH] postMessage sent');
                }
              } catch (e) {
                console.error('[AUTH] Error sending postMessage:', e);
              }
              
            } catch (e) { 
              console.error('[AUTH] General error:', e);
            }
            
            // Close window - try multiple methods
            var attemptClose = function() {
              console.log('[AUTH] Attempting to close window');
              try {
                // Update UI
                document.getElementById('status').textContent = 'Closing window...';
                
                // Method 1: Direct close
                window.close();
                
                // Method 2: If still open, try alternative approaches
                setTimeout(function() {
                  if (!window.closed) {
                    console.log('[AUTH] Window still open, trying alternative methods');
                    try {
                      // Clear opener reference and try again
                      window.opener = null;
                      window.close();
                    } catch (e) {
                      console.log('[AUTH] Alt method 1 failed:', e.message);
                    }
                    
                    // Last resort: navigate to blank
                    setTimeout(function() {
                      if (!window.closed) {
                        console.log('[AUTH] Auto-close failed, showing manual close message');
                        document.getElementById('status').textContent = 'You can close this window now';
                        document.querySelector('.message').textContent = 'Authentication Complete';
                      }
                    }, 500);
                  } else {
                    console.log('[AUTH] Window closed successfully');
                  }
                }, 100);
              } catch (e) {
                console.error('[AUTH] Error closing window:', e);
                document.getElementById('status').textContent = 'You can close this window now';
              }
            };
            
            // Delay close to ensure all messages are sent
            setTimeout(attemptClose, 300);
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
