import { Request, Response } from 'express';
import { sendTelegramMessage } from './telegram.service';

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
