import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import {
  User,
  Shield,
  Bell,
  Palette,
  Link2,
  Database,
} from "lucide-react";

const sections = [
  {
    icon: User,
    title: "Профиль",
    description: "Имя, email, аватар, должность",
    href: "/settings/profile",
  },
  {
    icon: Shield,
    title: "Управление пользователями",
    description: "Роли, права доступа, приглашения",
    href: "/settings/team",
  },
  {
    icon: Bell,
    title: "Уведомления",
    description: "Email и push уведомления, Telegram бот",
    href: "/settings/notifications",
  },
  {
    icon: Palette,
    title: "Внешний вид",
    description: "Тема, язык, часовой пояс",
    href: "/settings/appearance",
  },
  {
    icon: Link2,
    title: "Интеграции",
    description: "Meta Ads, Google Ads, Telegram, Email",
    href: "/settings/integrations",
  },
  {
    icon: Database,
    title: "Данные",
    description: "Экспорт, импорт, резервные копии",
    href: null,
  },
];

export default function SettingsPage() {
  return (
    <div>
      <Topbar title="Настройки" />

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => {
            const content = (
              <>
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{section.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {section.description}
                  </p>
                  {!section.href && (
                    <span className="mt-2 inline-block rounded bg-[var(--muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                      Скоро
                    </span>
                  )}
                </div>
              </>
            );

            if (section.href) {
              return (
                <Link
                  key={section.title}
                  href={section.href}
                  className="flex items-start gap-4 rounded-xl bg-[var(--card)] p-5 text-left shadow-sm transition-shadow hover:shadow-md"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={section.title}
                className="flex items-start gap-4 rounded-xl bg-[var(--card)] p-5 text-left opacity-60 shadow-sm"
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
