import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let isInitialized = false;

export function getDbPool(): pg.Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected Postgres client error:", err);
    });
  }

  return pool;
}

export async function checkDbConnection(): Promise<{
  connected: boolean;
  version?: string;
  error?: string;
}> {
  const p = getDbPool();
  if (!p) {
    return {
      connected: false,
      error: "DATABASE_URL environment variable is not configured.",
    };
  }

  try {
    const res = await p.query("SELECT version()");
    return {
      connected: true,
      version: res.rows[0]?.version,
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || "Failed to connect to PostgreSQL / Neon DB",
    };
  }
}

export async function initializeDatabase(): Promise<boolean> {
  const p = getDbPool();
  if (!p || isInitialized) return false;

  try {
    const client = await p.connect();
    try {
      await client.query("BEGIN");

      // 1. master_students
      await client.query(`
        CREATE TABLE IF NOT EXISTS master_students (
          id VARCHAR(64) PRIMARY KEY,
          nis VARCHAR(64),
          name VARCHAR(255) NOT NULL,
          gender VARCHAR(10) DEFAULT 'L',
          class_name VARCHAR(64) NOT NULL,
          phone VARCHAR(64),
          active BOOLEAN DEFAULT TRUE,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. master_teachers
      await client.query(`
        CREATE TABLE IF NOT EXISTS master_teachers (
          id VARCHAR(64) PRIMARY KEY,
          nip VARCHAR(64),
          name VARCHAR(255) NOT NULL,
          role VARCHAR(64) DEFAULT 'Guru Pengampu',
          subject VARCHAR(128),
          assigned_class VARCHAR(64),
          phone VARCHAR(64),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. master_classes
      await client.query(`
        CREATE TABLE IF NOT EXISTS master_classes (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(64) NOT NULL,
          level VARCHAR(128),
          academic_year VARCHAR(64),
          wali_kelas_name VARCHAR(255),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 4. master_subjects
      await client.query(`
        CREATE TABLE IF NOT EXISTS master_subjects (
          id VARCHAR(64) PRIMARY KEY,
          code VARCHAR(64),
          name VARCHAR(255) NOT NULL,
          category VARCHAR(64),
          kkm_default INTEGER DEFAULT 75,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 5. exam_archives
      await client.query(`
        CREATE TABLE IF NOT EXISTS exam_archives (
          id VARCHAR(64) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          class_name VARCHAR(64) NOT NULL,
          subject VARCHAR(128) NOT NULL,
          semester VARCHAR(32),
          academic_year VARCHAR(64),
          teacher_name VARCHAR(255),
          exam_date VARCHAR(64),
          date_location VARCHAR(128),
          date_hijri VARCHAR(64),
          kkm INTEGER DEFAULT 75,
          max_score INTEGER DEFAULT 100,
          data_json JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 6. app_state
      await client.query(`
        CREATE TABLE IF NOT EXISTS app_state (
          key VARCHAR(64) PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query("COMMIT");
      isInitialized = true;
      console.log("PostgreSQL / Neon DB Schema initialized successfully.");
      return true;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error initializing PostgreSQL / Neon DB tables:", err);
    return false;
  }
}
