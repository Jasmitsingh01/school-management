import { createPool } from 'mysql2/promise';




const pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME,
  waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0')
});
export async function executeQuery({ query, values }:{ query: string; values?: (string | number | Date | boolean | undefined)[] }) {
  try {
    const [results] = await pool.execute(query, values);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

const createSchoolsTable = `
  CREATE TABLE IF NOT EXISTS schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    contact VARCHAR(15) NOT NULL,
    image TEXT NOT NULL,
    email_id VARCHAR(100) NOT NULL
  )
`;

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`;

const createOtpTable = `
  CREATE TABLE IF NOT EXISTS otp_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_otp (email, otp_code),
    INDEX idx_expires_at (expires_at)
  )
`;

export async function initializeDatabase() {
  try {
    await executeQuery({ query: createSchoolsTable });
    await executeQuery({ query: createUsersTable });
    await executeQuery({ query: createOtpTable });
    
    try {
      const columnCheck = await executeQuery({
        query: `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verified'`,
        values: [process.env.DB_NAME]
      }) as Array<{ COLUMN_NAME: string }>;
      
      if (columnCheck.length === 0) {
        await executeQuery({ 
          query: `ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE` 
        });
      }
    } catch (alterError) {
    }
    
    try {
      const schoolsColumnCheck = await executeQuery({
        query: `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'schools' AND COLUMN_NAME = 'created_by'`,
        values: [process.env.DB_NAME]
      }) as Array<{ COLUMN_NAME: string }>;
      
      if (schoolsColumnCheck.length === 0) {
        await executeQuery({ 
          query: `ALTER TABLE schools ADD COLUMN created_by INT, ADD FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL` 
        });
      }
    } catch (alterError) {
    }
  } catch (error) {
      throw error;
    }
}

initializeDatabase().catch(console.error);