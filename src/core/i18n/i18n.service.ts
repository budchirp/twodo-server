import en from '@/core/i18n/message/en.json'
import { Injectable } from '@nestjs/common'

const messages = {
  en: en
}

type Language = keyof typeof messages

@Injectable()
export class I18nService {
  translate(key: string, acceptLanguage?: string | string[]) {
    const language = this.languageFromHeader(acceptLanguage)
    return messages[language][key] ?? messages.en[key] ?? key
  }

  private languageFromHeader(acceptLanguage?: string | string[]): Language {
    const raw = Array.isArray(acceptLanguage) ? acceptLanguage[0] : acceptLanguage
    const language = raw?.split(',')[0]?.trim().split('-')[0] as Language

    return language && messages[language] ? language : 'en'
  }
}
