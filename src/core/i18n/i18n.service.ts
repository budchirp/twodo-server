import en from '@/core/i18n/message/en.json'
import tr from '@/core/i18n/message/tr.json'
import { Injectable } from '@nestjs/common'

const messages = { en, tr }
type Language = keyof typeof messages

@Injectable()
export class I18nService {
  translate(key: string, acceptLanguage?: string | string[]): string {
    const lang = this.languageFromHeader(acceptLanguage)
    return messages[lang]?.[key] ?? messages.en[key] ?? key
  }

  private languageFromHeader(acceptLanguage?: string | string[]): Language {
    const raw = Array.isArray(acceptLanguage) ? acceptLanguage[0] : acceptLanguage
    const lang = raw?.split(',')[0]?.trim().split('-')[0] as Language
    return lang && messages[lang] ? lang : 'en'
  }
}
