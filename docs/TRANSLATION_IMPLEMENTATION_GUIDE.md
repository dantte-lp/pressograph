# Translation Implementation Guide - Settings Components

**Status**: Translation keys added, components need refactoring  
**Priority**: High  
**Estimated Effort**: 4-6 hours

## Overview

All translation keys have been added to both `/src/i18n/locales/en/common.json` and `/src/i18n/locales/ru/common.json`. The following components need to be refactored to use these keys instead of hardcoded English text.

---

## Components Requiring Refactoring

### 1. `/src/components/settings/appearance-settings.tsx`

**Current**: Hardcoded English  
**Target**: Use `settings.appearanceSettings.*` keys

**Example Refactoring**:

```tsx
// BEFORE
<h2 className="text-xl font-semibold mb-6">Appearance</h2>
<p className="text-sm text-muted-foreground mb-4">
  Select your preferred theme for the interface
</p>

// AFTER
import { useTranslation } from "@/i18n/client";

export function AppearanceSettings() {
  const { t } = useTranslation();
  
  return (
    <>
      <h2 className="text-xl font-semibold mb-6">
        {t("settings.appearanceSettings.title")}
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        {t("settings.appearanceSettings.themeDescription")}
      </p>
    </>
  );
}
```

**Translation Keys Map**:
- `"Appearance"` → `t("settings.appearanceSettings.title")`
- `"Theme"` → `t("settings.appearanceSettings.themeLabel")`
- `"Select your preferred theme for the interface"` → `t("settings.appearanceSettings.themeDescription")`
- `"Language"` → `t("settings.appearanceSettings.languageLabel")`
- `"Select your preferred language for the interface"` → `t("settings.appearanceSettings.languageDescription")`
- `"Select language"` → `t("settings.selectLanguage")`
- `"Light"` → `t("settings.light")`
- `"Dark"` → `t("settings.dark")`
- `"System"` → `t("settings.system")`
- `"Light theme"` → `t("settings.lightTheme")`
- `"Dark theme"` → `t("settings.darkTheme")`
- `"Follow system preference"` → `t("settings.followSystemPreference")`
- `"Saving preferences..."` → `t("settings.savingPreferences")`
- `"Preferences updated successfully"` → `t("settings.preferencesUpdated")`
- `"Failed to load preferences"` → `t("settings.failedToLoadPreferences")`
- `"Failed to update preferences"` → `t("settings.failedToUpdatePreferences")`

---

### 2. `/src/components/settings/display-settings.tsx`

**Current**: Hardcoded English  
**Target**: Use `settings.displaySettings.*` keys

**Translation Keys Map**:
- `"Display Preferences"` → `t("settings.displaySettings.title")`
- `"Default Graph Export Format"` → `t("settings.displaySettings.graphFormatLabel")`
- `"Choose the default file format when exporting pressure test graphs"` → `t("settings.displaySettings.graphFormatDescription")`
- `"PNG"` → `t("settings.displaySettings.formatPNG")`
- `"Raster image format"` → `t("settings.displaySettings.formatPNGDescription")`
- `"SVG"` → `t("settings.displaySettings.formatSVG")`
- `"Vector graphics format"` → `t("settings.displaySettings.formatSVGDescription")`
- `"PDF"` → `t("settings.displaySettings.formatPDF")`
- `"Portable document format"` → `t("settings.displaySettings.formatPDFDescription")`
- `"Default Graph Resolution"` → `t("settings.displaySettings.graphResolutionLabel")`
- `"Higher resolution produces larger files but better quality (1x - 4x)"` → `t("settings.displaySettings.graphResolutionDescription")`
- `"1x (Standard)"` → `t("settings.displaySettings.resolutionStandard")`
- `"4x (Ultra HD)"` → `t("settings.displaySettings.resolutionUltraHD")`
- `"Collapse Sidebar by Default"` → `t("settings.displaySettings.sidebarCollapsedLabel")`
- `"Start with the sidebar collapsed to maximize content area"` → `t("settings.displaySettings.sidebarCollapsedDescription")`
- `"Display preferences updated"` → `t("settings.displaySettings.displayPreferencesUpdated")`
- `"Saving preferences..."` → `t("settings.savingPreferences")`

---

### 3. `/src/components/settings/notification-settings.tsx`

**Current**: Hardcoded English  
**Target**: Use `settings.notificationSettings.*` keys

