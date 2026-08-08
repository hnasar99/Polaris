"use client";

import { Badge, Button, Card, SectionHeader } from "@/components/ui";
import { nightToUsd } from "@/domain/pricing";
import {
  studyAnchorId,
  type InboxItem,
} from "@/features/matching/inbox";
import { useInbox } from "@/features/matching/useInbox";
import type { StudyMatch } from "@/features/matching/useMatches";
import { useI18n } from "@/i18n";

/** Kept as a literal so Tailwind includes the utilities in the bundle. */
const STUDY_FLASH = "ring-2 ring-cyan-400/60";

function scrollToStudy(externalStudyId: string) {
  const el = document.getElementById(studyAnchorId(externalStudyId));
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  for (const cls of STUDY_FLASH.split(" ")) el.classList.add(cls);
  window.setTimeout(() => {
    for (const cls of STUDY_FLASH.split(" ")) el.classList.remove(cls);
  }, 1600);
}

function InboxRow({
  item,
  onOpen,
}: {
  item: InboxItem;
  onOpen: (id: string) => void;
}) {
  const { t, formatNumber } = useI18n();

  return (
    <button
      type="button"
      onClick={() => onOpen(item.externalStudyId)}
      className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/5"
    >
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-300" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-white">{item.title}</span>
        <span className="mt-0.5 block text-xs text-slate-400">
          {t("matches.eligibleFrom", { lab: item.researcherAlias })}
        </span>
        <span className="mt-1 block text-xs text-cyan-200/90">
          {t("matches.notificationBody", {
            amount: formatNumber(item.rewardAmount),
            usd: formatNumber(nightToUsd(item.rewardAmount), {
              maximumFractionDigits: 2,
            }),
          })}
        </span>
      </span>
    </button>
  );
}

export function MatchInbox({ matches }: { matches: StudyMatch[] }) {
  const { t } = useI18n();
  const { unread, unreadCount, markRead, markAllRead } = useInbox(matches);

  function handleOpen(externalStudyId: string) {
    markRead(externalStudyId);
    scrollToStudy(externalStudyId);
  }

  return (
    <Card tone={unreadCount > 0 ? "highlight" : "muted"}>
      <SectionHeader
        title={t("matches.notifications")}
        subtitle={t("matches.notificationsHint")}
        action={
          unreadCount > 0 ? (
            <div className="flex items-center gap-2">
              <Badge tone="success">{unreadCount}</Badge>
              <Button variant="ghost" onClick={markAllRead}>
                {t("matches.markAllRead")}
              </Button>
            </div>
          ) : null
        }
      />

      {unreadCount === 0 ? (
        <p className="text-sm text-slate-400">{t("matches.notificationsEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {unread.map((item) => (
            <li key={item.externalStudyId}>
              <InboxRow item={item} onOpen={handleOpen} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
