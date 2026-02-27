"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Task,
  TaskColumn,
  TaskPriority,
  TaskCategory,
  Project,
} from "@/types/database";

interface TaskFormProps {
  task?: Task;
  columns: TaskColumn[];
  projects: Project[];
  defaultColumnId?: string;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
}

export interface TaskFormData {
  title: string;
  description: string;
  project_id: string;
  column_id: string;
  priority: TaskPriority;
  category: TaskCategory | "";
  due_date: string;
  labels: string[];
}

const priorities: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
  { value: "urgent", label: "Срочный" },
];

const categories: { value: TaskCategory; label: string }[] = [
  { value: "smm", label: "SMM" },
  { value: "target", label: "Таргет" },
  { value: "seo", label: "SEO" },
  { value: "email", label: "Email" },
  { value: "influencer", label: "Инфлюенсер" },
  { value: "design", label: "Дизайн" },
  { value: "content", label: "Контент" },
  { value: "other", label: "Другое" },
];

export function TaskForm({
  task,
  columns,
  projects,
  defaultColumnId,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<TaskFormData>({
    title: task?.title ?? "",
    description: task?.description ?? "",
    project_id: task?.project_id ?? (projects[0]?.id ?? ""),
    column_id: task?.column_id ?? defaultColumnId ?? (columns[0]?.id ?? ""),
    priority: task?.priority ?? "medium",
    category: task?.category ?? "",
    due_date: task?.due_date?.split("T")[0] ?? "",
    labels: task?.labels ?? [],
  });
  const [labelInput, setLabelInput] = useState("");

  function update<K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addLabel() {
    const tag = labelInput.trim();
    if (tag && !form.labels.includes(tag)) {
      update("labels", [...form.labels, tag]);
    }
    setLabelInput("");
  }

  function removeLabel(label: string) {
    update("labels", form.labels.filter((l) => l !== label));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.project_id) return;
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="mb-1 block text-sm font-medium">Название *</label>
        <input
          className={inputCls}
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Что нужно сделать?"
          required
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-sm font-medium">Описание</label>
        <textarea
          className={cn(inputCls, "min-h-[80px] resize-y")}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Подробности задачи..."
        />
      </div>

      {/* Project + Column row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Проект *</label>
          <select
            className={inputCls}
            value={form.project_id}
            onChange={(e) => update("project_id", e.target.value)}
            required
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.short_name || p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Колонка</label>
          <select
            className={inputCls}
            value={form.column_id}
            onChange={(e) => update("column_id", e.target.value)}
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Priority + Category row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Приоритет</label>
          <select
            className={inputCls}
            value={form.priority}
            onChange={(e) => update("priority", e.target.value as TaskPriority)}
          >
            {priorities.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Категория</label>
          <select
            className={inputCls}
            value={form.category}
            onChange={(e) => update("category", e.target.value as TaskCategory | "")}
          >
            <option value="">— Не выбрана</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Due date */}
      <div>
        <label className="mb-1 block text-sm font-medium">Дедлайн</label>
        <input
          type="date"
          className={inputCls}
          value={form.due_date}
          onChange={(e) => update("due_date", e.target.value)}
        />
      </div>

      {/* Labels */}
      <div>
        <label className="mb-1 block text-sm font-medium">Теги</label>
        <div className="flex gap-2">
          <input
            className={cn(inputCls, "flex-1")}
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLabel();
              }
            }}
            placeholder="Введите тег и Enter"
          />
          <button
            type="button"
            onClick={addLabel}
            className="rounded-lg bg-[var(--muted)] px-3 py-2 text-sm hover:bg-[var(--border)]"
          >
            +
          </button>
        </div>
        {form.labels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {form.labels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {label}
                <button
                  type="button"
                  onClick={() => removeLabel(label)}
                  className="ml-0.5 hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-[var(--muted)]"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={loading || !form.title.trim()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {task ? "Сохранить" : "Создать"}
        </button>
      </div>
    </form>
  );
}
