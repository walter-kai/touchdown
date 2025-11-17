import admin from "firebase-admin"; // Import admin SDK
import User, { FireStoreUser, UserArgs} from "../../../types/User";

import logger from "../../utils/logger";
// import { db } from "../firebase/firebase.config";
import ApiError from "../../utils/api-error";

// Initialize Firestore using Firebase Admin SDK
// const firestore = admin.firestore();

// import { collection, query, where, getDocs, addDoc } from "firebase/firestore"; 
import { Timestamp } from '@google-cloud/firestore'; // Ensure this is correct
import type { Telegraf } from 'telegraf';
import { PassThrough } from "stream";

/**
 * Helper function to convert Firestore Timestamp (in any format) to JavaScript Date
 */
function convertTimestampToDate(timestamp: any): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  } else if (timestamp && typeof timestamp === 'object') {
    // Handle serialized Timestamp format
    const seconds = timestamp._seconds || timestamp.seconds;
    const nanoseconds = timestamp._nanoseconds || timestamp.nanoseconds || 0;
    if (seconds !== undefined) {
      return new Date(seconds * 1000 + nanoseconds / 1000000);
    }
  }
  // Fallback to current date if timestamp is invalid
  return new Date();
}

/**
 * Updates an existing user in the Firestore database by their Telegram ID.
 *
 * @param {User} user - The user object containing updated details.
 * @param {string | undefined} [breadcrumb] - Optional breadcrumb for logging.
 * @returns {Promise<User>} The updated user object.
 */
async function updateUser(user: User, breadcrumb?: string): Promise<User> {
  const newBreadcrumb = `updateUser(${user.walletId}):${breadcrumb}`;

  // const usersRef = db.collection('users');

  // Update data directly in the update call
  try {
    // // Use walletId as document ID directly
    // const userDocRef = usersRef.doc(user.walletId);
    // const userDoc = await userDocRef.get();

    // if (!userDoc.exists) {
    //   throw new ApiError(404, `User with walletId ${user.walletId} not found.`);
    // }

    // // Convert Date objects to Firestore Timestamps before storing
    // const updateData = {
    //   ...user,
    //   dateCreated: Timestamp.fromDate(user.dateCreated),
    //   lastLoggedIn: Timestamp.fromDate(user.lastLoggedIn),
    // };

    // await userDocRef.update(updateData);

    // logger.info(`Updated user with walletId ${user.walletId}.`);

    // const updatedUserSnapshot = await userDocRef.get();
    // const updatedUserData = updatedUserSnapshot.data() as FireStoreUser;

    // // Convert Firestore Timestamps to Date objects
    // const dateCreated = convertTimestampToDate(updatedUserData.dateCreated);
    // const lastLoggedIn = convertTimestampToDate(updatedUserData.lastLoggedIn);

    return new User({
      // ...updatedUserData,
      // dateCreated,
      // lastLoggedIn,
    });
  } catch (error) {
    logger.error(`Error updating user: ${error}, breadcrumb: ${newBreadcrumb}`);
    throw error; // Re-throw the error after logging
  }
}

/**
 * Creates a new user or returns the existing user if found.
 *
 * @param {UserArgs} args - The user details to create.
 * @param {string} args.walletId - Wallet ID of the user to create.
 * @param {string | null} [args.telegramId] - Telegram ID of the user to create.
 * @param {string} args.username - Username of the user to create.
 * @param {string | null} [args.referralId] - Referral ID of the user who referred this user.
 * @param {Date} args.dateCreated - Date the user was created.
 * @param {Date} args.lastLoggedIn - Last login date.
 * @param {string | undefined} [breadcrumb] - Optional breadcrumb for logging.
 * @returns {Promise<User>} The created or found user object.
 */
