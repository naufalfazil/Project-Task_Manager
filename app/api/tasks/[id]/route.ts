import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

type Context = {
    params: Promise<{ id: string }>;
};

// Mengubah status tugas
export async function PATCH(
    request: Request,
    { params }: Context
) {
    try {
        const { id } = await params;
        const taskId = Number(id);

    if (!Number.isInteger(taskId) || taskId < 1) {
        return NextResponse.json(
            { success: false, message: "ID tugas tidak valid" },
            { status: 400 }
        );
    }

    const body = await request.json();
    const allowedStatuses = [
        "Belum Dikerjakan",
        "Sedang Dikerjakan",
        "Selesai",
    ];

    if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
            { success: false, message: "Status tidak valid" },
            { status: 400 }
        );
    }

    const pool = getPool();

    const [result] = await pool.execute(
        "UPDATE tasks SET status = ? WHERE id = ?",
        [body.status, taskId]
    );

    const affectedRows = (
        result as { affectedRows: number }
    ).affectedRows;

    if (affectedRows === 0) {
        const [rows] = await pool.execute(
            "SELECT id FROM tasks WHERE id = ?",
            [taskId]
        );

        const existing = rows as { id: number }[];

        if (existing.length === 0) {
            return NextResponse.json(
                { success: false, message: "Tugas tidak ditemukan" },
                { status: 404 }
            );
        }
    }

    return NextResponse.json({
        success: true,
        message: "Status tugas berhasil diperbarui",
    });
    } catch (error) {
        console.error("Gagal mengubah status:", error);

    return NextResponse.json(
        { success: false, message: "Gagal mengubah status tugas" },
        { status: 500 }
    );
    }
}


export async function PUT(
    request: Request,
  {  params }: Context
) {
    try {
        const { id } = await params;
        const taskId = Number(id);

    if (!Number.isInteger(taskId) || taskId < 1) {
        return NextResponse.json(
            { success: false, message: "ID tugas tidak valid" },
            { status: 400 }
        );
    }

    const body = await request.json();
    const { title, description, deadline, priority } = body;

    if (
        typeof title !== "string" ||
        !title.trim()
    ) {
        return NextResponse.json(
            { success: false, message: "Judul tugas wajib diisi" },
            { status: 400 }
        );
    }

    const allowedPriorities = ["Rendah", "Sedang", "Tinggi"];

    if (!allowedPriorities.includes(priority)) {
        return NextResponse.json(
            { success: false, message: "Prioritas tidak valid" },
            { status: 400 }
        );
    }

    if (
        deadline &&
        (typeof deadline !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(deadline) ||
            Number.isNaN(Date.parse(deadline)))
    ) {
    return NextResponse.json(
        { success: false, message: "Format deadline tidak valid" },
        { status: 400 }
    );
    }

    if (
        description != null &&
        typeof description !== "string"
    ) {
        return NextResponse.json(
            { success: false, message: "Deskripsi tidak valid" },
            { status: 400 }
        );
    }

    const pool = getPool();

    const [result] = await pool.execute(
        `UPDATE tasks
        SET title = ?, description = ?, deadline = ?, priority = ?
        WHERE id = ?`,
    [
        title.trim(),
        description?.trim() || null,
        deadline || null,
        priority,
        taskId,
    ]
    );

    const affectedRows = (
        result as { affectedRows: number }
    ).affectedRows;

    if (affectedRows === 0) {
        const [rows] = await pool.execute(
            "SELECT id FROM tasks WHERE id = ?",
            [taskId]
        );

        if ((rows as { id: number }[]).length === 0) {
            return NextResponse.json(
                { success: false, message: "Tugas tidak ditemukan" },
                { status: 404 }
            );
        }
    }

    return NextResponse.json({
        success: true,
        message: "Tugas berhasil diperbarui",
    });
    } catch (error) {
        console.error("Gagal mengedit tugas:", error);

    return NextResponse.json(
        { success: false, message: "Gagal mengedit tugas" },
        { status: 500 }
        );
    }
}


// Menghapus tugas
export async function DELETE(
    request: Request,
    { params }: Context
) {
    try {
        const { id } = await params;
        const taskId = Number(id);

    if (!Number.isInteger(taskId) || taskId < 1) {
        return NextResponse.json(
            { success: false, message: "ID tugas tidak valid" },
            { status: 400 }
        );
    }

    const pool = getPool();

    const [result] = await pool.execute(
        "DELETE FROM tasks WHERE id = ?",
        [taskId]
    );

    const affectedRows = (
        result as { affectedRows: number }
    ).affectedRows;

    if (affectedRows === 0) {
        return NextResponse.json(
            { success: false, message: "Tugas tidak ditemukan" },
            { status: 404 }
        );
    }

    return NextResponse.json({
        success: true,
        message: "Tugas berhasil dihapus",
    });
    } catch (error) {
        console.error("Gagal menghapus tugas:", error);

    return NextResponse.json(
        { success: false, message: "Gagal menghapus tugas" },
        { status: 500 }
        );
    }
}
