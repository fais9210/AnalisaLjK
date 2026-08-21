import { ExamSheetConfig, ExamStatistics, QuestionAnalysis, StudentScoreRow } from '../types';

export function normalizeClassName(raw?: string): string {
  if (!raw) return '';
  const trimmed = String(raw)
    .trim()
    .toUpperCase()
    .replace(/^KELAS\s+/i, '')
    .replace(/^KLS\s+/i, '')
    .trim();

  if (
    trimmed === '1' ||
    trimmed === 'I' ||
    trimmed === 'I - SATU' ||
    trimmed === '1 - SATU' ||
    trimmed === 'SATU' ||
    trimmed === 'I (SATU)' ||
    trimmed === 'KELAS 1' ||
    trimmed === 'KELAS I'
  ) {
    return 'I - SATU';
  }
  if (
    trimmed === '2' ||
    trimmed === 'II' ||
    trimmed === 'II - DUA' ||
    trimmed === '2 - DUA' ||
    trimmed === 'DUA' ||
    trimmed === 'II (DUA)' ||
    trimmed === 'KELAS 2' ||
    trimmed === 'KELAS II'
  ) {
    return 'II - DUA';
  }
  if (
    trimmed === '3' ||
    trimmed === 'III' ||
    trimmed === 'III - TIGA' ||
    trimmed === '3 - TIGA' ||
    trimmed === 'TIGA' ||
    trimmed === 'III (TIGA)' ||
    trimmed === 'KELAS 3' ||
    trimmed === 'KELAS III'
  ) {
    return 'III - TIGA';
  }
  if (
    trimmed === '4' ||
    trimmed === 'IV' ||
    trimmed === 'IV - EMPAT' ||
    trimmed === '4 - EMPAT' ||
    trimmed === 'EMPAT' ||
    trimmed === 'IV (EMPAT)' ||
    trimmed === 'KELAS 4' ||
    trimmed === 'KELAS IV'
  ) {
    return 'IV - EMPAT';
  }
  if (
    trimmed === '5' ||
    trimmed === 'V' ||
    trimmed === 'V - LIMA' ||
    trimmed === '5 - LIMA' ||
    trimmed === 'LIMA' ||
    trimmed === 'V (LIMA)' ||
    trimmed === 'KELAS 5' ||
    trimmed === 'KELAS V'
  ) {
    return 'V - LIMA';
  }
  if (
    trimmed === '6' ||
    trimmed === 'VI' ||
    trimmed === 'VI - ENAM' ||
    trimmed === '6 - ENAM' ||
    trimmed === 'ENAM' ||
    trimmed === 'VI (ENAM)' ||
    trimmed === 'KELAS 6' ||
    trimmed === 'KELAS VI'
  ) {
    return 'VI - ENAM';
  }
  return trimmed;
}

export function isSameClass(classA?: string, classB?: string): boolean {
  if (!classA || !classB) return false;
  return normalizeClassName(classA) === normalizeClassName(classB);
}

export function getTeacherForClass(
  className?: string,
  classes: { name: string; waliKelasName?: string }[] = [],
  teachers: { name: string; assignedClass?: string; role?: string }[] = []
): string {
  if (!className) return '';
  const norm = normalizeClassName(className);

  // 1. Look in teachers list by assignedClass (source of truth: data guru)
  const assignedTeacher = (teachers || []).find((t) => isSameClass(t.assignedClass, norm));
  if (assignedTeacher?.name && assignedTeacher.name.trim() !== '') {
    return assignedTeacher.name.trim();
  }

  // 2. Look in classes list
  const foundClass = classes.find((c) => isSameClass(c.name, norm));
  if (foundClass?.waliKelasName && foundClass.waliKelasName.trim() !== '') {
    return foundClass.waliKelasName.trim();
  }

  return '';
}

export function formatSignatureDate(config?: Partial<ExamSheetConfig> | null): string {
  if (!config) return 'Karangnongko, ............. 1448';
  const loc = (config.dateLocation && config.dateLocation.trim()) || 'Karangnongko';
  const dayMonth =
    config.dateDayMonth !== undefined && config.dateDayMonth !== null && config.dateDayMonth.trim() !== ''
      ? config.dateDayMonth.trim()
      : '.............';
  const year = (config.dateHijri && config.dateHijri.trim()) || '1448';
  return `${loc}, ${dayMonth} ${year}`;
}

