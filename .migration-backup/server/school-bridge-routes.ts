import type { Express, Request, Response } from "express";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  schools, schoolClasses, schoolSubjects, schoolChapters,
  schoolStudentLinks, studentRegistrations,
  insertSchoolClassSchema, insertSchoolSubjectSchema,
  insertSchoolChapterSchema,
} from "@shared/schema";

const verifiedSchoolCache = new Map<number, { verified: boolean; expiresAt: number }>();

const schoolRateLimitStore = new Map<string, { count: number; resetAt: number }>();
function schoolRateLimit(windowMs: number, maxRequests: number) {
  return (req: Request, res: Response, next: () => void) => {
    const ip = req.ip || (req as any).connection?.remoteAddress || "unknown";
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    const entry = schoolRateLimitStore.get(key);
    if (!entry || now > entry.resetAt) {
      schoolRateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= maxRequests) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }
    entry.count++;
    return next();
  };
}
const rlStudentRegister = schoolRateLimit(60 * 1000, 10);

async function getVerifiedSchoolSession(req: Request): Promise<{ userId: number } | null> {
  const userId = parseInt(req.headers["x-user-id"] as string) || parseInt(req.headers["x-student-id"] as string);
  const userType = req.headers["x-user-type"] as string;
  if (!userId || userType !== "school") return null;

  const cached = verifiedSchoolCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.verified ? { userId } : null;
  }

  try {
    const result = await db.execute(
      sql`SELECT id FROM school_collaborations WHERE id = ${userId} LIMIT 1`
    );
    const exists = !!(result.rows?.[0]);
    verifiedSchoolCache.set(userId, { verified: exists, expiresAt: Date.now() + 5 * 60 * 1000 });
    return exists ? { userId } : null;
  } catch {
    return null;
  }
}

async function getOrCreateSchoolRecord(collabId: number): Promise<any> {
  try {
    const existing = await db.execute(
      sql`SELECT * FROM schools WHERE slug = ${'collab-' + collabId} LIMIT 1`
    );
    if (existing.rows?.[0]) {
      const row = existing.rows[0] as any;
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        logo: row.logo,
        tagline: row.tagline,
        address: row.address,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        principalName: row.principal_name,
        boardAffiliation: row.board_affiliation,
        academicYear: row.academic_year,
        theme: row.theme,
        isActive: row.is_active,
      };
    }

    const collab = await db.execute(
      sql`SELECT * FROM school_collaborations WHERE id = ${collabId} LIMIT 1`
    );
    const c = collab.rows?.[0] as any;
    if (!c) return null;

    const [newSchool] = await db.insert(schools).values({
      name: c.school_name || "My School",
      slug: "collab-" + collabId,
      address: c.school_address || null,
      contactEmail: c.email || null,
      contactPhone: c.contact_phone || null,
      principalName: c.principal_name || null,
      boardAffiliation: c.board_affiliation || null,
      academicYear: "2025-2026",
      theme: "blue_academic",
    }).returning();

    return newSchool;
  } catch (err: any) {
    console.error("[getOrCreateSchoolRecord] Error:", err.message);
    return null;
  }
}

