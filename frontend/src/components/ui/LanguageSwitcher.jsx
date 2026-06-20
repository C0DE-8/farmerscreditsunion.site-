import { useEffect, useId, useState } from "react";
import { FiGlobe } from "react-icons/fi";
import styles from "./LanguageSwitcher.module.css";

const STORAGE_KEY = "wb_language";
const SCRIPT_ID = "google-translate-script";
const ELEMENT_ID = "google_translate_element";

const fallbackLanguages = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ar", label: "Arabic" },
  { code: "zh-CN", label: "Chinese" },
  { code: "hi", label: "Hindi" },
  { code: "ja", label: "Japanese" },
];

const languageFlags = {
  af: "🇿🇦",
  am: "🇪🇹",
  ar: "🇸🇦",
  az: "🇦🇿",
  be: "🇧🇾",
  bg: "🇧🇬",
  bn: "🇧🇩",
  bs: "🇧🇦",
  ca: "🇪🇸",
  ceb: "🇵🇭",
  co: "🇫🇷",
  cs: "🇨🇿",
  cy: "🇬🇧",
  da: "🇩🇰",
  de: "🇩🇪",
  el: "🇬🇷",
  en: "🇺🇸",
  eo: "🌐",
  es: "🇪🇸",
  et: "🇪🇪",
  eu: "🇪🇸",
  fa: "🇮🇷",
  fi: "🇫🇮",
  fr: "🇫🇷",
  fy: "🇳🇱",
  ga: "🇮🇪",
  gd: "🏴",
  gl: "🇪🇸",
  gu: "🇮🇳",
  ha: "🇳🇬",
  haw: "🇺🇸",
  he: "🇮🇱",
  hi: "🇮🇳",
  hmn: "🌐",
  hr: "🇭🇷",
  ht: "🇭🇹",
  hu: "🇭🇺",
  hy: "🇦🇲",
  id: "🇮🇩",
  ig: "🇳🇬",
  is: "🇮🇸",
  it: "🇮🇹",
  ja: "🇯🇵",
  jv: "🇮🇩",
  ka: "🇬🇪",
  kk: "🇰🇿",
  km: "🇰🇭",
  kn: "🇮🇳",
  ko: "🇰🇷",
  ku: "🌐",
  ky: "🇰🇬",
  la: "🇻🇦",
  lb: "🇱🇺",
  lo: "🇱🇦",
  lt: "🇱🇹",
  lv: "🇱🇻",
  mg: "🇲🇬",
  mi: "🇳🇿",
  mk: "🇲🇰",
  ml: "🇮🇳",
  mn: "🇲🇳",
  mr: "🇮🇳",
  ms: "🇲🇾",
  mt: "🇲🇹",
  my: "🇲🇲",
  ne: "🇳🇵",
  nl: "🇳🇱",
  no: "🇳🇴",
  ny: "🇲🇼",
  pa: "🇮🇳",
  pl: "🇵🇱",
  ps: "🇦🇫",
  pt: "🇵🇹",
  ro: "🇷🇴",
  ru: "🇷🇺",
  sd: "🇵🇰",
  si: "🇱🇰",
  sk: "🇸🇰",
  sl: "🇸🇮",
  sm: "🇼🇸",
  sn: "🇿🇼",
  so: "🇸🇴",
  sq: "🇦🇱",
  sr: "🇷🇸",
  st: "🇱🇸",
  su: "🇮🇩",
  sv: "🇸🇪",
  sw: "🇹🇿",
  ta: "🇮🇳",
  te: "🇮🇳",
  tg: "🇹🇯",
  th: "🇹🇭",
  tl: "🇵🇭",
  tr: "🇹🇷",
  uk: "🇺🇦",
  ur: "🇵🇰",
  uz: "🇺🇿",
  vi: "🇻🇳",
  xh: "🇿🇦",
  yi: "🌐",
  yo: "🇳🇬",
  "zh-CN": "🇨🇳",
  "zh-TW": "🇹🇼",
  zu: "🇿🇦",
};

function languageLogo(code) {
  return languageFlags[code] || languageFlags[String(code).split("-")[0]] || "🌐";
}

function ensureGoogleElement() {
  if (document.getElementById(ELEMENT_ID)) return;
  const element = document.createElement("div");
  element.id = ELEMENT_ID;
  element.style.display = "none";
  document.body.appendChild(element);
}

function setTranslateCookie(code) {
  const expires = code === "en" ? "Thu, 01 Jan 1970 00:00:00 GMT" : "";
  const value = code === "en" ? "" : `/en/${code}`;
  document.cookie = `googtrans=${value}; path=/; ${expires ? `expires=${expires};` : ""}`;
  document.cookie = `googtrans=${value}; path=/; domain=${window.location.hostname}; ${expires ? `expires=${expires};` : ""}`;
}

function applyGoogleLanguage(code) {
  setTranslateCookie(code);

  const combo = document.querySelector(".goog-te-combo");
  if (combo && code !== "en") {
    combo.value = code;
    combo.dispatchEvent(new Event("change"));
    return;
  }

  window.location.reload();
}

function getGoogleLanguages() {
  const combo = document.querySelector(".goog-te-combo");
  if (!combo?.options?.length) return [];

  const options = Array.from(combo.options)
    .filter((option) => option.value)
    .map((option) => ({
      code: option.value,
      label: option.textContent || option.value,
    }));

  return [{ code: "en", label: "English" }, ...options];
}

export default function LanguageSwitcher({ compact = false }) {
  const labelId = useId();
  const [language, setLanguage] = useState(() => localStorage.getItem(STORAGE_KEY) || "en");
  const [languageOptions, setLanguageOptions] = useState(fallbackLanguages);
  const selectedLanguage = languageOptions.find((item) => item.code === language) || fallbackLanguages[0];

  useEffect(() => {
    ensureGoogleElement();

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          autoDisplay: false,
        },
        ELEMENT_ID
      );

      window.setTimeout(() => {
        const googleLanguages = getGoogleLanguages();
        if (googleLanguages.length) setLanguageOptions(googleLanguages);
      }, 500);
    };

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }

    const interval = window.setInterval(() => {
      const googleLanguages = getGoogleLanguages();
      if (googleLanguages.length) {
        setLanguageOptions(googleLanguages);
        window.clearInterval(interval);
      }
    }, 700);

    return () => window.clearInterval(interval);
  }, []);

  const handleChange = (event) => {
    const nextLanguage = event.target.value;
    setLanguage(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
    applyGoogleLanguage(nextLanguage);
  };

  return (
    <label className={`${styles.switcher} ${compact ? styles.compact : ""}`}>
      <span id={labelId}>Language</span>
      <div className={styles.control}>
        <b className={styles.languageMark} aria-hidden="true">
          <FiGlobe />
          <span>{languageLogo(selectedLanguage.code)}</span>
        </b>
        <strong className={styles.selectedLanguage}>
          {selectedLanguage.label}
          <small>{selectedLanguage.code.toUpperCase()}</small>
        </strong>
        <select aria-labelledby={labelId} value={language} onChange={handleChange}>
          {languageOptions.map((item) => (
            <option value={item.code} key={item.code}>
              {item.code.toUpperCase()} - {item.label}
            </option>
          ))}
        </select>
      </div>
      <small>Powered by Google</small>
    </label>
  );
}
