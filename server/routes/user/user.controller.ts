import { Request, Response } from "express";
import userService from "./user.service";
import ApiError from "../../utils/api-error";
import catchAsync from "../../utils/catch-async";
import User, { UserArgs } from "../../../types/User";
// import { db } from "../firebase/firebase.config";
import { AuthenticatedRequest } from "../../middleware/auth";

const setUserChatId = catchAsync(async (req: Request, res: Response): Promise<Response> => {
  if (req.params.telegramId == null) {
    throw new ApiError(400, "Missing telegramId in request params");
  } else if (req.params.chatId == null) {
    throw new ApiError(400, "Missing chatId in request params");
  }
  return res.json({ chatId: await userService.setUserChatId(req.params.telegramId, req.params.chatId) });
});

const updateUser = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const walletAddress = req.user.walletAddress;
  const { username, email, referralId, telegramId, photoUrl } = req.body;

  try {
    // Get current user document
    // const userDocRef = db.collection('users').doc(walletAddress);
    // const userDoc = await userDocRef.get();
    
    // if (!userDoc.exists) {
    //   throw new ApiError(404, "User not found");
    // }

    // Prepare update data (only include defined fields)
    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (referralId !== undefined) updateData.referralId = referralId;
    if (telegramId !== undefined) updateData.telegramId = telegramId;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

    // Update the document
    // await userDocRef.update(updateData);

    // Get updated document
    // const updatedDoc = await userDocRef.get();
    // const updatedData = updatedDoc.data();

    // Format response
    // const user = {
    //   walletAddress,
    //   username: updatedData?.username || '',
    //   email: updatedData?.email || '',
    //   createdAt: updatedData?.createdAt?.toDate() || new Date(),
    //   lastLogin: updatedData?.lastLogin?.toDate() || new Date(),
    //   referralId: updatedData?.referralId || null,
    //   telegramId: updatedData?.telegramId || null,
    //   photoUrl: updatedData?.photoUrl || null,
    // };

    return res.json({ message: "User updated successfully",  });
  } catch (error) {
    console.error('Error updating user:', error);
    throw new ApiError(500, "Failed to update user profile");
  }
});

const createUser = catchAsync(async (req: Request, res: Response): Promise<Response> => {
  if (req.body.walletId == null) {
    throw new ApiError(400, "Missing walletId in request body");
  }
  return res.json({ user: await userService.createUser(req.body) });
});

const login = catchAsync(async (req: Request, res: Response): Promise<Response> => {
  const { walletId, username, referralId } = req.body;

  if (!walletId || typeof walletId !== 'string') {
    throw new ApiError(400, "Missing or invalid walletId in request body");
  }
  // username and referralId are optional for legacy support

  let user = await userService.getUserByWalletId(walletId);
  let isNewUser = false;

  if (!user) {
    const newUserData: UserArgs = {
      dateCreated: new Date(),
      username: null,
      lastLoggedIn: new Date(),
      referralId: referralId || null,
      telegramId: null,
      walletId,
    };
    user = await userService.createUser(newUserData);
    isNewUser = true;
  } else {
    // Update lastLoggedIn
    user.lastLoggedIn = new Date();
    await userService.updateUser(user);
  }

  return res.status(200).json({ user, isNewUser });
});

const checkUsernameAvailability = catchAsync(async (req: Request, res: Response): Promise<Response> => {
  const { username } = req.query;
  if (!username || typeof username !== 'string') {
    throw new ApiError(400, "Username is required");
  }
  // const usersRef = db.collection('users');
  // const q = usersRef.where('username', '==', username);
  // const snapshot = await q.get();
  // const available = snapshot.empty;
  const available = true;
  return res.json({ available });
});

/**
 * Get current user profile based on JWT token
 */
const getCurrentUserProfile = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const walletAddress = req.user.walletAddress;
  
  try {
    // Get user from Firestore using Admin SDK
    // const userDoc = await db.collection('users').doc(walletAddress).get();
    
    // if (!userDoc.exists) {
    //   throw new ApiError(404, "User profile not found");
    // }

    // const userData = userDoc.data();
    
    // Convert Firestore timestamps to dates
    const user = {
      walletAddress,
      // username: userData?.username || '',
      // email: userData?.email || '',
      // createdAt: userData?.createdAt?.toDate() || new Date(),
      // lastLogin: userData?.lastLogin?.toDate() || new Date(),
      // referralId: userData?.referralId || null,
      // telegramId: userData?.telegramId || null,
      // photoUrl: userData?.photoUrl || null,
    };

    return res.json({ user });
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new ApiError(500, "Failed to get user profile");
  }
});

export default {
  setUserChatId,
  updateUser,
  createUser,
  login,
  checkUsernameAvailability,
  getCurrentUserProfile,
};
