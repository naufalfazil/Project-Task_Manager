
"use client";

import { useCallback, useEffect, useState } from "react";

type Task = {
  id: number;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: "Rendah" | "Sedang" | "Tinggi";
  status: "Belum Dikerjakan" | "Sedang Dikerjakan" | "Selesai";
};

const STATUSES: Task["status"][] = [
  "Belum Dikerjakan",
  "Sedang Dikerjakan",
  "Selesai",
];

const PRIORITIES: Task["priority"][] = [
  "Rendah",
  "Sedang",
  "Tinggi",
];

function formatDate(date: string | null) {
  if (!date) return "Tidak ada deadline";

  const dateOnly = date.slice(0, 10);
  const parts = dateOnly.split("-");

  if (parts.length !== 3) return dateOnly;

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  ).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getPriorityStyle(priority: Task["priority"]) {
  switch (priority) {
    case "Tinggi":
      return "bg-red-100 text-red-700";
    case "Sedang":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-green-100 text-green-700";
  }
}

function getStatusStyle(status: Task["status"]) {
  switch (status) {
    case "Selesai":
      return "bg-green-100 text-green-700";
    case "Sedang Dikerjakan":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] =
    useState<Task["priority"]>("Sedang");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [editingTaskId, setEditingTaskId] =
    useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPriority, setEditPriority] =
    useState<Task["priority"]>("Sedang");
  const [savingEdit, setSavingEdit] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/tasks");
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Gagal mengambil daftar tugas."
        );
      }

      setTasks(result.data || []);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengambil tugas."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  async function addTask(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    if (!title.trim()) {
      setMessage("Judul tugas wajib diisi.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          deadline: deadline || null,
          priority,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Gagal menambahkan tugas."
        );
      }

      setTitle("");
      setDescription("");
      setDeadline("");
      setPriority("Sedang");
      setMessage("Tugas berhasil ditambahkan!");

      await loadTasks();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menambahkan tugas."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    taskId: number,
    status: Task["status"]
  ) {
    setMessage("");

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Gagal memperbarui status tugas."
        );
      }

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId ? { ...task, status } : task
        )
      );

      setMessage("Status tugas berhasil diperbarui!");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Gagal memperbarui status."
      );
    }
  }

  function startEdit(task: Task) {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditDeadline(task.deadline?.slice(0, 10) || "");
    setEditPriority(task.priority);
    setMessage("");
  }

  function cancelEdit() {
    setEditingTaskId(null);
    setEditTitle("");
    setEditDescription("");
    setEditDeadline("");
    setEditPriority("Sedang");
  }

  async function saveEdit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (editingTaskId === null) return;

    if (!editTitle.trim()) {
      setMessage("Judul tugas wajib diisi.");
      return;
    }

    try {
      setSavingEdit(true);
      setMessage("");

      const response = await fetch(
        `/api/tasks/${editingTaskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editTitle.trim(),
            description: editDescription.trim(),
            deadline: editDeadline || null,
            priority: editPriority,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Gagal mengedit tugas."
        );
      }

      cancelEdit();
      setMessage("Tugas berhasil diperbarui!");
      await loadTasks();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengedit tugas."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteTask(taskId: number) {
    const confirmed = window.confirm(
      "Apakah kamu yakin ingin menghapus tugas ini?"
    );

    if (!confirmed) return;

    setMessage("");

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Gagal menghapus tugas."
        );
      }

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId)
      );

      if (editingTaskId === taskId) {
        cancelEdit();
      }

      setMessage("Tugas berhasil dihapus!");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus tugas."
      );
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Task Manager
          </h1>
          <p className="mt-2 text-gray-500">
            Atur tugasmu, tentukan prioritas, dan selesaikan
            semuanya tepat waktu.
          </p>
        </header>

        {/* Pesan */}
        {message && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
          >
            {message}
            <button
              type="button"
              onClick={() => setMessage("")}
              className="float-right ml-3 font-bold"
              aria-label="Tutup pesan"
            >
              ×
            </button>
          </div>
        )}

        {/* Form Tambah Tugas */}
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            Tambah Tugas
          </h2>

          <form onSubmit={addTask} className="space-y-5">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Judul Tugas
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Masukkan judul tugas"
                required
                maxLength={200}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Deskripsi
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Masukkan deskripsi tugas (opsional)"
                rows={3}
                className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="deadline"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Deadline
              </label>
              <input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(event) =>
                  setDeadline(event.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="priority"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Prioritas
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value as Task["priority"]
                  )
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-blue-100"
              >
                {PRIORITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-green-800 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Menyimpan..." : "Tambah Tugas"}
            </button>
          </form>
        </section>

        {/* Daftar Tugas */}
        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Daftar Tugas
              <span className="ml-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                {tasks.length}
              </span>
            </h2>

          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500">
              Memuat daftar tugas...
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
              <h3 className="font-semibold text-gray-800">
                Belum ada tugas
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Tambahkan tugas pertamamu melalui form di atas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`break-words text-lg font-semibold ${
                          task.status === "Selesai"
                            ? "text-gray-400 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                            task.priority
                          )}`}
                        >
                          Prioritas: {task.priority}
                        </span>

                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-gray-600">
                          {formatDate(task.deadline)}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                      <button
                        type="button"
                        onClick={() => startEdit(task)}
                        className="rounded-lg border border-green-600 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => void deleteTask(task.id)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>

                  {/* Status diatur dari daftar tugas */}
                  <div className="mt-5 flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Status tugas
                    </span>

                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>

                      <select
                        aria-label={`Ubah status tugas ${task.title}`}
                        value={task.status}
                        onChange={(event) =>
                          void updateStatus(
                            task.id,
                            event.target.value as Task["status"]
                          )
                        }
                        className="min-w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Modal Edit */}
        {editingTaskId !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                cancelEdit();
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-heading"
              className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8"
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2
                  id="edit-heading"
                  className="text-xl font-bold text-gray-900"
                >
                  Edit Tugas
                </h2>

                <button
                  type="button"
                  onClick={cancelEdit}
                  aria-label="Tutup formulir edit"
                  className="rounded-lg px-3 py-1 text-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <form onSubmit={saveEdit} className="space-y-5">
                <div>
                  <label
                    htmlFor="edit-title"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Judul Tugas
                  </label>
                  <input
                    id="edit-title"
                    type="text"
                    value={editTitle}
                    onChange={(event) =>
                      setEditTitle(event.target.value)
                    }
                    maxLength={200}
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-description"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Deskripsi
                  </label>
                  <textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(event) =>
                      setEditDescription(event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-deadline"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Deadline
                  </label>
                  <input
                    id="edit-deadline"
                    type="date"
                    value={editDeadline}
                    onChange={(event) =>
                      setEditDeadline(event.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-priority"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Prioritas
                  </label>
                  <select
                    id="edit-priority"
                    value={editPriority}
                    onChange={(event) =>
                      setEditPriority(
                        event.target.value as Task["priority"]
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {PRIORITIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-xs text-gray-500">
                  Untuk mengubah status, gunakan pilihan status pada
                  kartu tugas di daftar tugas.
                </p>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={savingEdit}
                    className="rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