**Translation Keys Map**:
- `"Notifications"` → `t("settings.notificationSettings.title")`
- `"Email Notifications"` → `t("settings.notificationSettings.emailLabel")`
- `"Receive notifications about test results, project updates, and important alerts via email"` → `t("settings.notificationSettings.emailDescription")`
- `"In-App Notifications"` → `t("settings.notificationSettings.inAppLabel")`
- `"Show notifications within the application for real-time updates and alerts"` → `t("settings.notificationSettings.inAppDescription")`
- `"Notification preferences updated"` → `t("settings.notificationSettings.notificationPreferencesUpdated")`
- `"Saving preferences..."` → `t("settings.savingPreferences")`

---

### 4. `/src/components/settings/date-time-settings.tsx`

**Current**: Hardcoded English  
**Target**: Use `settings.dateTimeSettings.*` keys

**Translation Keys Map**:
- `"Timezone"` → `t("settings.dateTimeSettings.timezoneLabel")`
- `"All dates and times will be displayed in this timezone"` → `t("settings.dateTimeSettings.timezoneDescription")`
- `"Select timezone"` → `t("settings.dateTimeSettings.selectTimezone")`
- `"Date Format"` → `t("settings.dateTimeSettings.dateFormatLabel")`
- `"MM/DD/YYYY (US)"` → `t("settings.dateTimeSettings.dateFormatUS")`
- `"DD.MM.YYYY (EU/RU)"` → `t("settings.dateTimeSettings.dateFormatEU")`
- `"YYYY-MM-DD (ISO)"` → `t("settings.dateTimeSettings.dateFormatISO")`
- `"Time Format"` → `t("settings.dateTimeSettings.timeFormatLabel")`
- `"12-hour (AM/PM)"` → `t("settings.dateTimeSettings.timeFormat12h")`
- `"24-hour"` → `t("settings.dateTimeSettings.timeFormat24h")`
- `"Timezone updated"` → `t("settings.dateTimeSettings.timezoneUpdated")`
- `"Date format updated"` → `t("settings.dateTimeSettings.dateFormatUpdated")`
- `"Time format updated"` → `t("settings.dateTimeSettings.timeFormatUpdated")`
- `"Failed to update timezone"` → `t("settings.dateTimeSettings.failedToUpdateTimezone")`
- `"Failed to update date format"` → `t("settings.dateTimeSettings.failedToUpdateDateFormat")`
- `"Failed to update time format"` → `t("settings.dateTimeSettings.failedToUpdateTimeFormat")`

---

### 5. `/src/components/settings/template-settings.tsx`

**Current**: Hardcoded English  
**Target**: Use `settings.templateSettings.*` keys

**Note**: This is the largest component with 50+ translation keys.

**Key Translation Mappings**:
- `"Test Templates"` → `t("settings.templateSettings.title")`
- `"Create and manage reusable test configuration templates"` → `t("settings.templateSettings.description")`
- `"Loading templates..."` → `t("settings.templateSettings.loadingTemplates")`
- `"New Template"` → `t("settings.templateSettings.newTemplate")`
- `"Filter by Category"` → `t("settings.templateSettings.filterByCategory")`
- `"All Categories"` → `t("settings.templateSettings.allCategories")`
- `"Daily Tests"` → `t("settings.templateSettings.categoryDaily")`
- `"Extended Tests"` → `t("settings.templateSettings.categoryExtended")`
- `"Regulatory Tests"` → `t("settings.templateSettings.categoryRegulatory")`
- `"Custom"` → `t("settings.templateSettings.categoryCustom")`
- ... (see full list in common.json under settings.templateSettings)

**Special Cases**:
- Dynamic creator name: `By {{creator}}` → `t("settings.templateSettings.createdBy", { creator: template.creatorName })`
- Dynamic usage count: `Used {{count}} times` → `t("settings.templateSettings.usedTimes", { count: template.usageCount })`
- Dynamic date: `Last used: {{date}}` → `t("settings.templateSettings.lastUsed", { date: formatDate(template.lastUsedAt) })`
- Delete confirmation: `Are you sure you want to delete "{{name}}"?` → `t("settings.templateSettings.deleteTemplateConfirm", { name: selectedTemplate?.name })`

---

### 6. `/src/components/settings/organization-settings.tsx`

**Current**: Hardcoded English + placeholder implementation  
**Target**: Use `settings.organizationSettings.*` keys

**IMPORTANT**: This component has a placeholder implementation. Lines 51 and 60 contain:
- Line 51: `error: Organization
