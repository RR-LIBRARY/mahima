import { pgTable, text, serial, integer, boolean, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appRoleEnum = pgEnum("app_role", ["admin", "teacher", "student"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  mobile: text("mobile"),
  role: appRoleEnum("role").default("student").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  fullName: text("full_name"),
  email: text("email"),
  mobile: text("mobile"),
  role: text("role").default("student"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  grade: text("grade"),
  imageUrl: text("image_url"),
  thumbnailUrl: text("thumbnail_url"),
  price: integer("price"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  isLocked: boolean("is_locked").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  status: text("status").default("pending"),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rollNumber: text("roll_number").notNull(),
  grade: integer("grade").notNull(),
  section: text("section").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  date: text("date").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  parentName: text("parent_name").notNull(),
  email: text("email").notNull(),
  grade: text("grade").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessons.id),
  title: text("title").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessons.id),
  userName: text("user_name").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  recipientId: integer("recipient_id").references(() => users.id).notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timetable = pgTable("timetable", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  room: text("room"),
  teacherId: integer("teacher_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id),
  isPinned: boolean("is_pinned").default(false),
  targetRole: appRoleEnum("target_role"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size"),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const syllabus = pgTable("syllabus", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  weekNumber: integer("week_number"),
  topics: text("topics").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentRequests = pgTable("payment_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  amount: integer("amount"),
  status: text("status").default("pending"),
  transactionId: text("transaction_id"),
  senderName: text("sender_name"),
  userName: text("user_name"),
  screenshotUrl: text("screenshot_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const siteStats = pgTable("site_stats", {
  id: serial("id").primaryKey(),
  statKey: text("stat_key").notNull(),
  statValue: text("stat_value").notNull(),
});

export const landingContent = pgTable("landing_content", {
  sectionKey: text("section_key").primaryKey(),
  content: text("content"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  purchasedAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertNoticeSchema = createInsertSchema(notices).omit({
  id: true,
  createdAt: true,
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
});

export const insertSyllabusSchema = createInsertSchema(syllabus).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentRequestSchema = createInsertSchema(paymentRequests).omit({
  id: true,
  createdAt: true,
});

export type AppRole = "admin" | "teacher" | "student";
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;
export type Student = typeof students.$inferSelect;
export type InsertAttendance = typeof attendance.$inferInsert;
export type Attendance = typeof attendance.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertNotice = typeof notices.$inferInsert;
export type Notice = typeof notices.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;
export type Material = typeof materials.$inferSelect;
export type InsertSyllabus = typeof syllabus.$inferInsert;
export type Syllabus = typeof syllabus.$inferSelect;
export type InsertPaymentRequest = typeof paymentRequests.$inferInsert;
export type PaymentRequest = typeof paymentRequests.$inferSelect;
