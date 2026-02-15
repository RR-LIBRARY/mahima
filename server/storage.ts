import { db } from "./db";
import { eq, and, desc, or } from "drizzle-orm";
import * as schema from "../shared/schema";
import type {
  User, InsertUser, Course, InsertCourse, Lesson, InsertLesson,
  Enrollment, InsertEnrollment, Student, InsertStudent, Attendance, InsertAttendance,
  Lead, InsertLead, Comment, InsertComment, Message, InsertMessage,
  Notice, InsertNotice, Material, InsertMaterial, Syllabus, InsertSyllabus,
  PaymentRequest, InsertPaymentRequest
} from "../shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, updates: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<void>;
  
  getLessons(courseId: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, updates: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<void>;
  
  getEnrollments(userId: number): Promise<Enrollment[]>;
  getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, updates: Partial<InsertEnrollment>): Promise<Enrollment | undefined>;
  
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<void>;
  
  getAttendance(studentId?: number, date?: string): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, updates: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  
  getLeads(): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  
  getComments(lessonId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  getMessages(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageRead(id: number): Promise<void>;
  
  getNotices(role?: string): Promise<Notice[]>;
  createNotice(notice: InsertNotice): Promise<Notice>;
  updateNotice(id: number, updates: Partial<InsertNotice>): Promise<Notice | undefined>;
  deleteNotice(id: number): Promise<void>;
  
  getMaterials(courseId?: number): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  deleteMaterial(id: number): Promise<void>;
  
  getSyllabus(courseId: number): Promise<Syllabus[]>;
  createSyllabus(syllabus: InsertSyllabus): Promise<Syllabus>;
  updateSyllabus(id: number, updates: Partial<InsertSyllabus>): Promise<Syllabus | undefined>;
  deleteSyllabus(id: number): Promise<void>;
  
  getPaymentRequests(userId?: number): Promise<PaymentRequest[]>;
  createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest>;
  updatePaymentRequest(id: number, updates: Partial<InsertPaymentRequest>): Promise<PaymentRequest | undefined>;
  
  getTimetable(): Promise<any[]>;
  createTimetableEntry(entry: any): Promise<any>;
  updateTimetableEntry(id: number, updates: any): Promise<any>;
  deleteTimetableEntry(id: number): Promise<void>;

  getAllUsers(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(schema.users).values(user).returning();
    return created;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(schema.users).set(updates).where(eq(schema.users.id, id)).returning();
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(schema.courses).orderBy(desc(schema.courses.createdAt));
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(schema.courses).where(eq(schema.courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [created] = await db.insert(schema.courses).values(course).returning();
    return created;
  }

  async updateCourse(id: number, updates: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updated] = await db.update(schema.courses).set(updates).where(eq(schema.courses.id, id)).returning();
    return updated;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.delete(schema.courses).where(eq(schema.courses.id, id));
  }

  async getLessons(courseId: number): Promise<Lesson[]> {
    return await db.select().from(schema.lessons).where(eq(schema.lessons.courseId, courseId));
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(schema.lessons).where(eq(schema.lessons.id, id));
    return lesson;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [created] = await db.insert(schema.lessons).values(lesson).returning();
    return created;
  }

  async updateLesson(id: number, updates: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const [updated] = await db.update(schema.lessons).set(updates).where(eq(schema.lessons.id, id)).returning();
    return updated;
  }

  async deleteLesson(id: number): Promise<void> {
    await db.delete(schema.lessons).where(eq(schema.lessons.id, id));
  }

  async getEnrollments(userId: number): Promise<Enrollment[]> {
    return await db.select().from(schema.enrollments).where(eq(schema.enrollments.userId, userId));
  }

  async getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(schema.enrollments)
      .where(and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)));
    return enrollment;
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [created] = await db.insert(schema.enrollments).values(enrollment).returning();
    return created;
  }

  async updateEnrollment(id: number, updates: Partial<InsertEnrollment>): Promise<Enrollment | undefined> {
    const [updated] = await db.update(schema.enrollments).set(updates).where(eq(schema.enrollments.id, id)).returning();
    return updated;
  }

  async getStudents(): Promise<Student[]> {
    return await db.select().from(schema.students).orderBy(schema.students.name);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, id));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [created] = await db.insert(schema.students).values(student).returning();
    return created;
  }

  async updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student | undefined> {
    const [updated] = await db.update(schema.students).set(updates).where(eq(schema.students.id, id)).returning();
    return updated;
  }

  async deleteStudent(id: number): Promise<void> {
    await db.delete(schema.students).where(eq(schema.students.id, id));
  }

  async getAttendance(studentId?: number, date?: string): Promise<Attendance[]> {
    if (studentId && date) {
      return await db.select().from(schema.attendance)
        .where(and(eq(schema.attendance.studentId, studentId), eq(schema.attendance.date, date)));
    } else if (studentId) {
      return await db.select().from(schema.attendance).where(eq(schema.attendance.studentId, studentId));
    } else if (date) {
      return await db.select().from(schema.attendance).where(eq(schema.attendance.date, date));
    }
    return await db.select().from(schema.attendance);
  }

  async createAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const [created] = await db.insert(schema.attendance).values(attendance).returning();
    return created;
  }

  async updateAttendance(id: number, updates: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const [updated] = await db.update(schema.attendance).set(updates).where(eq(schema.attendance.id, id)).returning();
    return updated;
  }

  async getLeads(): Promise<Lead[]> {
    return await db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt));
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [created] = await db.insert(schema.leads).values(lead).returning();
    return created;
  }

  async getComments(lessonId: number): Promise<Comment[]> {
    return await db.select().from(schema.comments)
      .where(eq(schema.comments.lessonId, lessonId))
      .orderBy(desc(schema.comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [created] = await db.insert(schema.comments).values(comment).returning();
    return created;
  }

  async getMessages(userId: number): Promise<Message[]> {
    return await db.select().from(schema.messages)
      .where(or(eq(schema.messages.senderId, userId), eq(schema.messages.recipientId, userId)))
      .orderBy(desc(schema.messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(schema.messages).values(message).returning();
    return created;
  }

  async markMessageRead(id: number): Promise<void> {
    await db.update(schema.messages).set({ isRead: true }).where(eq(schema.messages.id, id));
  }

  async getNotices(role?: string): Promise<Notice[]> {
    if (role) {
      return await db.select().from(schema.notices)
        .where(or(eq(schema.notices.targetRole, role as any), eq(schema.notices.targetRole, null as any)))
        .orderBy(desc(schema.notices.createdAt));
    }
    return await db.select().from(schema.notices).orderBy(desc(schema.notices.createdAt));
  }

  async createNotice(notice: InsertNotice): Promise<Notice> {
    const [created] = await db.insert(schema.notices).values(notice).returning();
    return created;
  }

  async updateNotice(id: number, updates: Partial<InsertNotice>): Promise<Notice | undefined> {
    const [updated] = await db.update(schema.notices).set(updates).where(eq(schema.notices.id, id)).returning();
    return updated;
  }

  async deleteNotice(id: number): Promise<void> {
    await db.delete(schema.notices).where(eq(schema.notices.id, id));
  }

  async getMaterials(courseId?: number): Promise<Material[]> {
    if (courseId) {
      return await db.select().from(schema.materials).where(eq(schema.materials.courseId, courseId));
    }
    return await db.select().from(schema.materials);
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const [created] = await db.insert(schema.materials).values(material).returning();
    return created;
  }

  async deleteMaterial(id: number): Promise<void> {
    await db.delete(schema.materials).where(eq(schema.materials.id, id));
  }

  async getSyllabus(courseId: number): Promise<Syllabus[]> {
    return await db.select().from(schema.syllabus)
      .where(eq(schema.syllabus.courseId, courseId))
      .orderBy(schema.syllabus.weekNumber);
  }

  async createSyllabus(syllabus: InsertSyllabus): Promise<Syllabus> {
    const [created] = await db.insert(schema.syllabus).values(syllabus).returning();
    return created;
  }

  async updateSyllabus(id: number, updates: Partial<InsertSyllabus>): Promise<Syllabus | undefined> {
    const [updated] = await db.update(schema.syllabus).set(updates).where(eq(schema.syllabus.id, id)).returning();
    return updated;
  }

  async deleteSyllabus(id: number): Promise<void> {
    await db.delete(schema.syllabus).where(eq(schema.syllabus.id, id));
  }

  async getPaymentRequests(userId?: number): Promise<PaymentRequest[]> {
    if (userId) {
      return await db.select().from(schema.paymentRequests)
        .where(eq(schema.paymentRequests.userId, userId))
        .orderBy(desc(schema.paymentRequests.createdAt));
    }
    return await db.select().from(schema.paymentRequests).orderBy(desc(schema.paymentRequests.createdAt));
  }

  async createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest> {
    const [created] = await db.insert(schema.paymentRequests).values(request).returning();
    return created;
  }

  async updatePaymentRequest(id: number, updates: Partial<InsertPaymentRequest>): Promise<PaymentRequest | undefined> {
    const [updated] = await db.update(schema.paymentRequests).set(updates).where(eq(schema.paymentRequests.id, id)).returning();
    return updated;
  }

  async getTimetable(): Promise<any[]> {
    return await db.select().from(schema.timetable);
  }

  async createTimetableEntry(entry: any): Promise<any> {
    const [created] = await db.insert(schema.timetable).values(entry).returning();
    return created;
  }

  async updateTimetableEntry(id: number, updates: any): Promise<any> {
    const [updated] = await db.update(schema.timetable).set(updates).where(eq(schema.timetable.id, id)).returning();
    return updated;
  }

  async deleteTimetableEntry(id: number): Promise<void> {
    await db.delete(schema.timetable).where(eq(schema.timetable.id, id));
  }
}

export const storage = new DatabaseStorage();
