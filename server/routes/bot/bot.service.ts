import { Timestamp } from "firebase-admin/firestore";
import logger from "../../utils/logger";
import { db } from "../firebase/firebase.config";
import { BotConfig } from "../../../types/Bot";

/**
 * Get all bots' details created by a specific wallet ID
 * Only returns bots where the `alive` flag is `true`
 * @param {string} walletId - The wallet ID to retrieve bots for
 * @returns {Promise<any[] | null>} An array of bot details or null if no bots are found
 */
const getMyBots = async (walletId: string): Promise<any[] | null> => {
  const breadcrumb = `getMyBots(${walletId})`;

  if (!walletId) {
    throw new Error(`Invalid walletId provided. ${breadcrumb}`);
  }

  const botsRef = db.collection("bots");
  const q = botsRef.where("creatorWalletId", "==", walletId).where("alive", "==", true);
  const querySnapshot = await q.get();

  if (querySnapshot.empty) {
    logger.info(`No alive bots found for walletId: ${walletId}.`);
    return null;
  }

  const bots = querySnapshot.docs.map((doc) => doc.data());

  logger.info(`Fetched ${bots.length} alive bot(s) for walletId: ${walletId}`);

  // Return the array of bot details
  return bots;
};

/**
 * Get a bot's details by its botName
 * @param {string} botName - The name of the bot to retrieve details for
 * @returns {Promise<any | null>} The bot data or null if not found
 */
const get = async (botName: string): Promise<any | null> => {
  const breadcrumb = `getBot(${botName})`;

  if (!botName) {
    throw new Error(`Invalid botName provided. ${breadcrumb}`);
  }

  const botsRef = db.collection("bots");
  const q = botsRef.where("botName", "==", botName).limit(1);
  const querySnapshot = await q.get();

  if (querySnapshot.empty) {
    logger.info(`No bot found with botName: ${botName}.`);
    return null;
  }

  const botDoc = querySnapshot.docs[0];
  const botData = botDoc.data();

  logger.info(`Fetched bot data: ${JSON.stringify(botData)} for botName: ${botName}`);

  // Return the bot's data
  return botData;
};

/**
 * Create a new bot entry
 * Sets the `alive` flag to `true` by default
 * @param {BotConfig} botConfig - Configuration object for the bot
 * @returns {Promise<string>} A success message after creating the bot
 */
const create = async (botConfig: BotConfig): Promise<BotConfig | null> => {
  const breadcrumb = `createBot(${botConfig.botName})`;
  const timeNow = Timestamp.now();

  const botsRef = db.collection("bots");

  logger.info(JSON.stringify({ breadcrumb, botConfig: botConfig.botName }));

  // Check if a bot with the same botName already exists
  const q = botsRef.where("botName", "==", botConfig.botName);
  const querySnapshot = await q.get();

  if (!querySnapshot.empty) {
    // Bot exists, return existing bot data
    logger.info(`Bot with botName ${botConfig.botName} already exists.`);
    return null;
  }

  // Set the current timestamp and alive flag for bot creation
  const botPayload = {
    ...botConfig,
    createdAt: timeNow,
    alive: true,
  };

  // Add a new bot document with the provided data
  const newBotRef = await botsRef.add(botPayload);

  logger.info(`Created new bot with auto-generated ID: ${newBotRef.id}.`);

  // Return a success message
  return botConfig;
};

/**
 * Kill a bot by setting its `alive` flag to `false`
 * @param {string} botName - The name of the bot to be killed
 * @returns {Promise<string>} A success message after killing the bot
 */
const kill = async (botName: string): Promise<string> => {
  const breadcrumb = `killBot(${botName})`;

  if (!botName) {
    throw new Error(`Invalid botName provided. ${breadcrumb}`);
  }

  const botsRef = db.collection("bots");
  const q = botsRef.where("botName", "==", botName).limit(1);
  const querySnapshot = await q.get();

  if (querySnapshot.empty) {
    logger.info(`No bot found with botName: ${botName}.`);
    return `Bot with botName ${botName} does not exist.`;
  }

  const botDoc = querySnapshot.docs[0];

  // Update the `alive` flag to false
  await botDoc.ref.update({ alive: false });

  logger.info(`Bot with botName ${botName} has been killed.`);

  // Return a success message
  return `Bot with botName ${botName} successfully killed.`;
};

/**
 * Start a bot by setting its `status` field to "Running"
 * @param {string} botName - The name of the bot to start
 * @returns {Promise<string>} A success message after starting the bot
 */
const start = async (botName: string): Promise<string> => {
  const breadcrumb = `startBot(${botName})`;

  if (!botName) {
    throw new Error(`Invalid botName provided. ${breadcrumb}`);
  }

  const botsRef = db.collection("bots");
  const q = botsRef.where("botName", "==", botName).limit(1);
  const querySnapshot = await q.get();

  if (querySnapshot.empty) {
    logger.info(`No bot found with botName: ${botName}.`);
    return `Bot with botName ${botName} does not exist.`;
  }

  const botDoc = querySnapshot.docs[0];

  // Update the `status` field to "Running"
  await botDoc.ref.update({ status: "Running" });

  logger.info(`Bot with botName ${botName} has been started.`);

  // Return a success message
  return `Bot with botName ${botName} successfully started.`;
};

/**
 * Stop a bot by setting its `status` field to "Stopped"
 * @param {string} botName - The name of the bot to stop
 * @returns {Promise<string>} A success message after stopping the bot
 */
const stop = async (botName: string): Promise<string> => {
  const breadcrumb = `stopBot(${botName})`;

  if (!botName) {
    throw new Error(`Invalid botName provided. ${breadcrumb}`);
  }

  const botsRef = db.collection("bots");
  const q = botsRef.where("botName", "==", botName).limit(1);
  const querySnapshot = await q.get();

  if (querySnapshot.empty) {
    logger.info(`No bot found with botName: ${botName}.`);
    return `Bot with botName ${botName} does not exist.`;
  }

  const botDoc = querySnapshot.docs[0];

  // Update the `status` field to "Stopped"
  await botDoc.ref.update({ status: "Stopped" });

  logger.info(`Bot with botName ${botName} has been stopped.`);

  // Return a success message
  return `Bot with botName ${botName} successfully stopped.`;
};

export default {
  getMyBots,
  get,
  create,
  kill,
  start,
  stop
};