async function createUser(
  args: UserArgs,
  breadcrumb?: string
): Promise<User> {
  const newBreadcrumb = `createUser(${args.walletId}):${breadcrumb}`;
  const timeNow = Timestamp.now();
// 
  // const usersRef = db.collection("users");

  logger.info(
    JSON.stringify({
      breadcrumb: newBreadcrumb,
      args,
    })
  );

  // Check if a user with the same walletId already exists
  // const userDocRef = usersRef.doc(args.walletId);
  // const userDoc = await userDocRef.get();

  // if (userDoc.exists) {
  //   // User exists, return existing user data
  //   const existingUserData = userDoc.data() as FireStoreUser;

  //   logger.info(`User with walletId ${args.walletId} already exists.`);

  //   // Convert Firestore Timestamps to Date objects
  //   const existingDateCreated = convertTimestampToDate(existingUserData.dateCreated);
  //   const existingLastLoggedIn = convertTimestampToDate(existingUserData.lastLoggedIn);

  //   return new User({
  //     ...existingUserData,
  //     dateCreated: existingDateCreated, // Keep the original creation date
  //     lastLoggedIn: existingLastLoggedIn,
  //   });
  // }

  // Set the `dateCreated` to the current timestamp for new users
  const userPayload: FireStoreUser = {
    ...args,
    dateCreated: Timestamp.fromDate(args.dateCreated), // Convert Date to Firestore Timestamp
    lastLoggedIn: Timestamp.fromDate(args.lastLoggedIn), // Convert Date to Firestore Timestamp
  };

  // Create a new document with walletId as the document ID
  // await userDocRef.set(userPayload);

  logger.info(`Created new user with walletId as document ID: ${args.walletId}.`);

  // Retrieve the newly created user's data
  // const newUserSnapshot = await userDocRef.get();
  // const newUserData = newUserSnapshot.data() as FireStoreUser;

  // // Convert Firestore Timestamps to Date objects
  // const newDateCreated = convertTimestampToDate(newUserData.dateCreated);
  // const newLastLoggedIn = convertTimestampToDate(newUserData.lastLoggedIn);

  return new User({
    // ...newUserData,
    // dateCreated: newDateCreated,
    // lastLoggedIn: newLastLoggedIn,
  });
}

const getUserByWalletId = async (
  walletId: string,
  breadcrumb?: string
): Promise<User | null> => {
  const newBreadcrumb = `getUserByWalletId(${walletId}):${breadcrumb}`;
  // logger.info(JSON.stringify({ breadcrumb: newBreadcrumb }));

  if (!walletId) {
    throw new ApiError(400, `Invalid walletId provided. ${newBreadcrumb}`);
  }

  // const usersCollection = db.collection("users");
  // Use walletId as document ID directly for better performance
  // const userDocRef = usersCollection.doc(walletId);
  // const userDoc = await userDocRef.get();

  // logger.info(JSON.stringify({ breadcrumb: newBreadcrumb, docExists: userDoc.exists }));

  // if (!userDoc.exists) {
  //   logger.info(JSON.stringify({ breadcrumb: newBreadcrumb, message: "No user found." }));
  //   return null;
  // }

  // const queryData = userDoc.data() as FireStoreUser;

  // Convert Firestore Timestamps to Date objects
  // const lastLoggedIn = convertTimestampToDate(queryData.lastLoggedIn);
  // const dateCreated = convertTimestampToDate(queryData.dateCreated);

  const user = new User({
    // ...queryData,
    // dateCreated,
    // lastLoggedIn,
  });

  logger.info(JSON.stringify({ breadcrumb: newBreadcrumb, user }));

  return user;    
};

/**
 * Download the file from Telegram and upload it to Firebase Storage.
 * @param {Telegraf} bot - The Telegraf bot instance.
 * @param {string} fileId - The file ID to fetch the image.
 * @param {string} userId - The user's Telegram ID to create a unique filename.
 * @returns {Promise<string | null>} The download URL in Firebase Storage or null if not successful.
 */
