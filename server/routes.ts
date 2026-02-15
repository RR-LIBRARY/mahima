import type { Express } from "express";
import { storage } from "./storage";
import { requireAuth, requireRole } from "./auth";
import { 
  insertCourseSchema, insertLessonSchema, insertEnrollmentSchema,
  insertStudentSchema, insertAttendanceSchema, insertLeadSchema,
  insertCommentSchema, insertMessageSchema, insertNoticeSchema,
  insertMaterialSchema, insertSyllabusSchema, insertPaymentRequestSchema
} from "../shared/schema";

export function registerRoutes(app: Express) {
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourse(parseInt(req.params.id));
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", requireRole("admin", "teacher"), async (req, res) => {
    try {
      const data = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(data);
      res.json(course);
    } catch (error) {
      res.status(400).json({ error: "Invalid course data" });
    }
  });

  app.patch("/api/courses/:id", requireRole("admin", "teacher"), async (req, res) => {
    try {
      const course = await storage.updateCourse(parseInt(req.params.id), req.body);
      res.json(course);
    } catch (error) {
      res.status(400).json({ error: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteCourse(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  app.get("/api/courses/:courseId/lessons", async (req, res) => {
    try {
      const lessons = await storage.getLessons(parseInt(req.params.courseId));
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const lesson = await storage.getLesson(parseInt(req.params.id));
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  app.post("/api/lessons", requireRole("admin", "teacher"), async (req, res) => {
    try {
      const data = insertLessonSchema.parse(req.body);
      const lesson = await storage.createLesson(data);
      res.json(lesson);
    } catch (error) {
      res.status(400).json({ error: "Invalid lesson data" });
    }
  });

  app.patch("/api/lessons/:id", requireRole("admin", "teacher"), async (req, res) => {
    try {
      const lesson = await storage.updateLesson(parseInt(req.params.id), req.body);
      res.json(lesson);
    } catch (error) {
      res.status(400).json({ error: "Failed to update lesson" });
    }
  });

  app.delete("/api/lessons/:id", requireRole("admin", "teacher"), async (req, res) => {
    try {
      await storage.deleteLesson(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });

  app.get("/api/enrollments", requireAuth, async (req: any, res) => {
    try {
      const enrollments = await storage.getEnrollments(req.user.id);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.get("/api/enrollments/:courseId", requireAuth, async (req: any, res) => {
    try {
      const enrollment = await storage.getEnrollment(req.user.id, parseInt(req.params.courseId));
      res.json(enrollment || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollment" });
    }
  });

  app.post("/api/enrollments", requireAuth, async (req: any, res) => {
    try {
      const data = insertEnrollmentSchema.parse({ ...req.body, userId: req.user.id });
      const enrollment = await storage.createEnrollment(data);
      res.json(enrollment);
    } catch (error) {
      res.status(400).json({ error: "Invalid enrollment data" });
    }
  });

  app.get("/api/students", requireAuth, async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.post("/api/students", requireRole("admin", "teacher"), async (req, res) => {
    try {
      const data = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(data);
      res.json(student);
    } catch (error) {
      res.status(400).json({ error: "Invalid student data" });
    }
  });

  app.patch("/api/students/:id", requireRole("admin", "teacher"), async (req, res) => {
    try {
      const student = await storage.updateStudent(parseInt(req.params.id), req.body);
      res.json(student);
    } catch (error) {
      res.status(400).json({ error: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteStudent(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  app.get("/api/attendance", requireAuth, async (req, res) => {
    try {
      const { studentId, date } = req.query;
      const attendance = await storage.getAttendance(
        studentId ? parseInt(studentId as string) : undefined,
        date as string | undefined
      );
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance", requireRole("admin", "teacher"), async (req, res) => {
    try {
      const data = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(data);
      res.json(attendance);
    } catch (error) {
      res.status(400).json({ error: "Invalid attendance data" });
    }
  });

  app.patch("/api/attendance/:id", requireRole("admin", "teacher"), async (req, res) => {
    try {
      const attendance = await storage.updateAttendance(parseInt(req.params.id), req.body);
      res.json(attendance);
    } catch (error) {
      res.status(400).json({ error: "Failed to update attendance" });
    }
  });

  app.get("/api/leads", requireRole("admin", "teacher"), async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const data = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(data);
      res.json(lead);
    } catch (error) {
      res.status(400).json({ error: "Invalid lead data" });
    }
  });

  app.get("/api/lessons/:lessonId/comments", async (req, res) => {
    try {
      const comments = await storage.getComments(parseInt(req.params.lessonId));
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", requireAuth, async (req, res) => {
    try {
      const data = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(data);
      res.json(comment);
    } catch (error) {
      res.status(400).json({ error: "Invalid comment data" });
    }
  });

  app.get("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const messages = await storage.getMessages(req.user.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const data = insertMessageSchema.parse({ ...req.body, senderId: req.user.id });
      const message = await storage.createMessage(data);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  app.patch("/api/messages/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markMessageRead(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to mark message as read" });
    }
  });

  app.get("/api/notices", async (req, res) => {
    try {
      const { role } = req.query;
      const notices = await storage.getNotices(role as string | undefined);
      res.json(notices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notices" });
    }
  });

  app.post("/api/notices", requireRole("admin", "teacher"), async (req: any, res) => {
    try {
      const data = insertNoticeSchema.parse({ ...req.body, authorId: req.user.id });
      const notice = await storage.createNotice(data);
      res.json(notice);
    } catch (error) {
      res.status(400).json({ error: "Invalid notice data" });
    }
  });

  app.patch("/api/notices/:id", requireRole("admin", "teacher"), async (req, res) => {
    try {
      const notice = await storage.updateNotice(parseInt(req.params.id), req.body);
      res.json(notice);
    } catch (error) {
      res.status(400).json({ error: "Failed to update notice" });
    }
  });

  app.delete("/api/notices/:id", requireRole("admin", "teacher"), async (req, res) => {
    try {
      await storage.deleteNotice(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notice" });
    }
  });

  app.get("/api/materials", requireAuth, async (req, res) => {
    try {
      const { courseId } = req.query;
      const materials = await storage.getMaterials(courseId ? parseInt(courseId as string) : undefined);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });

  app.post("/api/materials", requireRole("admin", "teacher"), async (req: any, res) => {
    try {
      const data = insertMaterialSchema.parse({ ...req.body, uploadedBy: req.user.id });
      const material = await storage.createMaterial(data);
      res.json(material);
    } catch (error) {
      res.status(400).json({ error: "Invalid material data" });
    }
  });

  app.delete("/api/materials/:id", requireRole("admin", "teacher"), async (req, res) => {
    try {
      await storage.deleteMaterial(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete material" });
    }
  });

  app.get("/api/courses/:courseId/syllabus", async (req, res) => {
    try {
      const syllabus = await storage.getSyllabus(parseInt(req.params.courseId));
      res.json(syllabus);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch syllabus" });
    }
  });

  app.post("/api/syllabus", requireRole("admin", "teacher"), async (req, res) => {
    try {
      const data = insertSyllabusSchema.parse(req.body);
      const syllabus = await storage.createSyllabus(data);
      res.json(syllabus);
    } catch (error) {
      res.status(400).json({ error: "Invalid syllabus data" });
    }
  });

  app.patch("/api/syllabus/:id", requireRole("admin", "teacher"), async (req, res) => {
    try {
      const syllabus = await storage.updateSyllabus(parseInt(req.params.id), req.body);
      res.json(syllabus);
    } catch (error) {
      res.status(400).json({ error: "Failed to update syllabus" });
    }
  });

  app.delete("/api/syllabus/:id", requireRole("admin", "teacher"), async (req, res) => {
    try {
      await storage.deleteSyllabus(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete syllabus" });
    }
  });

  app.get("/api/payment-requests", requireAuth, async (req: any, res) => {
    try {
      const isAdmin = req.user.role === "admin";
      const requests = await storage.getPaymentRequests(isAdmin ? undefined : req.user.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment requests" });
    }
  });

  app.post("/api/payment-requests", requireAuth, async (req: any, res) => {
    try {
      const data = insertPaymentRequestSchema.parse({ ...req.body, userId: req.user.id });
      const request = await storage.createPaymentRequest(data);
      res.json(request);
    } catch (error) {
      res.status(400).json({ error: "Invalid payment request data" });
    }
  });

  app.patch("/api/payment-requests/:id", requireRole("admin"), async (req, res) => {
    try {
      const request = await storage.updatePaymentRequest(parseInt(req.params.id), req.body);
      res.json(request);
    } catch (error) {
      res.status(400).json({ error: "Failed to update payment request" });
    }
  });

  app.get("/api/timetable", async (req, res) => {
    try {
      const timetable = await storage.getTimetable();
      res.json(timetable);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch timetable" });
    }
  });

  app.post("/api/timetable", requireRole("admin", "teacher"), async (req, res) => {
    try {
      const entry = await storage.createTimetableEntry(req.body);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: "Invalid timetable data" });
    }
  });

  app.patch("/api/timetable/:id", requireRole("admin", "teacher"), async (req, res) => {
    try {
      const entry = await storage.updateTimetableEntry(parseInt(req.params.id), req.body);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: "Failed to update timetable" });
    }
  });

  app.delete("/api/timetable/:id", requireRole("admin", "teacher"), async (req, res) => {
    try {
      await storage.deleteTimetableEntry(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete timetable entry" });
    }
  });

  app.get("/api/users", requireRole("admin", "teacher"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({ id: u.id, email: u.email, fullName: u.fullName, role: u.role })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/profile", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        mobile: user.mobile,
        role: user.role,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.patch("/api/profile", requireAuth, async (req: any, res) => {
    try {
      const { fullName, mobile } = req.body;
      const user = await storage.updateUser(req.user.id, { fullName, mobile });
      res.json({
        id: user!.id,
        email: user!.email,
        fullName: user!.fullName,
        mobile: user!.mobile,
        role: user!.role,
      });
    } catch (error) {
      res.status(400).json({ error: "Failed to update profile" });
    }
  });

  app.patch("/api/users/:id/role", requireRole("admin"), async (req, res) => {
    try {
      const { role } = req.body;
      const user = await storage.updateUser(parseInt(req.params.id), { role });
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Failed to update user role" });
    }
  });
}
