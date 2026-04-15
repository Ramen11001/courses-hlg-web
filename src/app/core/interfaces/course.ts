import { Comment } from 'src/app/core/interfaces/comment';
export interface Course {
  id: number;
  title: string;
  description: string;
  study_plan: Text;
  location: string;
  cost: number;
  tags: JSON;
  duration: JSON;
  certificate: boolean;
  //TODO: RECUERDA REVISAR EL ÁREA, MODELO, LEVEL: QUE SON ENUM

  comments?: Comment[];

  //Foreign Key
  user_id: number;
}