export function registerSchoolBridgeRoutes(app: Express) {

  app.get("/api/school/my-school", async (req: Request, res: Response) => {
    try {
      const session = await getVerifiedSchoolSession(req);
      if (!session) return res.status(401).json({ error: "Unauthorized" });
      const school = await getOrCreateSchoolRecord(session.userId);
      if (!school) return res.status(404).json({ error: "Could not find or create school" });
      res.json(school);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/school/my-school/classes", async (req: Request, res: Response) => {
    try {
      const session = await getVerifiedSchoolSession(req);
      if (!session) return res.status(401).json({ error: "Unauthorized" });
      const school = await getOrCreateSchoolRecord(session.userId);
      if (!school) return res.status(404).json({ error: "School not found" });
      const result = await db.execute(
        sql`SELECT * FROM school_classes WHERE school_id = ${school.id} AND is_active = true ORDER BY grade_number ASC, section ASC`
      );
      const classes = (result.rows || []).map((r: any) => ({
        id: r.id, schoolId: r.school_id, name: r.name,
        gradeNumber: r.grade_number, section: r.section,
        isActive: r.is_active, createdAt: r.created_at,
      }));
      res.json(classes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/school/my-school/classes", async (req: Request, res: Response) => {
    try {
      const session = await getVerifiedSchoolSession(req);
      if (!session) return res.status(401).json({ error: "Unauthorized" });
      const school = await getOrCreateSchoolRecord(session.userId);
      if (!school) return res.status(404).json({ error: "School not found" });
      const parsed = insertSchoolClassSchema.parse({ ...req.body, schoolId: school.id });
      const [cls] = await db.insert(schoolClasses).values(parsed).returning();
      res.json(cls);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/school/my-school/classes/:classId", async (req: Request, res: Response) => {
    try {
      const session = await getVerifiedSchoolSession(req);
      if (!session) return res.status(401).json({ error: "Unauthorized" });
      const school = await getOrCreateSchoolRecord(session.userId);
      if (!school) return res.status(404).json({ error: "School not found" });
      const classId = parseInt(req.params.classId);
      const { name, gradeNumber, section } = req.body;
      const safeUpdate: Record<string, any> = {};
      if (name !== undefined) safeUpdate.name = name;
      if (gradeNumber !== undefined) safeUpdate.gradeNumber = gradeNumber;
      if (section !== undefined) safeUpdate.section = section;
      const [updated] = await db.update(schoolClasses).set(safeUpdate)
        .where(and(eq(schoolClasses.id, classId), eq(schoolClasses.schoolId, school.id))).returning();
      if (!updated) return res.status(404).json({ error: "Class not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/school/my-school/classes/:classId", async (req: Request, res: Response) => {
    try {
      const session = await getVerifiedSchoolSession(req);
      if (!session) return res.status(401).json({ error: "Unauthorized" });
      const school = await getOrCreateSchoolRecord(session.userId);
      if (!school) return res.status(404).json({ error: "School not found" });
      await db.update(schoolClasses).set({ isActive: false })
        .where(and(eq(schoolClasses.id, parseInt(req.params.classId)), eq(schoolClasses.schoolId, school.id)));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/school/my-school/subjects", async (req: Request, res: Response) => {
    try {
      const session = await getVerifiedSchoolSession(req);
      if (!session) return res.status(401).json({ error: "Unauthorized" });
      const school = await getOrCreateSchoolRecord(session.userId);
      if (!school) return res.status(404).json({ error: "School not found" });
      const result = await db.execute(
        sql`SELECT * FROM school_subjects WHERE school_id = ${school.id} AND is_active = true ORDER BY name ASC`
      );
      const subjects = (result.rows || []).map((r: any) => ({
        id: r.id, schoolId: r.school_id, name: r.name,
        code: r.code, description: r.description,
        isActive: r.is_active, createdAt: r.created_at,
      }));
      res.json(subjects);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/school/my-school/subjects", async (req: Request, res: Response) => {
    try {
      const session = await getVerifiedSchoolSession(req);
      if (!session) return res.status(401).json({ error: "Unauthorized" });
      const school = await getOrCreateSchoolRecord(session.userId);
      if (!school) return res.status(404).json({ error: "School not found" });
      const parsed = insertSchoolSubjectSchema.parse({ ...req.body, schoolId: school.id });
      const [subj] = await db.insert(schoolSubjects).values(parsed).returning();
      res.json(subj);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/school/my-school/subjects/:subjectId", async (req: Request, res: Response) => {
    try {
      const session = await getVerifiedSchoolSession(req);
      if (!session) return res.status(401).json({ error: "Unauthorized" });
      const school = await getOrCreateSchoolRecord(session.userId);
      if (!school) return res.status(404).json({ error: "School not found" });
      const { name: sName, code, description: sDesc } = req.body;
      const safeSUpdate: Record<string, any> = {};
      if (sName !== undefined) safeSUpdate.name = sName;
      if (code !== undefined) safeSUpdate.code = code;
      if (sDesc !== undefined) safeSUpdate.description = sDesc;
      const [updated] = await db.update(schoolSubjects).set(safeSUpdate)
        .where(and(eq(schoolSubjects.id, parseInt(req.params.subjectId)), eq(schoolSubjects.schoolId, school.id))).returning();
      if (!updated) return res.status(404).json({ error: "Subject not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/school/my-school/subjects/:subjectId", async (req: Request, res: Response) => {
    try {
      const session = await getVerifiedSchoolSession(req);
      if (!session) return res.status(401).json({ error: "Unauthorized" });
      const school = await getOrCreateSchoolRecord(session.userId);
      if (!school) return res.status(404).json({ error: "School not found" });
      await db.update(schoolSubjects).set({ isActive: false })
        .where(and(eq(schoolSubjects.id, parseInt(req.params.subjectId)), eq(schoolSubjects.schoolId, school.id)));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/school/my-school/chapters", async (req: Request, res: Response) => {
    try {
      const session = await getVerifiedSchoolSession(req);
      if (!session) return res.status(401).json({ error: "Unauthorized" });
      const school = await getOrCreateSchoolRecord(session.userId);
      if (!school) return res.status(404).json({ error: "School not found" });
      const subjectId = req.query.subjectId ? parseInt(req.query.subjectId as string) : null;
      let query = sql`SELECT * FROM school_chapters WHERE school_id = ${school.id} AND is_active = true`;
      if (subjectId) {
        query = sql`SELECT * FROM school_chapters WHERE school_id = ${school.id} AND subject_id = ${subjectId} AND is_active = true ORDER BY chapter_number ASC`;
      } else {
        query = sql`SELECT * FROM school_chapters WHERE school_id = ${school.id} AND is_active = true ORDER BY chapter_number ASC`;
      }
      const result = await db.execute(query);
      const chapters = (result.rows || []).map((r: any) => ({
        id: r.id, subjectId: r.subject_id, schoolId: r.school_id,
        name: r.name, chapterNumber: r.chapter_number,
        description: r.description, syllabusText: r.syllabus_text,
        syllabusPdfUrl: r.syllabus_pdf_url,
        learningObjectives: r.learning_objectives,
        conceptTags: r.concept_tags, difficultyLevel: r.difficulty_level,
        bloomTaxonomyTags: r.bloom_taxonomy_tags,
        isActive: r.is_active, createdAt: r.created_at,
      }));
      res.json(chapters);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/school/my-school/chapters", async (req: Request, res: Response) => {
    try {
      const session = await getVerifiedSchoolSession(req);
      if (!session) return res.status(401).json({ error: "Unauthorized" });
      const school = await getOrCreateSchoolRecord(session.userId);
      if (!school) return res.status(404).json({ error: "School not found" });
      const parsed = insertSchoolChapterSchema.parse({ ...req.body, schoolId: school.id });
      const [chap] = await db.insert(schoolChapters).values(parsed).returning();
      res.json(chap);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/school/my-school/chapters/:chapterId", async (req: Request, res: Response) => {
    try {
      const session = await getVerifiedSchoolSession(req);
      if (!session) return res.status(401).json({ error: "Unauthorized" });
      const school = await getOrCreateSchoolRecord(session.userId);
      if (!school) return res.status(404).json({ error: "School not found" });
      const { name: cName, chapterNumber, description: cDesc, syllabusText, difficultyLevel, learningObjectives, conceptTags } = req.body;
      const safeCUpdate: Record<string, any> = {};
      if (cName !== undefined) safeCUpdate.name = cName;
      if (chapterNumber !== undefined) safeCUpdate.chapterNumber = chapterNumber;
      if (cDesc !== undefined) safeCUpdate.description = cDesc;
      if (syllabusText !== undefined) safeCUpdate.syllabusText = syllabusText;
      if (difficultyLevel !== undefined) safeCUpdate.difficultyLevel = difficultyLevel;
      if (learningObjectives !== undefined) safeCUpdate.learningObjectives = learningObjectives;
      if (conceptTags !== undefined) safeCUpdate.conceptTags = conceptTags;
      const [updated] = await db.update(schoolChapters).set(safeCUpdate)
        .where(and(eq(schoolChapters.id, parseInt(req.params.chapterId)), eq(schoolChapters.schoolId, school.id))).returning();
      if (!updated) return res.status(404).json({ error: "Chapter not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/school/my-school/chapters/:chapterId", async (req: Request, res: Response) => {
    try {
      const session = await getVerifiedSchoolSession(req);
      if (!session) return res.status(401).json({ error: "Unauthorized" });
      const school = await getOrCreateSchoolRecord(session.userId);
      if (!school) return res.status(404).json({ error: "School not found" });
      await db.update(schoolChapters).set({ isActive: false })
        .where(and(eq(schoolChapters.id, parseInt(req.params.chapterId)), eq(schoolChapters.schoolId, school.id)));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ============== SCHOOL STUDENT MANAGEMENT ==============

  app.get("/api/school/my-school/students", async (req: Request, res: Response) => {
    try {
      const session = await getVerifiedSchoolSession(req);
      if (!session) return res.status(401).json({ error: "Unauthorized" });
      const school = await getOrCreateSchoolRecord(session.userId);
      if (!school) return res.status(404).json({ error: "School not found" });

      const result = await db.execute(
        sql`SELECT sl.id as link_id, sl.class_id, sl.section, sl.roll_number, sl.enrolled_at,
            sr.id, sr.student_id, sr.email, sr.first_name, sr.last_name, sr.date_of_birth, sr.gender, sr.phone,
            sr.grade_level, sr.profile_status,
            c.name as class_name, c.grade_number
          FROM school_student_links sl
          JOIN student_registrations sr ON sl.student_id = sr.id
          LEFT JOIN school_classes c ON sl.class_id = c.id
          WHERE sl.school_id = ${school.id}
          ORDER BY sl.enrolled_at DESC`
      );
      res.json(result.rows || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/school/my-school/students/register", rlStudentRegister, async (req: Request, res: Response) => {
    try {
      const session = await getVerifiedSchoolSession(req);
      if (!session) return res.status(401).json({ error: "Unauthorized" });
      const school = await getOrCreateSchoolRecord(session.userId);
      if (!school) return res.status(404).json({ error: "School not found" });

      const { firstName, lastName, dateOfBirth, gender, email, phone, classId, section, parentName, parentPhone } = req.body;
      if (!firstName || !lastName || !dateOfBirth || !gender) {
        return res.status(400).json({ error: "First name, last name, date of birth and gender are required" });
      }

      const parsedClassId = classId ? parseInt(classId) : null;
      if (parsedClassId) {
        const classCheck = await db.execute(
          sql`SELECT id FROM school_classes WHERE id = ${parsedClassId} AND school_id = ${school.id} AND is_active = true LIMIT 1`
        );
        if (!classCheck.rows?.[0]) {
          return res.status(400).json({ error: "Invalid class selection" });
        }
      }

      if (email) {
        const existingEmail = await db.execute(
          sql`SELECT id FROM student_registrations WHERE email = ${email} LIMIT 1`
        );
        if (existingEmail.rows?.[0]) {
          const existingLink = await db.execute(
            sql`SELECT id FROM school_student_links WHERE school_id = ${school.id} AND student_id = ${(existingEmail.rows[0] as any).id} LIMIT 1`
          );
          if (existingLink.rows?.[0]) {
            return res.status(400).json({ error: "Student with this email is already registered in your school" });
          }
        }
      }

      const year = new Date().getFullYear().toString().slice(-2);
      const schoolCode = (school.slug || "SCH").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "SCH";
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

      const seqResult = await db.execute(
        sql`SELECT COALESCE(MAX(CAST(roll_number AS INTEGER)), 0) + 1 as next_seq FROM school_student_links WHERE school_id = ${school.id}`
      );
      const seq = parseInt((seqResult.rows?.[0] as any)?.next_seq || "1");
      const generatedStudentId = `${schoolCode}${year}${String(seq).padStart(4, "0")}`;

      const rawPassword = `${firstName.slice(0, 3).toLowerCase()}${randomSuffix}@${dateOfBirth.replace(/-/g, "").slice(-4)}`;

      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const loginEmail = email || `${generatedStudentId.toLowerCase()}@school.samikaran.com`;

      const result = await db.transaction(async (tx) => {
        const [newStudent] = await tx.insert(studentRegistrations).values({
          studentId: generatedStudentId,
          email: loginEmail,
          firstName,
          lastName,
          dateOfBirth,
          gender,
          phone: phone || null,
          password: hashedPassword,
          registrationType: "school",
          schoolName: school.name || null,
          gradeLevel: parsedClassId ? String(parsedClassId) : null,
          profileStatus: "active",
          verified: true,
          emailVerified: true,
          termsAccepted: true,
        }).returning();

        await tx.insert(schoolStudentLinks).values({
          schoolId: school.id,
          studentId: newStudent.id,
          classId: parsedClassId,
          section: section || "A",
          rollNumber: String(seq),
        });

        if (parentName || parentPhone) {
          await tx.execute(
            sql`UPDATE student_registrations SET 
              address_line_1 = ${parentName ? `Parent: ${parentName}` : null},
              address_line_2 = ${parentPhone ? `Parent Phone: ${parentPhone}` : null}
            WHERE id = ${newStudent.id}`
          );
        }

        return newStudent;
      });

      res.json({
        success: true,
        student: {
          id: result.id,
          name: `${firstName} ${lastName}`,
          studentId: generatedStudentId,
          email: loginEmail,
        },
        credentials: {
          loginId: loginEmail,
          password: rawPassword,
          studentId: generatedStudentId,
        },
        message: `Student registered successfully. Login ID: ${loginEmail}, Password: ${rawPassword}`,
      });
    } catch (err: any) {
      console.error("[School Student Register Error]", err);
      if (err.message?.includes("unique") || err.message?.includes("duplicate")) {
        return res.status(400).json({ error: "A student with this email or phone already exists" });
      }
      res.status(500).json({ error: err.message });
    }
  });
}
