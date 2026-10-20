
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pool = getPool();

    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total FROM tasks"
    );

    return NextResponse.json({
      success: true,
      message: "Koneksi MySQL berhasil!",
      data: rows,
    });
  } catch (error) {
    console.error("Database test failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Koneksi database gagal. Periksa konfigurasi dan terminal.",
      },
      { status: 500 }
    );
  }
}
