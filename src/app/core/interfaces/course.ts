import { Comment } from './comment';
import { Duration } from './duration';
import { Tag } from './tag';

export type CourseArea =
  | 'Técnica'
  | 'Humanidades'
  | 'Salud'
  | 'Administración'
  | 'Deporte'
  | 'Belleza'
  | 'Artes'
  | 'Ciencias';
export type CourseMode = 'Presencial' | 'Online' | 'Híbrida';
export type CourseLevel = 'bajo' | 'medio' | 'alto';
export interface Course {
  id: number;
  title: string;
  description: string;
  study_plan: string;
  location: string;
  cost: number;
  certificate: boolean;
  tags?: Tag[];
  duration?: Duration[];
  comments?: Comment[];

  //Enums:
  area: CourseArea;
  mode: CourseMode;
  level: CourseLevel;

  //Foreign Key
  user_id: number;
  comment_id: number;
}
