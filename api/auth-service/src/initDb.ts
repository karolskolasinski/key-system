import pool from "./db";

const createTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `);
    console.info("table 'users' already exists.");
  } catch (error) {
    console.error("creating table 'users' error", error);
  }
};

export default createTable;
