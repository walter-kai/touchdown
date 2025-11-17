import { Request, Response } from "express";
import { getLinkPreview } from "link-preview-js";

export const linkPreviewController = async (req: Request, res: Response) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: "URL parameter is required"
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: "Invalid URL format"
      });
    }

    const preview = await getLinkPreview(url, {
      timeout: 10000,
      followRedirects: 'follow',
      handleRedirects: (baseURL: string, forwardedURL: string) => {
        const urlObj = new URL(baseURL);
        const forwardedURLObj = new URL(forwardedURL);
        return forwardedURLObj.hostname === urlObj.hostname ||
               forwardedURLObj.hostname === 'www.' + urlObj.hostname ||
               urlObj.hostname === 'www.' + forwardedURLObj.hostname;
      }
    });

    res.json({
      success: true,
      data: preview
    });

  } catch (error: any) {
    console.error('Link preview error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch link preview"
    });
  }
};
