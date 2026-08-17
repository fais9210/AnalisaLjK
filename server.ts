import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { getDbPool, initializeDatabase, checkDbConnection } from "./server/db";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: "15mb" }));

  // Auto-init DB if DATABASE_URL exists
  if (process.env.DATABASE_URL) {
    initializeDatabase().catch((e) => {
      console.warn("Neon DB init deferred or failed:", e.message);
    });
  }

  // 1. Health & Database Status
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      hasDatabase: Boolean(process.env.DATABASE_URL),
      hasGemini: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  app.get("/api/db/status", async (_req, res) => {
    const status = await checkDbConnection();
    res.json(status);
  });

  // 2. Full Sync (GET all data from PostgreSQL / Neon DB)
  app.get("/api/db/sync", async (_req, res) => {
    const pool = getDbPool();
    if (!pool) {
      return res.json({ connected: false, message: "Database not configured" });
    }

    try {
      await initializeDatabase();

      const [studentsRes, teachersRes, classesRes, subjectsRes, archivesRes, stateRes] =
        await Promise.all([
          pool.query("SELECT * FROM master_students ORDER BY class_name ASC, name ASC"),
          pool.query("SELECT * FROM master_teachers ORDER BY name ASC"),
          pool.query("SELECT * FROM master_classes ORDER BY name ASC"),
          pool.query("SELECT * FROM master_subjects ORDER BY name ASC"),
          pool.query("SELECT * FROM exam_archives ORDER BY created_at DESC"),
          pool.query("SELECT * FROM app_state"),
        ]);

      const students = studentsRes.rows.map((r) => ({
        id: r.id,
        nis: r.nis,
        name: r.name,
        gender: r.gender,
        className: r.class_name,
        phone: r.phone,
        active: r.active,
      }));

      const teachers = teachersRes.rows.map((r) => ({
        id: r.id,
        nip: r.nip,
        name: r.name,
        role: r.role,
        subject: r.subject,
        assignedClass: r.assigned_class,
        phone: r.phone,
      }));

      const classes = classesRes.rows.map((r) => ({
        id: r.id,
        name: r.name,
        level: r.level,
        academicYear: r.academic_year,
        waliKelasName: r.wali_kelas_name,
      }));

      const subjects = subjectsRes.rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        category: r.category,
        kkmDefault: r.kkm_default,
      }));

      const examArchives = archivesRes.rows.map((r) => r.data_json);

      const stateMap: Record<string, any> = {};
      stateRes.rows.forEach((r) => {
        stateMap[r.key] = r.value;
      });

      return res.json({
        connected: true,
        data: {
          students,
          teachers,
          classes,
          subjects,
          examArchives,
          currentConfig: stateMap["current_config"] || null,
          currentScores: stateMap["current_scores"] || null,
          activeExamId: stateMap["active_exam_id"] || null,
        },
      });
    } catch (error: any) {
      console.error("DB Sync GET error:", error);
      return res.status(500).json({ connected: false, error: error.message });
    }
  });

  // 3. Bulk Sync POST (push client data to PostgreSQL / Neon DB)
  app.post("/api/db/sync", async (req, res) => {
    const pool = getDbPool();
    if (!pool) {
      return res.status(400).json({ error: "DATABASE_URL is not set." });
    }

    const { students, teachers, classes, subjects, examArchives, currentConfig, currentScores, activeExamId } = req.body;

    const client = await pool.connect();
    try {
      await initializeDatabase();
      await client.query("BEGIN");

      // Sync Students
      if (Array.isArray(students)) {
        await client.query("DELETE FROM master_students");
        for (const s of students) {
          await client.query(
            `INSERT INTO master_students (id, nis, name, gender, class_name, phone, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
               nis = EXCLUDED.nis, name = EXCLUDED.name, gender = EXCLUDED.gender,
               class_name = EXCLUDED.class_name, phone = EXCLUDED.phone, active = EXCLUDED.active,
               updated_at = CURRENT_TIMESTAMP`,
            [s.id, s.nis || "", s.name, s.gender || "L", s.className || "I - SATU", s.phone || "", s.active ?? true]
          );
        }
      }

      // Sync Teachers
      if (Array.isArray(teachers)) {
        await client.query("DELETE FROM master_teachers");
        for (const t of teachers) {
          await client.query(
            `INSERT INTO master_teachers (id, nip, name, role, subject, assigned_class, phone)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
               nip = EXCLUDED.nip, name = EXCLUDED.name, role = EXCLUDED.role,
               subject = EXCLUDED.subject, assigned_class = EXCLUDED.assigned_class, phone = EXCLUDED.phone,
               updated_at = CURRENT_TIMESTAMP`,
            [t.id, t.nip || "", t.name, t.role || "Guru Pengampu", t.subject || "", t.assignedClass || "", t.phone || ""]
          );
        }
      }

      // Sync Classes
      if (Array.isArray(classes)) {
        await client.query("DELETE FROM master_classes");
        for (const c of classes) {
          await client.query(
            `INSERT INTO master_classes (id, name, level, academic_year, wali_kelas_name)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name, level = EXCLUDED.level, academic_year = EXCLUDED.academic_year,
               wali_kelas_name = EXCLUDED.wali_kelas_name, updated_at = CURRENT_TIMESTAMP`,
            [c.id, c.name, c.level || "", c.academicYear || "", c.waliKelasName || ""]
          );
        }
      }

      // Sync Subjects
      if (Array.isArray(subjects)) {
        await client.query("DELETE FROM master_subjects");
        for (const sub of subjects) {
          await client.query(
            `INSERT INTO master_subjects (id, code, name, category, kkm_default)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET
               code = EXCLUDED.code, name = EXCLUDED.name, category = EXCLUDED.category,
               kkm_default = EXCLUDED.kkm_default, updated_at = CURRENT_TIMESTAMP`,
            [sub.id, sub.code || "", sub.name, sub.category || "", sub.kkmDefault || 75]
          );
        }
      }

      // Sync Exam Archives
      if (Array.isArray(examArchives)) {
        await client.query("DELETE FROM exam_archives");
        for (const a of examArchives) {
          await client.query(
            `INSERT INTO exam_archives (id, title, class_name, subject, semester, academic_year, teacher_name, exam_date, date_location, date_hijri, kkm, max_score, data_json)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (id) DO UPDATE SET
               title = EXCLUDED.title, class_name = EXCLUDED.class_name, subject = EXCLUDED.subject,
               data_json = EXCLUDED.data_json, updated_at = CURRENT_TIMESTAMP`,
            [
              a.id,
              a.title || "",
              a.className || "",
              a.subject || "",
              a.semester || "",
              a.academicYear || "",
              a.teacherName || "",
              a.examDate || "",
              a.dateLocation || "",
              a.dateHijri || "",
              a.kkm || 75,
              a.maxScore || 100,
              JSON.stringify(a),
            ]
          );
        }
      }

      // Sync App State
      if (currentConfig) {
        await client.query(
          `INSERT INTO app_state (key, value, updated_at) VALUES ('current_config', $1, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
          [JSON.stringify(currentConfig)]
        );
      }

      if (currentScores) {
        await client.query(
          `INSERT INTO app_state (key, value, updated_at) VALUES ('current_scores', $1, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
          [JSON.stringify(currentScores)]
        );
      }

      if (activeExamId !== undefined) {
        await client.query(
          `INSERT INTO app_state (key, value, updated_at) VALUES ('active_exam_id', $1, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
          [JSON.stringify(activeExamId)]
        );
      }

      await client.query("COMMIT");
      res.json({ success: true, message: "Sync with Neon DB completed successfully." });
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("DB Sync POST error:", error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      client.release();
    }
  });

  // 4. Archive single Exam Record
  app.post("/api/db/exam-records", async (req, res) => {
    const pool = getDbPool();
    if (!pool) return res.status(400).json({ error: "Database not configured" });

    const a = req.body;
    try {
      await initializeDatabase();
      await pool.query(
        `INSERT INTO exam_archives (id, title, class_name, subject, semester, academic_year, teacher_name, exam_date, date_location, date_hijri, kkm, max_score, data_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, class_name = EXCLUDED.class_name, subject = EXCLUDED.subject,
           data_json = EXCLUDED.data_json, updated_at = CURRENT_TIMESTAMP`,
        [
          a.id,
          a.title || "",
          a.className || "",
          a.subject || "",
          a.semester || "",
          a.academicYear || "",
          a.teacherName || "",
          a.examDate || "",
          a.dateLocation || "",
          a.dateHijri || "",
          a.kkm || 75,
          a.maxScore || 100,
          JSON.stringify(a),
        ]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/db/exam-records/:id", async (req, res) => {
    const pool = getDbPool();
    if (!pool) return res.status(400).json({ error: "Database not configured" });

    try {
      await pool.query("DELETE FROM exam_archives WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // AI Exam Insights & Automated Analysis endpoint
  app.post("/api/analyze-exam", async (req, res) => {
    try {
      const { examTitle, subject, className, stats, questions, studentHighlights } = req.body;
      const ai = getAI();

      if (!ai) {
        // Fallback rule-based automated analysis if API key is not yet set
        return res.json({
          summary: `Analisis otomatis untuk ${examTitle} mata pelajaran ${subject} di ${className}: Tingkat ketuntasan mencapai ${stats.passPercentage}%. Rata-rata kelas berada pada angka ${stats.averageScore.toFixed(1)} dari nilai maksimal 100.`,
          strengths: [
            `Siswa menunjukkan penguasaan yang sangat baik pada soal-soal pilihan ganda dasar.`,
            `Sebanyak ${stats.passedCount} dari ${stats.totalStudents} siswa (${stats.passPercentage}%) telah melampaui KKM (${stats.kkm}).`
          ],
          weaknesses: [
            `Terdapat soal nomor tertentu (terutama isian/uraian tingkat pemahaman mendalam) yang memiliki tingkat kesalahan relatif tinggi.`,
            `Sebanyak ${stats.failedCount} siswa masih berada di bawah KKM dan memerlukan tindak lanjut.`
          ],
          recommendations: [
            `Lakukan program remedial kelompok terfokus untuk ${stats.failedCount} siswa yang belum tuntas dengan materi dasar terkait.`,
            `Lakukan pengayaan materi penalaran dan pembahasan soal sulit untuk siswa berkemampuan tinggi (${studentHighlights.topStudents?.join(', ') || 'Siswa Nilai Tertinggi'}).`,
            `Evaluasi redaksi soal pada butir soal yang memiliki tingkat kesukaran tinggi.`
          ],
          isAiGenerated: false
        });
      }

      const prompt = `
Anda adalah seorang pakar evaluasi pendidikan dan analisis butir soal ujian (Item Analysis Specialist) madrasah/sekolah di Indonesia.
Analisis data hasil ujian berikut secara mendalam, profesional, dan berikan rekomendasi pedagogis yang konkret:

- Judul Ujian: ${examTitle}
- Mata Pelajaran / Fan: ${subject}
- Kelas: ${className}
- KKM: ${stats.kkm}
- Jumlah Siswa: ${stats.totalStudents}
- Rata-rata Nilai: ${stats.averageScore.toFixed(1)}
- Nilai Tertinggi: ${stats.maxScore}
- Nilai Terendah: ${stats.minScore}
- Jumlah Tuntas: ${stats.passedCount} (${stats.passPercentage}%)
- Jumlah Belum Tuntas: ${stats.failedCount}
- Ringkasan Butir Soal: ${JSON.stringify(questions?.slice(0, 15) || [])}
- Sorotan Siswa: Tertinggi (${studentHighlights.topStudents?.join(', ') || '-'}), Butuh Bimbingan (${studentHighlights.needRemedial?.join(', ') || '-'})

Berikan output dalam JSON dengan format:
{
  "summary": "Ringkasan evaluasi hasil ujian secara menyeluruh (2-3 kalimat)",
  "strengths": ["Poin kelebihan 1", "Poin kelebihan 2"],
  "weaknesses": ["Poin kelemahan / tantangan 1", "Poin kelemahan 2"],
  "recommendations": ["Rekomendasi tindakan guru 1 (remedial/pengayaan)", "Rekomendasi 2", "Rekomendasi 3"]
}
HANYA kembalikan format JSON valid tanpa tanda backtick markdown jika memungkinkan.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        return res.json({ ...parsed, isAiGenerated: true });
      } else {
        throw new Error("No response from AI");
      }
    } catch (error: any) {
      console.error("AI Analysis error:", error);
      return res.json({
        summary: `Analisis data ujian menunjukkan rata-rata kelas ${req.body?.stats?.averageScore?.toFixed(1) || 0} dengan tingkat kelulusan KKM ${req.body?.stats?.passPercentage || 0}%.`,
        strengths: ["Sebagian besar siswa memahami konsep dasar dengan baik."],
        weaknesses: ["Perlu penguatan pada tipe soal uraian dan analisis mendalam."],
        recommendations: [
          "Jadwalkan sesi remedial bagi siswa yang belum mencapai KKM.",
          "Bahas kembali butir soal dengan persentase salah tertinggi di kelas."
        ],
        isAiGenerated: false,
        fallbackNote: error.message
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
