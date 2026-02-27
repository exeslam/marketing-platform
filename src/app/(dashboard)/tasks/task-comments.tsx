"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Trash2, Loader2 } from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { getTaskCommentsAction, createTaskCommentAction, deleteTaskCommentAction } from "@/lib/actions";
import type { TaskComment } from "@/types/database";

interface TaskCommentsProps {
  taskId: string;
  currentUserId: string;
}

export function TaskComments({ taskId, currentUserId }: TaskCommentsProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    getTaskCommentsAction(taskId).then((res) => {
      if (res.success) setComments(res.data);
      setLoading(false);
    });
  }, [taskId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  async function handleSend() {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    setText("");

    const res = await createTaskCommentAction(taskId, content);
    if (res.success) {
      setComments((prev) => [...prev, res.data]);
    }
    setSending(false);
  }

  async function handleDelete(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id));
    await deleteTaskCommentAction(id);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Comments list */}
      <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
        {comments.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">
            Нет комментариев
          </p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="group flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {c.author ? getInitials(c.author.full_name) : "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {c.author?.full_name ?? "Пользователь"}
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  {formatDate(c.created_at)}
                </span>
                {c.author_id === currentUserId && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                    title="Удалить"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[var(--muted-foreground)] hover:text-red-500" />
                  </button>
                )}
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-sm">{c.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2 border-t pt-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          placeholder="Написать комментарий..."
          className="flex-1 rounded-lg border bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-primary"
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
