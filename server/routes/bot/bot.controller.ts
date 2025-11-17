import { Request, Response } from "express";
import botService from "./bot.service";

// const getBot = async (req: Request, res: Response): Promise<Response> => {
//   try {
//     // Ensure botName is provided in the request query
//     const { botName } = req.query;

//     if (!botName) {
//       return res.status(400).json({ error: "botName is required" });
//     }

//     // Fetch bot by botName using the botService's get method
//     const bot = await botService.get(botName as string); // Ensure botName is treated as a string

//     if (!bot) {
//       return res.status(404).json({ error: "Bot not found" });
//     }

//     return res.json(bot);
//   } catch (error) {
//     console.error("Error fetching bot:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

const getMyBots = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Ensure botName is provided in the request query
    const { walletId } = req.query;

    if (!walletId) {
      return res.status(400).json({ error: "botName is required" });
    }

    // Fetch bot by botName using the botService's get method
    const bot = await botService.getMyBots(walletId as string); // Ensure botName is treated as a string

    if (!bot) {
      return res.status(404).json({ error: "Bot not found" });
    }

    return res.json(bot);
  } catch (error) {
    console.error("Error fetching bot:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const createBot = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Ensure walletId and botConfig are provided in the request body
    const botConfig = req.body;

    if (!botConfig.creatorWalletId) {
      return res.status(400).json({ error: "creatorWalletId is required" });
    }

    if (!botConfig.creatorName) {
      return res.status(400).json({ error: "creatorName is required" });
    }

    // Create a new bot with the provided walletId and botConfig
    const newBot = await botService.create(botConfig);

    if (newBot){
      return res.status(201).json(newBot);
    } else {
      return res.status(409).json(botConfig);
    }

  } catch (error) {
    console.error("Error creating bot:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const killBot = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Ensure botName is provided in the request query
    const { botName } = req.query;

    if (!botName) {
      return res.status(400).json({ error: "botName is required" });
    }

    // Kill the bot by setting its alive flag to false
    const result = await botService.kill(botName as string);

    if (!result) {
      return res.status(404).json({ error: "Bot not found or already killed" });
    }

    return res.status(200).json({ message: `Bot ${botName} successfully killed.` });
  } catch (error) {
    console.error("Error killing bot:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const startBot = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Ensure botName is provided in the request query
    const { botName } = req.query;

    if (!botName) {
      return res.status(400).json({ error: "botName is required" });
    }

    // Start the bot by setting its status to running
    const result = await botService.start(botName as string);

    if (!result) {
      return res.status(404).json({ error: "Bot not found or already running" });
    }

    return res.status(200).json({ message: `Bot ${botName} successfully started.` });
  } catch (error) {
    console.error("Error starting bot:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const stopBot = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Ensure botName is provided in the request query
    const { botName } = req.query;

    if (!botName) {
      return res.status(400).json({ error: "botName is required" });
    }

    // Stop the bot by setting its status to stopped
    const result = await botService.stop(botName as string);

    if (!result) {
      return res.status(404).json({ error: "Bot not found or already stopped" });
    }

    return res.status(200).json({ message: `Bot ${botName} successfully stopped.` });
  } catch (error) {
    console.error("Error stopping bot:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default {
  // getBot,
  createBot,
  getMyBots,
  killBot,
  startBot,
  stopBot
};