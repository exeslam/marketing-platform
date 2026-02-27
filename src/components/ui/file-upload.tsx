"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileIcon, Image, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  bucket: "avatars" | "attachments" | "media";
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onUpload: (urls: string[]) => void;
  existingUrls?: string[];
  onRemove?: (url: string) => void;
  className?: string;
  compact?: boolean;
}

export function FileUpload({
  bucket,
  accept,
  multiple = false,
  maxFiles = 5,
  onUpload,
  existingUrls = [],
  onRemove,
  className,
  compact = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isImage = (url: string) =>
    /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files).slice(0, maxFiles - existingUrls.length);
      if (fileArr.length === 0) return;

      setUploading(true);
      setError("");

      const urls: string[] = [];
      for (const file of fileArr) {
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name}: превышает 10МБ`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", bucket);

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          urls.push(data.url);
        } catch (err) {
          setError(
            `${file.name}: ${err instanceof Error ? err.message : "ошибка загрузки"}`
          );
        }
      }

      if (urls.length > 0) onUpload(urls);
      setUploading(false);
    },
    [bucket, maxFiles, existingUrls.length, onUpload]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  }

  if (compact) {
    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-lg border bg-[var(--muted)] px-3 py-2 text-sm transition-colors hover:bg-[var(--border)] disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Загрузка..." : "Загрузить"}
        </button>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50 hover:bg-primary/5",
          dragOver && "border-primary bg-primary/10",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <Upload className="h-8 w-8 text-[var(--muted-foreground)]" />
        )}
        <div>
          <p className="text-sm font-medium">
            {uploading ? "Загрузка..." : "Перетащите файлы или нажмите"}
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            Максимум 10МБ на файл
          </p>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {/* Preview existing files */}
      {existingUrls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {existingUrls.map((url) => (
            <div
              key={url}
              className="group relative flex items-center gap-2 rounded-lg border bg-[var(--muted)] p-2"
            >
              {isImage(url) ? (
                <img
                  src={url}
                  alt=""
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <FileIcon className="h-8 w-8 text-[var(--muted-foreground)]" />
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(url)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Avatar upload — circular preview with overlay */
export function AvatarUpload({
  currentUrl,
  onUpload,
}: {
  currentUrl: string | null;
  onUpload: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "avatars");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) onUpload(data.url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative h-20 w-20 overflow-hidden rounded-full border-2 border-dashed border-[var(--border)]"
        disabled={uploading}
      >
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--muted)]">
            <Image className="h-6 w-6 text-[var(--muted-foreground)]" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Upload className="h-5 w-5 text-white" />
          )}
        </div>
      </button>
    </div>
  );
}
