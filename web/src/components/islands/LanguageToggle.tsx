import { overrideCookie, type Locale } from "@/i18n/config";
import { ensureLocale, useTranslation } from "@/i18n/client";
import { cn } from "@/lib/utils";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

interface Props {
  locale: Locale;
  nextLocale: Locale;
  targetUrl: string;
  className?: string;
}

export function LanguageToggle({ locale, nextLocale, targetUrl, className }: Props) {
  ensureLocale(locale);
  const { t } = useTranslation(["common"]);

  return (
    <button
      type="button"
      onClick={() => {
        document.cookie = `${overrideCookie}=${nextLocale}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
        window.location.href = targetUrl;
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-mono uppercase tracking-wide text-fg transition-colors hover:bg-surface-elevated",
        className,
      )}
      aria-label={`${t("common.language")}: ${
        nextLocale === "en" ? t("common.english") : t("common.spanish")
      }`}
    >
      <span>{nextLocale === "en" ? "EN" : "ES"}</span>
    </button>
  );
}
