import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKZT(amount: number): string {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Almaty",
  }).format(new Date(dateStr));
}

export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Almaty",
  }).format(new Date(dateStr));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getProjectTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    school: "Школа",
    university: "Университет",
    college: "Колледж",
  };
  return labels[type] ?? type;
}

export function getTaskPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
    urgent: "Срочный",
  };
  return labels[priority] ?? priority;
}

export function getTaskCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    smm: "SMM",
    target: "Таргет",
    seo: "SEO",
    email: "Email",
    influencer: "Инфлюенсер",
    design: "Дизайн",
    content: "Контент",
    other: "Другое",
  };
  return labels[category] ?? category;
}
