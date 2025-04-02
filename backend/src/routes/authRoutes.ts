import express from 'express';
import { authController } from '../controllers/authController';
import { verifyFirebaseAuth, requireAuth } from '../middleware/authMiddleware';

const router = express.Router();

// Apply Firebase authentication verification to all routes
router.use(verifyFirebaseAuth);

/**
 * @route   GET /api/auth/google
 * @desc    Redirect user to Google OAuth 2.0 consent page
 * @access  Public
 */
router.get('/google', authController.googleAuth);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth 2.0 callback after user grants/denies permission
 * @access  Public
 */
router.get('/google/callback', authController.googleCallback);

/**
 * @route   GET /api/auth/status
 * @desc    Check if the user is authenticated and return user info
 * @access  Public
 */
router.get('/status', authController.checkAuthStatus);

/**
 * @route   POST /api/auth/logout
 * @desc    Log the user out by revoking tokens
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/auth/google/link
 * @desc    Link Google account to existing Firebase user
 * @access  Private (requires authentication)
 */
router.get('/google/link', requireAuth, authController.linkGoogleAccount);

/**
 * @route   POST /api/auth/google/unlink
 * @desc    Unlink Google account from Firebase user
 * @access  Private (requires authentication)
 */
router.post('/google/unlink', requireAuth, authController.unlinkGoogleAccount);

export default router;
