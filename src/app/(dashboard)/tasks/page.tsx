import { Topbar } from "@/components/layout/topbar";
import {
  getTaskColumns,
  getProjects,
  getAllTasks,
  getCurrentUser,
} from "@/lib/supabase/queries";
import { TasksBoard } from "./tasks-board";

const DEFAULT_BOARD_ID = "b1111111-1111-1111-1111-111111111111";

export default async function TasksPage() {
  const [projects, allTasks, columns, user] = await Promise.all([
    getProjects(),
    getAllTasks(),
    getTaskColumns(DEFAULT_BOARD_ID),
    getCurrentUser(),
  ]);

  // Build a map: project_id -> { name, color }
  const projectMap: Record<string, { name: string; color: string }> = {};
  for (const p of projects) {
    projectMap[p.id] = { name: p.short_name || p.name, color: p.color };
  }

  // Group tasks by column_id
  const tasksByColumn: Record<string, typeof allTasks> = {};
  for (const task of allTasks) {
    if (!tasksByColumn[task.column_id]) {
      tasksByColumn[task.column_id] = [];
    }
    tasksByColumn[task.column_id].push(task);
  }

  // Sort tasks within each column by sort_order
  for (const columnId of Object.keys(tasksByColumn)) {
    tasksByColumn[columnId].sort((a, b) => a.sort_order - b.sort_order);
  }

  return (
    <div>
      <Topbar title="Задачи" />
      <TasksBoard
        columns={columns}
        tasksByColumn={tasksByColumn}
        projectMap={projectMap}
        projects={projects}
        currentUserId={user?.id ?? ""}
      />
    </div>
  );
}
