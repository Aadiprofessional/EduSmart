import { en } from './locales/en';
import { zhCN } from './locales/zh-CN';
import { zhTW } from './locales/zh-TW';

export type Language = 'en' | 'zh-CN' | 'zh-TW';

export const translations = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

export type TranslationKey = keyof typeof en;
type TranslationPrimitive = string | number | boolean | null | undefined;
type TranslationValue = string | Record<string, unknown>;

export interface TranslationOptions {
  count?: number;
  values?: Record<string, TranslationPrimitive>;
  date?: Date | number | string;
  time?: Date | number | string;
  dateTime?: Date | number | string;
  dateOptions?: Intl.DateTimeFormatOptions;
  timeOptions?: Intl.DateTimeFormatOptions;
  dateTimeOptions?: Intl.DateTimeFormatOptions;
}

const localeMap: Record<Language, string> = {
  en: 'en-US',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
};

const resolveNestedValue = (source: Record<string, unknown>, key: string): TranslationValue | undefined => {
  const keys = key.split('.');
  let value: unknown = source;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[k];
      continue;
    }
    return undefined;
  }

  if (typeof value === 'string' || (value && typeof value === 'object')) {
    return value as TranslationValue;
  }

  return undefined;
};

const normalizeDateInput = (input: Date | number | string): Date => {
  if (input instanceof Date) return input;
  return new Date(input);
};

const formatWithLocale = (
  language: Language,
  input: Date | number | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateValue = normalizeDateInput(input);
  if (Number.isNaN(dateValue.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat(localeMap[language], options).format(dateValue);
};

const applyInterpolation = (
  text: string,
  language: Language,
  options?: TranslationOptions
): string => {
  if (!options) return text;

  const interpolationValues: Record<string, TranslationPrimitive> = {
    ...(options.values || {}),
  };

  if (typeof options.count === 'number') {
    interpolationValues.count = options.count;
  }

  if (options.date !== undefined) {
    interpolationValues.date = formatWithLocale(language, options.date, options.dateOptions);
  }

  if (options.time !== undefined) {
    interpolationValues.time = formatWithLocale(language, options.time, options.timeOptions || { hour: '2-digit', minute: '2-digit' });
  }

  if (options.dateTime !== undefined) {
    interpolationValues.dateTime = formatWithLocale(language, options.dateTime, options.dateTimeOptions || { dateStyle: 'medium', timeStyle: 'short' });
  }

  return text.replace(/\{\{(\w+)\}\}/g, (_, variable: string) => {
    if (!(variable in interpolationValues)) return '';
    const value = interpolationValues[variable];
    return value === undefined || value === null ? '' : String(value);
  });
};

const resolvePluralValue = (value: TranslationValue, count?: number): string | undefined => {
  if (typeof value === 'string') return value;
  if (typeof count !== 'number') return undefined;
  const pluralMap = value as Record<string, unknown>;
  if (count === 0 && typeof pluralMap.zero === 'string') return pluralMap.zero;
  if (count === 1 && typeof pluralMap.one === 'string') return pluralMap.one;
  if (typeof pluralMap.other === 'string') return pluralMap.other;
  return undefined;
};

export const getTranslation = (language: Language, key: string, options?: TranslationOptions): string => {
  const localizedValue = resolveNestedValue(translations[language] as Record<string, unknown>, key);
  const fallbackValue = resolveNestedValue(translations.en as Record<string, unknown>, key);
  const resolved = resolvePluralValue(localizedValue ?? fallbackValue ?? '', options?.count);

  if (!resolved) {
    return `Missing translation: ${key}`;
  }

  return applyInterpolation(resolved, language, options);
};

export const t = (key: string, language: Language = 'en', options?: TranslationOptions): string => {
  return getTranslation(language, key, options);
};

// Helper function to get all available languages
export const getAvailableLanguages = (): { code: Language; name: string }[] => [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
];

// Helper function to detect browser language
export const detectLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language || navigator.languages?.[0];
  
  if (browserLang?.startsWith('zh')) {
    // Check for traditional Chinese variants
    if (browserLang.includes('TW') || browserLang.includes('HK') || browserLang.includes('MO')) {
      return 'zh-TW';
    }
    // Default to simplified Chinese for other zh variants
    return 'zh-CN';
  }
  
  // Default to English for all other languages
  return 'en';
}; 
