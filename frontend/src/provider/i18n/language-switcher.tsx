import { useTranslation } from './i18n-provider';

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
      className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-slate-100"
    >
      <span className="text-sm font-medium">{language === 'en' ? 'FR' : 'EN'}</span>
    </button>
  );
};
