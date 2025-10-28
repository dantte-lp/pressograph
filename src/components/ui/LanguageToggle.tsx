// ═══════════════════════════════════════════════════════════════════
// Language Toggle Component
// ═══════════════════════════════════════════════════════════════════

import { useLanguage } from '../../i18n';
import { Switch } from '@heroui/react';

export const LanguageToggle = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Switch
      isSelected={language === 'en'}
      onValueChange={(checked) => setLanguage(checked ? 'en' : 'ru')}
      size="sm"
      color="primary"
      startContent={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      }
      classNames={{
        wrapper: "group-data-[selected=true]:bg-primary",
      }}
    >
      <span className="text-sm font-medium">{language === 'en' ? 'EN' : 'RU'}</span>
    </Switch>
  );
};
