import { Request, Response } from "express";
import axios from "axios";
import { db } from "../firebase/firebase.config";

interface SentimentDataPoint {
  t: number;
  v: number[];
}

interface SentimentHistogram {
  header: {
    v: string[];
  };
  data: SentimentDataPoint[];
}

interface SentimentTopic {
  id: string;
  topic_id: string;
  topic_name: string;
  last_updated: number;
  histogram: SentimentHistogram;
  request_id: string;
}

interface SentimentApiResponse {
  success: boolean;
  data: SentimentTopic[];
  total: number;
}

export async function getSentiments(req: Request, res: Response) {
  try {
    const snapshot = await db.collection('sentiment').get();
    const sentiments: any[] = [];
    snapshot.forEach((doc: any) => {
      sentiments.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json({
      success: true,
      data: sentiments,
      total: sentiments.length
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      error: `Failed to fetch sentiments: ${errorMessage}`,
      data: []
    });
  }
}
