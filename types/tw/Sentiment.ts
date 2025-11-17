export interface SentimentDataPoint {
  t: number; // timestamp
  v: number[]; // values array [positive, neutral, negative]
}

export interface SentimentHistogram {
  header: {
    v: string[]; // sentiment labels
  };
  data: SentimentDataPoint[];
}

export interface SentimentTopic {
  id: string;
  topic_id: string;
  topic_name: string;
  last_updated: number;
  histogram: SentimentHistogram;
  request_id: string;
}


