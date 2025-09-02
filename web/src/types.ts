export type Category = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type TimeLog = {
  id: string;
  user_id: string;
  category_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
};
