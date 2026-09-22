import { createContext, useContext, useState, useEffect } from "react";
import { Translations } from "../utils/translations";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("uzhavar_lang") || "en";
  });

  useEffect(() => {
    localStorage.setItem("uzhavar_lang", language);
  }, [language]);

  const toggleLanguage = (lang) => {
    if (lang === "en" || lang === "ta") {
      setLanguage(lang);
    } else {
      setLanguage((prev) => (prev === "en" ? "ta" : "en"));
    }
  };

  const t = (key) => {
    return Translations[language]?.[key] || Translations["en"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
