
import mysql from "mysql2/promise";

let pool: mysql.Pool | undefined;

export function getPool(): mysql.Pool {
  if (!pool) {
    const requiredEnv = [
      "DB_HOST",
      "DB_PORT",
      "DB_USER",
      "DB_PASSWORD",
      "DB_NAME",
    ];

    for (const key of requiredEnv) {
      if (!process.env[key]) {
        throw new Error(`Environment variable ${key} belum diisi`);
      }
    }

    const sslConfig = process.env.DB_CA_CERT
      ? {
          ca: Buffer.from(
            process.env.DB_CA_CERT,
            "base64"
          ).toString("utf-8"),
          rejectUnauthorized: true,
        }
      : undefined;

    if (!sslConfig) {
      throw new Error("DB_CA_CERT belum diatur untuk koneksi SSL");
    }

    pool = mysql.createPool({
      host: process.env.DB_HOST!,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
      ssl: sslConfig,
      waitForConnections: true,
      connectionLimit: 5,
      maxIdle: 5,
      idleTimeout: 60000,
    });
  }

  return pool;
}
