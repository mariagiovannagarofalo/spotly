import { getLocales } from 'expo-localization'
import { I18n } from 'i18n-js'
import de from '../locales/de.json'
import en from '../locales/en.json'
import es from '../locales/es.json'
import fr from '../locales/fr.json'
import it from '../locales/it.json'

const i18n = new I18n({ en, it, es, fr, de })

const locale = getLocales()[0]?.languageCode ?? 'en'
i18n.locale = locale
i18n.enableFallback = true
i18n.defaultLocale = 'en'

export default i18n

// Helper per plurali semplici
export function tp(key: string, count: number): string {
  const singular = i18n.t(`${key}_one`, { count })
  const plural = i18n.t(`${key}_other`, { count })
  return count === 1 ? singular : plural
}
