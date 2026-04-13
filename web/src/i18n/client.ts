import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { defaultLocale, locales, type Locale } from "./config";
import { namespaces, resources } from "./resources";

export { useTranslation } from "react-i18next";

if (!i18next.isInitialized) {
  void i18next.use(initReactI18next).init({
    resources,
    lng: defaultLocale,
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

/**
 * Synchronise the active i18next language with the locale supplied by Astro.
 * Must run *before* the first `useTranslation()` call in the render path so
 * server-rendered markup matches the client-rendered tree.
 */
export function ensureLocale(locale: Locale) {
  if (i18next.language !== locale) {
    void i18next.changeLanguage(locale);
  }
}
