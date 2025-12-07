import fetch from 'node-fetch';
import { Telegraf } from 'telegraf';


export const sendTelegramMessage = async (
  accessToken: string,
  chatId: string | number,
  message: string,
  imageUrl?: string,
  link?: string
): Promise<{ success: boolean; error?: string; messageId?: number }> => {
  try {
    // Create bot instance with the access token
    const bot = new Telegraf(accessToken);
    
    // Prepare inline keyboard options if link is provided
    const extra: any = {};
    if (link && link) {
      extra.reply_markup = {
        inline_keyboard: [[{
          text: link,
          url: link
        }]]
      };
    }

    let result: any;

    if (imageUrl) {
      // Send photo with caption and optional inline keyboard
      extra.caption = message;
      result = await bot.telegram.sendPhoto(chatId, imageUrl, extra);
    } else {
      // Send text message with optional inline keyboard
      result = await bot.telegram.sendMessage(chatId, message, extra);
    }

    return {
      success: true,
      messageId: result.message_id
    };

  } catch (error: any) {
    console.error('Error sending Telegram message:', error);
    
    // Handle Telegram API specific errors
    let errorMessage = 'Unknown error occurred';
    if (error.response?.data) {
      errorMessage = error.response.data.description || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

export const getTelegramGroupInfo = async (
  accessToken: string,
  chatId: string | number
): Promise<{ id: number; title: string; username?: string; type: string } | null> => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${accessToken}/getChat?chat_id=${chatId}`);
    const data = await response.json();
    if (data.ok && data.result) {
      return data.result;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Telegram group info:', error);
    return null;
  }
};
