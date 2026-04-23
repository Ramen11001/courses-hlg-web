import { Comment } from './comment';
import { Course } from './course';
export interface User {
  createdAt: string | number | Date;
  id: number;
  firstName: string;
  lastName: string;
  birthday: Date;
  email: string;
  phone: string;
  password: string;
  role: string;
  biography: Text;

  //Models
  comments?: Comment[];
  courses?: Course[];
}
