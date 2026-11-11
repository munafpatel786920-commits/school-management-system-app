import type { Student, User, Teacher, SchoolClass } from './types';
import { PlaceHolderImages } from './placeholder-images';

const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar')?.imageUrl || '';

export const currentUser: User = {
  id: 'user-001',
  name: 'Admin User',
  email: 'admin@vidyaverse.edu',
  role: 'Admin',
  avatarUrl: userAvatar,
};

export const mockStudents: Student[] = [];

export const mockTeachers: Teacher[] = [];

export const mockClasses: SchoolClass[] = [];
