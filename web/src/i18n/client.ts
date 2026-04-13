import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { defaultLocale, locales, type Locale } from "./config";
import { namespaces, resources } from "./resources";

export { useTranslation } from "react-i18next";

function detectBrowserLocale(): Locale {
  if (typeof document === "undefined") return defaultLocale;
  const htmlLang = document.documentElement.lang;
  return (locales as readonly string[]).includes(htmlLang)
    ? (htmlLang as Locale)
    : defaultLocale;
}

if (!i18next.isInitialized) {
  void i18next.use(initReactI18next).init({
    resources,
    lng: detectBrowserLocale(),
    fallbackLng: defaultLocale,
    ns: namespaces as unknown as string[],
    defaultNS: "common",
    nsSeparator: ".",
    keySeparator: false,
    interpolation: { escapeValue: false, prefix: "{", suffix: "}" },
    supportedLngs: locales as unknown as string[],
    react: { useSuspense: false },
  });
}
