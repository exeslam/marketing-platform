"use client";

import { useState, useEffect, useTransition, useCallback, useRef, useMemo, memo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Filter,
  LayoutGrid,
  List,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  GripVertical,
  X,
} from "lucide-react";
import {
  cn,
  formatDate,
  getTaskPriorityLabel,
  getTaskCategoryLabel,
  getInitials,
} from "@/lib/utils";
import type { Task, TaskColumn, Project } from "@/types/database";
import { Modal } from "@/components/ui/modal";
import { TaskForm, type TaskFormData } from "./task-form";
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  moveTaskAction,
} from "@/lib/actions";

type ViewMode = "kanban" | "list";

interface TasksBoardProps {
  columns: TaskColumn[];
  tasksByColumn: Record<string, Task[]>;
  projectMap: Record<string, { name: string; color: string }>;
  projects: Project[];
}

const priorityBadgeStyles: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  medium: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  high: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  urgent: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
};

const priorityDotColors: Record<string, string> = {
  low: "#6B7280", medium: "#3B82F6", high: "#F59E0B", urgent: "#EF4444",
};

const categoryBadgeStyles: Record<string, string> = {
  smm: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400",
  target: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  seo: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  email: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
  design: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  content: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
};

const categoryDotColors: Record<string, string> = {
  smm: "#EC4899", target: "#8B5CF6", seo: "#059669", email: "#0EA5E9", design: "#F59E0B", content: "#2563EB",
};

// ── Sortable Task Card ──────────────────────────────────────────────

