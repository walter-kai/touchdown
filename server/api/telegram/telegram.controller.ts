import { Request, Response } from 'express';
import admin from 'firebase-admin';
import { sendTelegramMessage, createTelegramTopic } from './telegram.service';

export const sendMessageController = async (req: Request, res: Response) => {
  try {
    const { name, email, business, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and message are required'
      });
    }

    // Format message for Telegram
    const telegramMessage = `
🆕 New Contact Form Submission

👤 Name: ${name}
📧 Email: ${email}
🏢 Business: ${business || 'Not specified'}

💬 Message:
${message}

📅 Submitted: ${new Date().toLocaleString()}
    `.trim();

    // Send to Telegram (you'll need to configure these environment variables)
    const accessToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.MY_TELEGRAM_CHAT_ID;

    if (!accessToken || !chatId) {
      return res.status(500).json({
        success: false,
        error: 'Telegram configuration missing'
      });
    }

    const result = await sendTelegramMessage(
      accessToken,
      chatId,
      telegramMessage
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Message sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send message'
      });
    }

  } catch (error) {
    console.error('Error in sendMessage endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getChatIdController = async (req: Request, res: Response) => {
  try {
    const { gameId, league = 'nba' } = req.body;

    // Validate required fields
    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'gameId is required'
      });
    }

    // Construct the document ID (use : instead of / for document ID)
    const docId = `epsn:${league}:${gameId}`;
    const docRef = admin.firestore().collection('gameData').doc(docId);

    // Check if the document exists
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      // Document exists, return the chatId
      const data = docSnap.data();
      res.json({
        success: true,
        chatId: data?.chatId
      });
    } else {
      // Document doesn't exist
      res.json({
        success: false,
        notFound: true
      });
    }

  } catch (error) {
    console.error('Error in getChatId endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const createTopicController = async (req: Request, res: Response) => {
  try {
    const { gameId, league = 'nba', topicName } = req.body;

    // Validate required fields
    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'gameId is required'
      });
    }

    if (!topicName) {
      return res.status(400).json({
        success: false,
        error: 'topicName is required'
      });
    }

    // Get Telegram bot configuration
    const accessToken = process.env.TELEGRAM_BOT_TOKEN;
    let superGroupId = process.env.TELEGRAM_SUPERGROUP_ID;

    if (!accessToken || !superGroupId) {
      return res.status(500).json({
        success: false,
        error: 'Telegram configuration missing'
      });
    }

    // Ensure superGroupId has @ prefix for API calls
    const superGroupIdForApi = superGroupId.startsWith('@') ? superGroupId : `@${superGroupId}`;

    const topicResult = await createTelegramTopic(
      accessToken,
      superGroupIdForApi,
      topicName
    );

    if (!topicResult.success || !topicResult.topicId) {
      return res.status(500).json({
        success: false,
        error: topicResult.error || 'Failed to create Telegram topic'
      });
    }

    // Store the chatId in Firebase
    const docId = `epsn:${league}:${gameId}`;
    const docRef = admin.firestore().collection('gameData').doc(docId);

    const chatId = `${superGroupId}/${topicResult.topicId}`;

    await docRef.set({
      chatId,
      createdAt: admin.firestore.Timestamp.now()
    });

    res.json({
      success: true,
      chatId,
      topicId: topicResult.topicId
    });

  } catch (error) {
    console.error('Error in createTopic endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
