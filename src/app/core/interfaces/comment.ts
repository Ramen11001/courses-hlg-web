import { User } from './user';
/**
 * Interface representing a user comment on a course.
 *
 * @interface
 * @export
 * @class Comment
 */
export interface Comment {
  /**
   * Unique identifier for the comment.
   * @type {number}
   */
  id?: number;
  /**
   * Rating given by the user (usually between 1-5 stars).
   * @type {number}
   */
  rating: number;

  /**
   * Text content of the comment.
   * @type {string}
   */
  text: string;

  /**
   * Unique identifier of the user who posted the comment.
   * @type {number}
   */
  user_id: number;
  /**
   * Unique identifier of the course to which the comment belongs.
   * @type {number}
   */
  course_id: number;

  /**
   * Date the comment was created
   * @type {string}
   */
  createdAt?: string;

  /**
   * user associated with the comment.
   * @type {User}
   */
  User: Partial<User>;
}
