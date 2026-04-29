export interface Enrollment {
  id: number;
  course_id: number;
  user_id: number;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  enrollment_date: Date;
  completion_date?: Date;
  progress: number;
  rating?: number;
  review?: string;
}

export interface EnrollmentWithCourse extends Enrollment {
  course: {
    id: number;
    title: string;
    description: string;
    cost: number;
    area: string;
    level: string;
    image?: string;
  };
}