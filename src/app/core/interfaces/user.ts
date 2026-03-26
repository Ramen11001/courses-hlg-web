export interface User {
  id: number;
  fristName: string;
  lastName: string;
  birthday: Date;
  email: string;
  phone: string;
  password: string;
  role: string;
  biography: Text;

  //TODO: entity_type es un enum

}