const SortableTaskCard = memo(function SortableTaskCard({ task, projectMap, onEdit, onDelete }: {
  task: Task; projectMap: Record<string, { name: string; color: string }>; onEdit: (t: Task) => void; onDelete: (t: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCardContent task={task} projectMap={projectMap} onEdit={onEdit} onDelete={onDelete} dragListeners={listeners} />
    </div>
  );
});

// ── Task Card Content ───────────────────────────────────────────────

function TaskCardContent({ task, projectMap, onEdit, onDelete, dragListeners }: {
  task: Task; projectMap: Record<string, { name: string; color: string }>; onEdit: (t: Task) => void; onDelete: (t: Task) => void;
  dragListeners?: Record<string, unknown>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const project = projectMap[task.project_id];
  const assigneeName = task.assignee?.full_name ?? "";

  return (
    <div className="group relative rounded-lg border bg-[var(--card)] p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button className="cursor-grab touch-none rounded p-0.5 text-[var(--muted-foreground)] opacity-0 transition-opacity hover:bg-[var(--muted)] group-hover:opacity-100" {...dragListeners}>
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", priorityBadgeStyles[task.priority] ?? "bg-gray-100 text-gray-700")}>
            {getTaskPriorityLabel(task.priority)}
          </span>
          {task.category && (
            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", categoryBadgeStyles[task.category] ?? "bg-gray-100 text-gray-700")}>
              {getTaskCategoryLabel(task.category)}
            </span>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded p-0.5 opacity-0 transition-opacity hover:bg-[var(--muted)] group-hover:opacity-100">
            <MoreVertical className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-6 z-20 min-w-[140px] rounded-lg border bg-[var(--card)] py-1 shadow-lg">
                <button onClick={() => { setMenuOpen(false); onEdit(task); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--muted)]">
                  <Pencil className="h-3.5 w-3.5" /> Редактировать
                </button>
                <button onClick={() => { setMenuOpen(false); onDelete(task); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-[var(--muted)]">
                  <Trash2 className="h-3.5 w-3.5" /> Удалить
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="mb-2 cursor-pointer text-sm font-medium leading-snug hover:text-primary" onClick={() => onEdit(task)}>{task.title}</p>

      {project && (
        <div className="mb-2 flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />
          <span className="text-xs text-[var(--muted-foreground)]">{project.name}</span>
        </div>
      )}

      {task.labels && task.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.labels.map((label) => <span key={label} className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">{label}</span>)}
        </div>
      )}

      <div className="flex items-center gap-2">
        {assigneeName && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">{getInitials(assigneeName)}</div>
        )}
        {task.due_date && (
          <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]"><Clock className="h-3 w-3" />{formatDate(task.due_date)}</span>
        )}
      </div>
    </div>
  );
}

// ── Droppable Column ────────────────────────────────────────────────

const DroppableColumn = memo(function DroppableColumn({ column, tasks, projectMap, onEdit, onDelete, onAddTask }: {
  column: TaskColumn; tasks: Task[]; projectMap: Record<string, { name: string; color: string }>;
  onEdit: (t: Task) => void; onDelete: (t: Task) => void; onAddTask: (colId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: `column-${column.id}`, data: { type: "column", column } });

  return (
    <div ref={setNodeRef} className="w-[300px] shrink-0 rounded-xl bg-[var(--muted)] p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: column.color ?? "#94A3B8" }} />
          <h3 className="text-sm font-semibold">{column.name}</h3>
          <span className="rounded-full bg-[var(--card)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">{tasks.length}</span>
        </div>
        <button onClick={() => onAddTask(column.id)} className="rounded p-1 hover:bg-[var(--card)]">
          <Plus className="h-4 w-4 text-[var(--muted-foreground)]" />
        </button>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="min-h-[40px] space-y-2">
          {tasks.map((task) => <SortableTaskCard key={task.id} task={task} projectMap={projectMap} onEdit={onEdit} onDelete={onDelete} />)}
        </div>
      </SortableContext>
      {tasks.length === 0 && <p className="py-6 text-center text-xs text-[var(--muted-foreground)]">Нет задач</p>}
    </div>
  );
});

// ── Main Board ──────────────────────────────────────────────────────

export function TasksBoard({ columns, tasksByColumn: initialTasksByColumn, projectMap, projects }: TasksBoardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [modalMode, setModalMode] = useState<"create" | "edit" | "delete" | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterProject, setFilterProject] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const hasFilters = filterProject || filterPriority || filterCategory;

  const filteredTasksByColumn = useMemo(() => {
    if (!hasFilters) return initialTasksByColumn;
    const result: Record<string, Task[]> = {};
    for (const [colId, tasks] of Object.entries(initialTasksByColumn)) {
      result[colId] = tasks.filter((t) => {
        if (filterProject && t.project_id !== filterProject) return false;
        if (filterPriority && t.priority !== filterPriority) return false;
        if (filterCategory && t.category !== filterCategory) return false;
        return true;
      });
    }
    return result;
  }, [initialTasksByColumn, filterProject, filterPriority, filterCategory, hasFilters]);

  const [localTasksByColumn, setLocalTasksByColumn] = useState(filteredTasksByColumn);
  const localRef = useRef(localTasksByColumn);
  localRef.current = localTasksByColumn;

  // Sync server→local when not dragging
  useEffect(() => {
    if (!activeTask) {
      setLocalTasksByColumn(filteredTasksByColumn);
    }
  }, [filteredTasksByColumn, activeTask]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function findColumnForTaskIn(state: Record<string, Task[]>, taskId: string): string | null {
    for (const [colId, tasks] of Object.entries(state)) {
      if (tasks.some((t) => t.id === taskId)) return colId;
    }
    return null;
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (event.active.data.current?.type === "task") {
      setActiveTask(event.active.data.current.task);
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    setLocalTasksByColumn((prev) => {
      const activeColId = findColumnForTaskIn(prev, activeId);
      const overColId = overId.startsWith("column-") ? overId.replace("column-", "") : findColumnForTaskIn(prev, overId);
      if (!activeColId || !overColId || activeColId === overColId) return prev;

      const from = [...(prev[activeColId] ?? [])];
      const to = [...(prev[overColId] ?? [])];
      const idx = from.findIndex((t) => t.id === activeId);
      if (idx === -1) return prev;
      const [moved] = from.splice(idx, 1);
      const overIdx = overId.startsWith("column-") ? to.length : to.findIndex((t) => t.id === overId);
      to.splice(overIdx >= 0 ? overIdx : to.length, 0, moved);
      return { ...prev, [activeColId]: from, [overColId]: to };
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    const current = localRef.current;
    const colId = findColumnForTaskIn(current, activeId);
    if (!colId) return;

    const tasks = current[colId] ?? [];
    const activeIndex = tasks.findIndex((t) => t.id === activeId);
    const overIndex = overId.startsWith("column-") ? tasks.length - 1 : tasks.findIndex((t) => t.id === overId);

    if (activeIndex !== overIndex && overIndex >= 0) {
      setLocalTasksByColumn((prev) => {
        const col = [...(prev[colId] ?? [])];
        const [moved] = col.splice(activeIndex, 1);
        col.splice(overIndex, 0, moved);
        return { ...prev, [colId]: col };
      });
    }

    startTransition(async () => { await moveTaskAction(activeId, colId, Math.max(overIndex, 0)); });
  }, [startTransition]);

  const openCreate = useCallback((columnId?: string) => { setSelectedTask(null); setDefaultColumnId(columnId ?? columns[0]?.id ?? ""); setModalMode("create"); }, [columns]);
  const openEdit = useCallback((task: Task) => { setSelectedTask(task); setModalMode("edit"); }, []);
  const openDelete = useCallback((task: Task) => { setSelectedTask(task); setModalMode("delete"); }, []);
  const closeModal = useCallback(() => { setModalMode(null); setSelectedTask(null); }, []);

  async function handleCreate(data: TaskFormData) {
    const maxSort = Math.max(0, ...(localTasksByColumn[data.column_id] ?? []).map((t) => t.sort_order));
    await createTaskAction({ title: data.title, description: data.description || null, project_id: data.project_id, column_id: data.column_id, priority: data.priority, category: data.category || null, due_date: data.due_date || null, start_date: null, completed_at: null, assignee_id: null, created_by: "", sort_order: maxSort + 1, labels: data.labels });
    closeModal();
  }

  async function handleUpdate(data: TaskFormData) {
    if (!selectedTask) return;
    await updateTaskAction(selectedTask.id, { title: data.title, description: data.description || null, project_id: data.project_id, column_id: data.column_id, priority: data.priority, category: data.category || null, due_date: data.due_date || null, labels: data.labels });
    closeModal();
  }

  async function handleDelete() {
    if (!selectedTask) return;
    startTransition(async () => { await deleteTaskAction(selectedTask.id); closeModal(); });
  }

  const allTasksFlat = useMemo(
    () => columns.flatMap((col) => (filteredTasksByColumn[col.id] ?? []).map((task) => ({ task, column: col }))),
    [columns, filteredTasksByColumn]
  );

  return (
    <div className="p-4 md:p-6">
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-[var(--card)] p-1">
          {([{ key: "kanban", icon: LayoutGrid, label: "Канбан" }, { key: "list", icon: List, label: "Список" }] as const).map((view) => (
            <button key={view.key} onClick={() => setViewMode(view.key)} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors", viewMode === view.key ? "bg-primary text-white" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]")}>
              <view.icon className="h-4 w-4" /><span className="hidden sm:inline">{view.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFiltersOpen(!filtersOpen)} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-[var(--muted)]", hasFilters && "border-primary text-primary")}>
            <Filter className="h-4 w-4" /> Фильтры {hasFilters && <span className="rounded-full bg-primary px-1.5 text-[10px] text-white">!</span>}
          </button>
          {hasFilters && (
            <button onClick={() => { setFilterProject(""); setFilterPriority(""); setFilterCategory(""); }} className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)]" title="Сбросить фильтры">
              <X className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => openCreate()} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"><Plus className="h-4 w-4" /> Новая задача</button>
        </div>
      </div>

      {/* Filters */}
      {filtersOpen && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-[var(--card)] p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Проект</label>
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="rounded-lg border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary">
              <option value="">Все</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Приоритет</label>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="rounded-lg border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary">
              <option value="">Все</option>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="urgent">Срочный</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Категория</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-lg border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary">
              <option value="">Все</option>
              <option value="smm">SMM</option>
              <option value="target">Таргет</option>
              <option value="seo">SEO</option>
              <option value="email">Email</option>
              <option value="design">Дизайн</option>
              <option value="content">Контент</option>
            </select>
          </div>
        </div>
      )}

      {/* Kanban */}
      {viewMode === "kanban" && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((col) => <DroppableColumn key={col.id} column={col} tasks={localTasksByColumn[col.id] ?? []} projectMap={projectMap} onEdit={openEdit} onDelete={openDelete} onAddTask={openCreate} />)}
          </div>
          <DragOverlay>{activeTask && <div className="w-[280px]"><TaskCardContent task={activeTask} projectMap={projectMap} onEdit={() => {}} onDelete={() => {}} /></div>}</DragOverlay>
        </DndContext>
      )}

      {/* List */}
      {viewMode === "list" && (
        <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
          {allTasksFlat.length === 0 ? <p className="py-10 text-center text-sm text-[var(--muted-foreground)]">Задач пока нет</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left">
                  <th className="pb-3 pr-4 font-medium text-[var(--muted-foreground)]">Задача</th>
                  <th className="pb-3 pr-4 font-medium text-[var(--muted-foreground)]">Проект</th>
                  <th className="pb-3 pr-4 font-medium text-[var(--muted-foreground)]">Исполнитель</th>
                  <th className="pb-3 pr-4 font-medium text-[var(--muted-foreground)]">Приоритет</th>
                  <th className="pb-3 pr-4 font-medium text-[var(--muted-foreground)]">Категория</th>
                  <th className="pb-3 pr-4 font-medium text-[var(--muted-foreground)]">Статус</th>
                  <th className="pb-3 pr-4 font-medium text-[var(--muted-foreground)]">Дедлайн</th>
                  <th className="pb-3 font-medium text-[var(--muted-foreground)]"></th>
                </tr></thead>
                <tbody>
                  {allTasksFlat.map(({ task, column }) => {
                    const project = projectMap[task.project_id];
                    const name = task.assignee?.full_name ?? "";
                    return (
                      <tr key={task.id} className="border-b last:border-0 hover:bg-[var(--muted)]">
                        <td className="py-3 pr-4"><span className="cursor-pointer font-medium hover:text-primary" onClick={() => openEdit(task)}>{task.title}</span></td>
                        <td className="py-3 pr-4">{project && <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} /><span>{project.name}</span></div>}</td>
                        <td className="py-3 pr-4">{name && <div className="flex items-center gap-2"><div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">{getInitials(name)}</div><span>{name}</span></div>}</td>
                        <td className="py-3 pr-4"><span className={cn("inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs font-medium", priorityBadgeStyles[task.priority])}><span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: priorityDotColors[task.priority] }} />{getTaskPriorityLabel(task.priority)}</span></td>
                        <td className="py-3 pr-4">{task.category && <span className={cn("inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs font-medium", categoryBadgeStyles[task.category])}><span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: categoryDotColors[task.category] }} />{getTaskCategoryLabel(task.category)}</span>}</td>
                        <td className="py-3 pr-4"><div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color ?? "#94A3B8" }} /><span>{column.name}</span></div></td>
                        <td className="py-3 pr-4 text-[var(--muted-foreground)]">{task.due_date ? formatDate(task.due_date) : "---"}</td>
                        <td className="py-3"><div className="flex items-center gap-1"><button onClick={() => openEdit(task)} className="rounded p-1 hover:bg-[var(--muted)]"><Pencil className="h-3.5 w-3.5 text-[var(--muted-foreground)]" /></button><button onClick={() => openDelete(task)} className="rounded p-1 hover:bg-[var(--muted)]"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal open={modalMode === "create"} onClose={closeModal} title="Новая задача">
        <TaskForm columns={columns} projects={projects} defaultColumnId={defaultColumnId} onSubmit={handleCreate} onCancel={closeModal} />
      </Modal>
      <Modal open={modalMode === "edit"} onClose={closeModal} title="Редактировать задачу">
        {selectedTask && <TaskForm task={selectedTask} columns={columns} projects={projects} onSubmit={handleUpdate} onCancel={closeModal} />}
      </Modal>
      <Modal open={modalMode === "delete"} onClose={closeModal} title="Удалить задачу">
        {selectedTask && (
          <div className="space-y-4">
            <p className="text-sm">Удалить задачу <strong>{selectedTask.title}</strong>? Это действие нельзя отменить.</p>
            <div className="flex justify-end gap-3">
              <button onClick={closeModal} className="rounded-lg border px-4 py-2 text-sm hover:bg-[var(--muted)]">Отмена</button>
              <button onClick={handleDelete} disabled={isPending} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">{isPending ? "Удаление..." : "Удалить"}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