export function calculateRowScores(
  scores: Record<string, number>,
  config: ExamSheetConfig
): { correctQuestionsCount: number; wrongQuestionsCount: number; totalScore: number; isPassed: boolean } {
  let correctCount = 0;
  let wrongCount = 0;
  let totalScore = 0;

  for (const q of config.questions) {
    const score = Number(scores[q.id]) || 0;
    totalScore += score;

    // In Indonesian item analysis convention:
    // Full score is deemed correct (1), 0 is wrong, >0 is partial/correct
    if (score >= q.maxScore) {
      correctCount += 1;
    } else if (score === 0) {
      wrongCount += 1;
    } else {
      // Partial score - counts proportionally or as correct
      correctCount += 1;
    }
  }

  const isPassed = totalScore >= config.kkm;

  return {
    correctQuestionsCount: correctCount,
    wrongQuestionsCount: config.questions.length - correctCount,
    totalScore,
    isPassed,
  };
}

export function computeQuestionAnalyses(
  rows: StudentScoreRow[],
  config: ExamSheetConfig
): QuestionAnalysis[] {
  const totalStudents = rows.length;
  if (totalStudents === 0) {
    return config.questions.map((q) => ({
      questionId: q.id,
      number: q.number,
      type: q.type,
      maxScore: q.maxScore,
      correctCount: 0,
      wrongCount: 0,
      totalPointsAwarded: 0,
      difficultyIndex: 0,
      difficultyCategory: 'Sedang',
      discriminationIndex: 0,
      discriminationCategory: 'Cukup',
      itemRecommendation: 'Diterima',
    }));
  }

  // Sort rows descending by totalScore for discrimination index calculation
  const sortedRows = [...rows].sort((a, b) => b.totalScore - a.totalScore);
  const groupSize = Math.max(1, Math.floor(totalStudents * 0.27)) || Math.ceil(totalStudents / 2);
  const upperGroup = sortedRows.slice(0, groupSize);
  const lowerGroup = sortedRows.slice(totalStudents - groupSize);

  return config.questions.map((q) => {
    let correctCount = 0;
    let wrongCount = 0;
    let totalPoints = 0;

    for (const r of rows) {
      const s = Number(r.scores[q.id]) || 0;
      totalPoints += s;
      if (s >= q.maxScore) {
        correctCount += 1;
      } else if (s === 0) {
        wrongCount += 1;
      } else {
        // partial
        if (s >= q.maxScore / 2) correctCount += 1;
        else wrongCount += 1;
      }
    }

    // Difficulty Index P = (Total Points Awarded) / (Total Students * Max Score)
    const maxPossiblePoints = totalStudents * q.maxScore;
    const difficultyIndex = maxPossiblePoints > 0 ? totalPoints / maxPossiblePoints : 0;

    let difficultyCategory: 'Sukar' | 'Sedang' | 'Mudah' = 'Sedang';
    if (difficultyIndex > 0.70) {
      difficultyCategory = 'Mudah';
    } else if (difficultyIndex < 0.30) {
      difficultyCategory = 'Sukar';
    } else {
      difficultyCategory = 'Sedang';
    }

    // Discrimination Index D = (Upper Correct - Lower Correct) / GroupSize
    let upperCorrect = 0;
    let lowerCorrect = 0;
    for (const u of upperGroup) {
      if ((Number(u.scores[q.id]) || 0) >= q.maxScore * 0.5) upperCorrect++;
    }
    for (const l of lowerGroup) {
      if ((Number(l.scores[q.id]) || 0) >= q.maxScore * 0.5) lowerCorrect++;
    }
    const discriminationIndex = groupSize > 0 ? (upperCorrect - lowerCorrect) / groupSize : 0;

    let discriminationCategory = 'Baik';
    if (discriminationIndex >= 0.4) discriminationCategory = 'Sangat Baik';
    else if (discriminationIndex >= 0.3) discriminationCategory = 'Baik';
    else if (discriminationIndex >= 0.2) discriminationCategory = 'Cukup';
    else if (discriminationIndex >= 0.0) discriminationCategory = 'Jelek / Revisi';
    else discriminationCategory = 'Ditolak / Negatif';

    // Item Recommendation based on standard educational assessment rules
    let itemRecommendation: 'Diterima' | 'Diterima & Direvisi' | 'Ditolak / Dibuang' = 'Diterima';
    if (discriminationIndex < 0.0) {
      itemRecommendation = 'Ditolak / Dibuang';
    } else if (discriminationIndex < 0.20 || difficultyIndex < 0.20 || difficultyIndex > 0.85) {
      itemRecommendation = 'Diterima & Direvisi';
    } else {
      itemRecommendation = 'Diterima';
    }

    return {
      questionId: q.id,
      number: q.number,
      type: q.type,
      maxScore: q.maxScore,
      correctCount,
      wrongCount,
      totalPointsAwarded: totalPoints,
      difficultyIndex: Number(difficultyIndex.toFixed(2)),
      difficultyCategory,
      discriminationIndex: Number(discriminationIndex.toFixed(2)),
      discriminationCategory,
      itemRecommendation,
    };
  });
}

