export interface Notification {
  id: number;
  title: string;
  message: string;
  viewed: boolean;
  user_id: number;
  createdAt: Date;
  updatedAt: Date;
}