const downloadAndUploadToFirebase = async (bot: Telegraf, fileId: string, userId: string): Promise<string | null> => {
  try {
    const file = await bot.telegram.getFile(fileId);
    if (file && file.file_path) {
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

      // Download the image
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Failed to fetch file from Telegram');

      // Create a reference to the Firestore Storage bucket
      const bucket = admin.storage().bucket(); // Initialize the storage bucket
      const fileName = `${userId}.jpg`; // Create a unique filename
      const fileUploadStream = bucket.file(`profilePics/${fileName}`).createWriteStream({
        metadata: {
          contenttype: response.headers.get('content-type'), // Correct property name
        },
      });

      // Convert the ReadableStream from fetch to a Node.js stream
      const passThroughStream = new PassThrough();
      const reader = response.body?.getReader();

      // Read the stream and push chunks to PassThrough
      const pump = async () => {
        while (true) {
          const result = await reader?.read(); // Read the next chunk
          if (result?.done) break; // Exit loop if done

          // Push the chunk into the PassThrough stream
          passThroughStream.write(result?.value);
        }
        passThroughStream.end(); // End the PassThrough stream
      };

      pump().catch(err => {
        console.error('Error reading response stream:', err);
        passThroughStream.destroy(err); // Handle errors and destroy stream
      });

      // Pipe PassThrough to the upload stream
      passThroughStream.pipe(fileUploadStream);

      return new Promise((resolve, reject) => {
        fileUploadStream.on('finish', () => {
          // Get the public URL of the uploaded file
          const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/profilePics%2F${encodeURIComponent(fileName)}?alt=media`;

          // Log successful upload
          logger.info(`Successfully uploaded profile picture for userId: ${userId}, URL: ${publicUrl}`);
          resolve(publicUrl);
        });
        fileUploadStream.on('error', (error) => {
          console.error('Error uploading file to Firestore Storage:', error);
          reject(null);
        });
      });
    }
    return null;
  } catch (error) {
    console.error("Error downloading or uploading file:", error);
    return null;
  }
};

// Set a user's chatId
const setUserChatId = async (
  telegramId: string,
  chatId: string,
  breadcrumb?: string
): Promise<void> => {
  const newBreadcrumb = `setUserChatId(${telegramId}):${breadcrumb}`;
  logger.info(JSON.stringify({ breadcrumb: newBreadcrumb }));

  // const usersRef = db.collection('users');
  // const q = usersRef.where("telegramId", "==", telegramId);
  // const usersSnapshot = await q.get();

//   if (usersSnapshot.empty) {
//     logger.warn(`User with telegramId ${telegramId} not found`);
//     return;
//   }

//   const userDocRef = usersSnapshot.docs[0].ref;
//   await userDocRef.update({ chatId });
//   logger.info(JSON.stringify({ breadcrumb: newBreadcrumb, chatId }));
};

// Get all users
const getAllUsers = async (breadcrumb?: string): Promise<ReadonlyArray<User>> => {
  const newBreadcrumb = `getAllUsers():${breadcrumb}`;
  // const usersRef = db.collection('users');
  // const snapshot = await usersRef.get();

  // logger.info(JSON.stringify({ breadcrumb: newBreadcrumb, snapshotSize: snapshot.size }));

  // return snapshot.docs.map((el: { data: () => any; }) => {
  //   const firestoreUser = el.data() as FireStoreUser;
    
  //   // Convert Firestore Timestamps to Date objects
  //   const lastLoggedIn = convertTimestampToDate(firestoreUser.lastLoggedIn);
  //   const dateCreated = convertTimestampToDate(firestoreUser.dateCreated);

  //   return new User({
  //     ...firestoreUser,
  //     // id: el.id,
  //     dateCreated,
  //     lastLoggedIn,
  //   });
  // });
  return [];
};

// Get users with pagination support
const getUsers = async (
  args: {
    limit?: number;
    offsetDocId?: string;
    offsetValues?: Array<string | number>;
    orderProperties?: Array<string>;
    orderDirection?: "asc" | "desc";
    paginationFunc?: "startAt" | "startAfter";
  },
  breadcrumb?: string
): Promise<ReadonlyArray<User>> => {
  const newBreadcrumb = `getUsers(${JSON.stringify(args)}):${breadcrumb}`;
  const {
    limit: limitNum = 30,
    offsetDocId,
    offsetValues = [],
    orderProperties = [],
    orderDirection = "desc",
    paginationFunc = "startAfter",
  } = args;

  // const usersRef = db.collection('users');
  let startsAfterArgs: unknown[] = offsetValues;
  if (offsetDocId) {
    startsAfterArgs.push(offsetDocId);
  }

  // if (offsetDocId || offsetValues.length > 0) {
  //   queryConstraints.push(paginationFunc === "startAfter" ? startAfter(...startsAfterArgs) : startAt(...startsAfterArgs));
  // }

  // const q = usersRef.orderBy("someField").limit(limitNum); // Adjust this as necessary
  // const snapshot = await usersRef.get();

  // logger.info(JSON.stringify({ breadcrumb: newBreadcrumb, snapshotSize: snapshot.size }));

  // return snapshot.docs.map((el: { data: () => any; }) => {
  //   const firestoreUser = el.data() as FireStoreUser;
    
  //   // Convert Firestore Timestamps to Date objects
  //   const lastLoggedIn = convertTimestampToDate(firestoreUser.lastLoggedIn);
  //   const dateCreated = convertTimestampToDate(firestoreUser.dateCreated);

  //   return new User({
  //     ...firestoreUser,
  //     // id: el.id,
  //     dateCreated,
  //     lastLoggedIn,
  //   });
  // });
  return [];
};





// Exporting functions
export default {
  setUserChatId,
  getUserByWalletId,
  getAllUsers,
  getUsers,
  createUser,
  updateUser,

};