export function computeExamStatistics(
  rows: StudentScoreRow[],
  config: ExamSheetConfig
): ExamStatistics {
  const totalStudents = rows.length;

  if (totalStudents === 0) {
    return {
      totalStudents: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      medianScore: 0,
      standardDeviation: 0,
      passedCount: 0,
      failedCount: 0,
      passPercentage: 0,
      gradeDistribution: { gradeA: 0, gradeB: 0, gradeC: 0, gradeD: 0 },
      topStudents: [],
      needRemedial: [],
      remedialDetails: [],
      enrichmentDetails: [],
      qualitySummary: { accepted: 0, revised: 0, rejected: 0, easyCount: 0, mediumCount: 0, hardCount: 0 },
      questionAnalyses: computeQuestionAnalyses(rows, config),
      hardestQuestions: [],
      easiestQuestions: [],
    };
  }

  const scores = rows.map((r) => r.totalScore);
  const totalScoreSum = scores.reduce((a, b) => a + b, 0);
  const averageScore = totalScoreSum / totalStudents;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);

  // Median
  const sortedScores = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sortedScores.length / 2);
  const medianScore =
    sortedScores.length % 2 !== 0
      ? sortedScores[mid]
      : (sortedScores[mid - 1] + sortedScores[mid]) / 2;

  // Standard Deviation
  const variance =
    scores.reduce((acc, score) => acc + Math.pow(score - averageScore, 2), 0) / totalStudents;
  const standardDeviation = Math.sqrt(variance);

  // Pass vs Fail
  const passedCount = rows.filter((r) => r.isPassed).length;
  const failedCount = totalStudents - passedCount;
  const passPercentage = Number(((passedCount / totalStudents) * 100).toFixed(1));

  // Grade Distribution
  const gradeDistribution = {
    gradeA: rows.filter((r) => r.totalScore >= 85).length,
    gradeB: rows.filter((r) => r.totalScore >= 75 && r.totalScore < 85).length,
    gradeC: rows.filter((r) => r.totalScore >= config.kkm && r.totalScore < 75).length,
    gradeD: rows.filter((r) => r.totalScore < config.kkm).length,
  };

  // Top Students
  const topStudents = [...rows]
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5)
    .map((r) => ({ name: r.studentName, score: r.totalScore }));

  // Detailed Remedial breakdown
  const remedialDetails = rows
    .filter((r) => !r.isPassed)
    .map((r) => {
      const deficientTypes: string[] = [];
      const wrongQuestionNumbers: number[] = [];

      const pgQuestions = config.questions.filter((q) => q.type === 'pg');
      const isianQuestions = config.questions.filter((q) => q.type === 'isian');
      const uraianQuestions = config.questions.filter((q) => q.type === 'uraian');

      for (const q of config.questions) {
        const score = Number(r.scores[q.id]) || 0;
        if (score < q.maxScore * 0.5) {
          wrongQuestionNumbers.push(q.number);
        }
      }

      const pgScore = pgQuestions.reduce((sum, q) => sum + (r.scores[q.id] || 0), 0);
      const pgMax = pgQuestions.reduce((sum, q) => sum + q.maxScore, 0);

      const isianScore = isianQuestions.reduce((sum, q) => sum + (r.scores[q.id] || 0), 0);
      const isianMax = isianQuestions.reduce((sum, q) => sum + q.maxScore, 0);

      const uraianScore = uraianQuestions.reduce((sum, q) => sum + (r.scores[q.id] || 0), 0);
      const uraianMax = uraianQuestions.reduce((sum, q) => sum + q.maxScore, 0);

      if (pgMax > 0 && pgScore / pgMax < 0.6) deficientTypes.push('Pilihan Ganda');
      if (isianMax > 0 && isianScore / isianMax < 0.6) deficientTypes.push('Isian Singkat');
      if (uraianMax > 0 && uraianScore / uraianMax < 0.6) deficientTypes.push('Uraian / Esai');

      let suggestedAction = 'Bimbingan perorangan dan penugasan ulang';
      if (r.totalScore < config.kkm * 0.6) {
        suggestedAction = 'Pembelajaran ulang materi pokok & tes remedial komprehensif';
      } else if (wrongQuestionNumbers.length <= 4) {
        suggestedAction = `Tutor sebaya & pembahasan butir soal no. ${wrongQuestionNumbers.join(', ')}`;
      } else {
        suggestedAction = 'Bimbingan khusus kelompok kecil dan tugas terstruktur';
      }

      return {
        studentId: r.studentId,
        nis: `2024${r.studentId.replace(/\D/g, '').slice(-4).padStart(4, '0')}`,
        name: r.studentName,
        score: r.totalScore,
        deficientTypes: deficientTypes.length > 0 ? deficientTypes : ['Konsep Dasar'],
        wrongQuestionNumbers,
        suggestedAction,
      };
    })
    .sort((a, b) => a.score - b.score);

  const needRemedial = remedialDetails.map((rd) => ({
    name: rd.name,
    score: rd.score,
    deficientTypes: rd.deficientTypes,
  }));

  // Enrichment breakdown for high achievers (>= KKM)
  const enrichmentDetails = rows
    .filter((r) => r.isPassed)
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((r) => {
      let suggestedActivity = 'Pendalaman materi aplikasi dan problem solving';
      if (r.totalScore >= 90) {
        suggestedActivity = 'Diberdayakan sebagai Tutor Sebaya bagi rekan yang remedial';
      } else if (r.totalScore >= 80) {
        suggestedActivity = 'Pemberian soal tantangan HOTS dan studi kasus fikih kontekstual';
      } else {
        suggestedActivity = 'Tugas bacaan pengayaan bab berikutnya dan latihan mandiri';
      }

      return {
        studentId: r.studentId,
        nis: `2024${r.studentId.replace(/\D/g, '').slice(-4).padStart(4, '0')}`,
        name: r.studentName,
        score: r.totalScore,
        suggestedActivity,
      };
    });

  const questionAnalyses = computeQuestionAnalyses(rows, config);

  const qualitySummary = {
    accepted: questionAnalyses.filter((q) => q.itemRecommendation === 'Diterima').length,
    revised: questionAnalyses.filter((q) => q.itemRecommendation === 'Diterima & Direvisi').length,
    rejected: questionAnalyses.filter((q) => q.itemRecommendation === 'Ditolak / Dibuang').length,
    easyCount: questionAnalyses.filter((q) => q.difficultyCategory === 'Mudah').length,
    mediumCount: questionAnalyses.filter((q) => q.difficultyCategory === 'Sedang').length,
    hardCount: questionAnalyses.filter((q) => q.difficultyCategory === 'Sukar').length,
  };

  const hardestQuestions = [...questionAnalyses]
    .sort((a, b) => a.difficultyIndex - b.difficultyIndex)
    .slice(0, 3);

  const easiestQuestions = [...questionAnalyses]
    .sort((a, b) => b.difficultyIndex - a.difficultyIndex)
    .slice(0, 3);

  return {
    totalStudents,
    averageScore: Number(averageScore.toFixed(1)),
    highestScore,
    lowestScore,
    medianScore: Number(medianScore.toFixed(1)),
    standardDeviation: Number(standardDeviation.toFixed(2)),
    passedCount,
    failedCount,
    passPercentage,
    gradeDistribution,
    topStudents,
    needRemedial,
    remedialDetails,
    enrichmentDetails,
    qualitySummary,
    questionAnalyses,
    hardestQuestions,
    easiestQuestions,
  };
}
