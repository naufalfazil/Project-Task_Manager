
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

// GET: mengambil semua tugas
export async function GET() {
  try {
    const pool = getPool();

    const [rows] = await pool.query(
      `SELECT
        id,
        title,
        description,
        deadline,
        priority,
        status,
        created_at,
        updated_at
      FROM tasks
      ORDER BY id DESC`
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Gagal mengambil tugas:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil daftar tugas",
      },
      { status: 500 }
    );
  }
}

// POST: menambahkan tugas baru
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { title, description, deadline, priority, status } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Judul tugas wajib diisi",
        },
        { status: 400 }
      );
    }

    const pool = getPool();

    const [result] = await pool.execute(
      `INSERT INTO tasks
        (title, description, deadline, priority, status)
      VALUES (?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description || null,
        deadline || null,
        priority || "Sedang",
        status || "Belum Dikerjakan",
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Tugas berhasil ditambahkan",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal menambahkan tugas:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menambahkan tugas",
      },
      { status: 500 }
    );
  }
}
