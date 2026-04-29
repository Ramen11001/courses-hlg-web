import { User } from "./user";

/**
 * Interface representing a user comment on a course.
 *
 * @interface
 * @export
 * @class Comment
 */
export interface Comment {
  id?: number;
  rating: number;
  text: string;
  createdAt?: string;

  //Foreign Key
  user_id: number;
  course_id: number;

  //Models
  user?: Partial<User>;
}
