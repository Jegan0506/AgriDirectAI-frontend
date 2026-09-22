import { useLanguage } from "../context/LanguageContext";

const LanguageSelector = ({ style = {} }) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div
      className="language-selector-wrapper"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        background: "#F8FAFC",
        border: "1.5px solid #CBD5E1",
        borderRadius: "20px",
        padding: "3px 4px",
        fontSize: "12px",
        fontWeight: "700",
        boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
        ...style
      }}
    >
      <button
        type="button"
        onClick={() => toggleLanguage("en")}
        style={{
          background: language === "en" ? "#237A3B" : "transparent",
          color: language === "en" ? "#FFFFFF" : "#64748B",
          border: "none",
          borderRadius: "16px",
          padding: "4px 10px",
          cursor: "pointer",
          fontWeight: "700",
          fontSize: "12px",
          transition: "all 0.2s ease"
        }}
      >
        🇬🇧 EN
      </button>
      <button
        type="button"
        onClick={() => toggleLanguage("ta")}
        style={{
          background: language === "ta" ? "#237A3B" : "transparent",
          color: language === "ta" ? "#FFFFFF" : "#64748B",
          border: "none",
          borderRadius: "16px",
          padding: "4px 10px",
          cursor: "pointer",
          fontWeight: "700",
          fontSize: "12px",
          transition: "all 0.2s ease"
        }}
      >
        🇮🇳 தமிழ்
      </button>
    </div>
  );
};

export default LanguageSelector;
