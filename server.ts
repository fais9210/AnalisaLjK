import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

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
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API routes FIRST
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
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
