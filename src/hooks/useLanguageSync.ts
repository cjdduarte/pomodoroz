import { useEffect } from "react";
import i18n from "i18next";
import { useAppSelector } from "./storeHooks";
import {
  detectSystemLanguage,
  normalizeLanguageCode,
} from "i18n/languages";

const syncLanguageToDom = (language: string) => {
  if (typeof document === "undefined") {
    return;
  }

  if (document.documentElement.lang !== language) {
    document.documentElement.lang = language;
  }
};

const useLanguageSync = () => {
  const language = useAppSelector((state) => state.settings.language);

  useEffect(() => {
    let isCancelled = false;

    const syncLanguage = async () => {
      const resolvedLanguage =
        language === "auto"
          ? await detectSystemLanguage()
          : normalizeLanguageCode(language);

      if (isCancelled) {
        return;
      }

      if (i18n.language !== resolvedLanguage) {
        await i18n.changeLanguage(resolvedLanguage);
      }

      syncLanguageToDom(resolvedLanguage);
    };

    void syncLanguage();

    return () => {
      isCancelled = true;
    };
  }, [language]);

  useEffect(() => {
    if (language !== "auto" || typeof window === "undefined") {
      return;
    }

    let isCancelled = false;

    const syncAutoLanguage = async () => {
      const resolvedLanguage = await detectSystemLanguage();

      if (isCancelled) {
        return;
      }

      if (i18n.language !== resolvedLanguage) {
        await i18n.changeLanguage(resolvedLanguage);
      }

      syncLanguageToDom(resolvedLanguage);
    };

    const handleLanguageChange = () => {
      void syncAutoLanguage();
    };

    window.addEventListener("languagechange", handleLanguageChange);

    return () => {
      isCancelled = true;
      window.removeEventListener(
        "languagechange",
        handleLanguageChange
      );
    };
  }, [language]);
};

export default useLanguageSync;
