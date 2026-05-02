export const INDIAN_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", speechCode: "en-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", speechCode: "hi-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", speechCode: "bn-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", speechCode: "te-IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", speechCode: "mr-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", speechCode: "ta-IN" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", speechCode: "gu-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", speechCode: "kn-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", speechCode: "ml-IN" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", speechCode: "pa-IN" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", speechCode: "or-IN" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", speechCode: "as-IN" },
] as const;

export type IndianLanguageCode = typeof INDIAN_LANGUAGES[number]["code"];

export const getLanguageByCode = (code: string) => {
  return INDIAN_LANGUAGES.find((lang) => lang.code === code);
};

export const getLanguageName = (code: string) => {
  const lang = getLanguageByCode(code);
  return lang ? `${lang.name} (${lang.nativeName})` : code;
};

export const DEFAULT_WARNING_LANGUAGES = ["en", "hi"];
