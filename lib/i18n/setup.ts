import { useTranslation } from "next-i18next"

// Stub i18n setup
export const useT = () => {
  const { t } = useTranslation()
  return t
}

// Translation wrapper function
export const t = (key: string, options?: any) => {
  // In development, return the key to identify untranslated strings
  if (process.env.NODE_ENV === "development") {
    return `__TRANSLATE__${key}__`
  }
  return key
}
