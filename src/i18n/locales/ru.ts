// ═══════════════════════════════════════════════════════════════════
// Russian Translations
// ═══════════════════════════════════════════════════════════════════

import type { TranslationKeys } from './en';

export const ru: TranslationKeys = {
  // App
  appTitle: 'Визуализатор испытаний давления',
  appDescription: 'Создание профессиональных графиков испытаний давления',
  footerText:
    'Визуализатор испытаний давления - Создавайте профессиональные графики испытаний легко',

  // Template Presets
  templatePresets: 'Шаблоны настроек',
  templatePresetsDescription: 'Загрузите предварительно настроенные шаблоны испытаний',
  standardTest: 'Стандартное испытание',
  standardTestDescription: '15.33ч испытание с 3 промежуточными проверками',
  dailyTest: 'Суточное испытание',
  dailyTestDescription: '24ч испытание с 5 промежуточными проверками',
  extendedTest: 'Расширенное испытание',
  extendedTestDescription: '48ч испытание с 7 промежуточными проверками',
  resetToDefaults: 'Сбросить по умолчанию',

  // Test Parameters
  testParameters: 'Параметры испытания',
  testNumber: 'Номер испытания',
  testNumberLabel: 'Номер испытания',
  reportDate: 'Дата отчета',
  reportDateLabel: 'Дата отчета',
  startDate: 'Дата начала',
  startDateLabel: 'Дата начала',
  startTime: 'Время начала',
  startTimeLabel: 'Время начала',
  endDate: 'Дата окончания',
  endDateLabel: 'Дата окончания',
  endTime: 'Время окончания',
  endTimeLabel: 'Время окончания',
  testDuration: 'Длительность испытания (часы)',
  testDurationLabel: 'Длительность испытания (часы)',
  testDurationHelper: 'Общая длительность испытания в часах',
  workingPressure: 'Рабочее давление (МПа)',
  workingPressureLabel: 'Рабочее давление (МПа)',
  workingPressureHelper: 'Уровень рабочего давления',
  maxPressure: 'Макс. давление (МПа)',
  maxPressureLabel: 'Макс. давление (МПа)',
  maxPressureHelper: 'Максимальное достигнутое давление',
  temperature: 'Температура (°C)',
  temperatureLabel: 'Температура (°C)',
  temperatureHelper: 'Температура испытания',
  pressureDuration: 'Длительность давления (минуты)',
  pressureDurationLabel: 'Длительность давления (минуты)',
  pressureDurationHelper: 'Длительность удержания давления',
  infoDisplay: 'Отображение информации',
  infoDisplayLabel: 'Отображение информации',
  infoDisplayUnder: 'Под графиком',
  infoDisplayOn: 'На графике',
  infoDisplayOff: 'Выключено',
  graphTitle: 'Заголовок графика',
  graphTitleLabel: 'Заголовок графика',
  graphTitlePlaceholder: 'График испытания давления',

  // Intermediate Pressure Tests
  intermediatePressureTests: 'Промежуточные испытания давлением',
  addTest: 'Добавить испытание',
  clearAll: 'Очистить всё',
  noIntermediateTests:
    'Промежуточные испытания не настроены. Нажмите "Добавить испытание" для добавления.',
  testTimeLabel: 'Время (часы)',
  testTimeHelper: 'Часов от начала испытания',
  testDurationLabelTest: 'Длительность (минуты)',
  testDurationHelperTest: 'Длительность удержания',
  remove: 'Удалить',

  // Graph
  pressureTestGraph: 'График испытания давления',

  // Export & Import
  exportImport: 'Экспорт и импорт',
  exportPNG: 'Экспорт PNG',
  exportPDF: 'Экспорт PDF',
  exportJSON: 'Экспорт JSON',
  importJSON: 'Импорт JSON',
  saveGraph: 'Сохранить график',
  exportDescription:
    'Экспортируйте график как PNG или PDF для отчетов. Сохраняйте/загружайте настройки в формате JSON для последующего использования.',
  importSuccess: 'Настройки успешно импортированы!',
  importFailed: 'Ошибка импорта: {{error}}',
  saveSuccess: 'График успешно сохранен!',
  saveFailed: 'Не удалось сохранить график',
  unsavedChangesTitle: 'Несохраненные изменения',
  unsavedChangesMessage: 'У вас есть несохраненные изменения. Хотите сохранить их перед выходом?',
  unsavedChangesSave: 'Сохранить',
  unsavedChangesDontSave: 'Не сохранять',
  unsavedChangesCancel: 'Отмена',

  // Theme
  darkMode: 'Темная тема',
  lightMode: 'Светлая тема',

  // Language
  language: 'Язык',
  english: 'English',
  russian: 'Русский',

  // Quick Preset Intervals
  quickPresetIntervals: 'Быстрые интервалы',
  quickPresetIntervalsDescription:
    'Генерация промежуточных испытаний с регулярными интервалами на основе длительности испытания',
  every: 'Каждые',

  // Section Headers
  generalInformation: 'Общая информация',
  timeParameters: 'Временные параметры',
  pressureParameters: 'Параметры давления',
  displaySettings: 'Настройки отображения',
  basicParameters: 'Основные параметры',
  driftAndTargetParameters: 'Параметры дрейфа и целевого давления',

  // Units
  unitHours: 'ч',
  unitMinutes: 'мин',
  unitMPa: 'МПа',

  // Test Labels
  test: 'Испытание',
  defaultValue: 'По умолчанию',
  duplicate: 'Дублировать',
  delete: 'Удалить',
  optional: 'Опционально',

  // Pressure Test Fields
  testPressure: 'Давление теста',
  testPressureOptional: 'Опционально (МПа)',
  minPressure: 'Мин. давление',
  minPressureDriftDown: 'Дрейф вниз (МПа)',
  maxPressureDriftUp: 'Дрейф вверх (МПа)',
  targetPressure: 'Целевое давление',
  targetPressureAfterRelease: 'После сброса (МПа)',
  holdDrift: 'Дрейф удержания',
  holdDriftUntilNext: 'До след. теста (МПа)',

  // Navigation
  home: 'Главная',
  history: 'История',
  admin: 'Админ',
  help: 'Помощь',
  login: 'Вход',

  // Help Page
  helpTitle: 'Помощь и документация',
  helpSubtitle: 'Научитесь эффективно использовать Pressograph',
  helpSearchPlaceholder: 'Поиск по справке...',
  helpSections: 'Разделы',
  helpNoResults: 'Ничего не найдено',
  helpNoResultsText: 'Попробуйте изменить ключевые слова поиска',
  helpCopy: 'Копировать',
  helpCopySuccess: 'Скопировано в буфер обмена!',
  helpCopyError: 'Ошибка копирования',

  // Getting Started Section
  helpGettingStartedTitle: 'Начало работы',
  helpGettingStartedIntro:
    'Добро пожаловать в Pressograph! Это руководство поможет вам начать создавать профессиональные графики испытаний давления.',
  helpQuickOverview: 'Краткий обзор',
  helpQuickOverviewText:
    'Pressograph — это профессиональный инструмент для генерации, визуализации и экспорта графиков испытаний давления. Поддерживает множество форматов экспорта (PNG, PDF, JSON), предоставляет настраиваемые параметры испытаний и предлагает светлую и темную темы.',
  helpLoginGuide: 'Вход и аутентификация',
  helpLoginStep1: 'Перейдите на страницу входа с главного экрана',
  helpLoginStep2: 'Введите имя пользователя и пароль, предоставленные администратором',
  helpLoginStep3: 'Нажмите "Вход" для доступа к приложению',
  helpFirstGraphTitle: 'Создание первого графика',
  helpFirstGraphStep1: 'Перейдите на главную страницу после входа',
  helpFirstGraphStep2: 'Настройте параметры испытания (номер, температура, длительность и т.д.)',
  helpFirstGraphStep3: 'Добавьте промежуточные испытания давлением при необходимости',
  helpFirstGraphStep4: 'Просматривайте график в реальном времени по мере настройки параметров',
  helpFirstGraphStep5: 'Экспортируйте график как PNG, PDF или сохраните настройки в JSON',

  // Test Configuration Section
  helpTestConfigTitle: 'Настройка испытания',
  helpTestConfigIntro:
    'Понимание параметров испытания необходимо для точной документации испытаний давления. Каждый параметр влияет на то, как генерируется и отображается график.',
  helpTestNumberDesc:
    'Уникальный идентификатор испытания давления. Используйте последовательную систему именования (например, 2024-001, ТЕСТ-А-001).',
  helpTestNumberRange: 'Любая буквенно-цифровая строка (рекомендуется: до 20 символов)',
  helpTemperatureDesc:
    'Температура окружающей среды во время испытания давлением. Важна для точной документации и анализа.',
  helpTemperatureRange: 'Типичный диапазон: от -50°C до 100°C',
  helpGraphTitleDesc:
    'Пользовательский заголовок, отображаемый вверху графика. Используйте описательные названия для легкой идентификации.',
  helpTestDurationDesc: 'Общая длительность испытания давлением в часах. Определяет масштаб оси X.',
  helpTestDurationRange: 'Типичный диапазон: от 1 до 168 часов (1 неделя)',
  helpWorkingPressureDesc:
    'Нормальное рабочее давление тестируемой системы. Используется как опорная линия на графике.',
  helpWorkingPressureRange: 'Типичный диапазон: от 0.1 до 10.0 МПа',
  helpMaxPressureDesc:
    'Максимальное давление, достигнутое во время испытания. Обычно в 1.5 раза больше рабочего давления для испытаний безопасности.',
  helpExampleConfigTitle: 'Пример конфигурации',
  helpExampleConfigText: 'Вот типичная конфигурация для 24-часового испытания давлением:',

  // Graph Interpretation Section
  helpGraphInterpretTitle: 'Интерпретация графика',
  helpGraphInterpretIntro:
    'Узнайте, как читать и интерпретировать графики испытаний давления, созданные Pressograph.',
  helpReadingCurveTitle: 'Чтение кривой давления',
  helpReadingCurveText:
    'Кривая давления показывает, как давление изменяется со временем. Ось X представляет время (в часах), а ось Y представляет давление (в МПа). Ищите плавные переходы и стабильные плато в периоды удержания.',
  helpStagesTitle: 'Понимание стадий испытания',
  helpStageHold: 'Стадия удержания',
  helpStageHoldDesc:
    'Система поддерживает постоянное давление для обнаружения утечек. Давление должно оставаться стабильным с минимальным дрейфом.',
  helpStageDrop: 'Стадия падения давления',
  helpStageDropDesc:
    'Контролируемое снижение давления для измерения восстановления системы. Отслеживает, как давление уменьшается со временем.',
  helpStageDrain: 'Стадия слива',
  helpStageDrainDesc:
    'Окончательная разгерметизация системы. Давление возвращается к атмосферному уровню.',
  helpPassFailTitle: 'Критерии прохождения/отказа',
  helpPassFailText:
    'Испытания давлением оцениваются на основе пределов падения давления и требований ко времени удержания:',
  helpPassCriteria: 'Критерии прохождения',
  helpPassCriteriaText:
    'Падение давления остается в допустимых пределах в периоды удержания. Система сохраняет стабильность.',
  helpFailCriteria: 'Критерии отказа',
  helpFailCriteriaText:
    'Чрезмерное падение давления указывает на утечки или отказ системы. Требуется расследование и ремонт.',
  helpColorCodingTitle: 'Цветовое кодирование',
  helpColorPressure: 'Синий - Линия текущего давления',
  helpColorAcceptable: 'Зеленый - Допустимый диапазон давления',
  helpColorFailed: 'Красный - Неудачный тест или значения вне диапазона',

  // Export Options Section
  helpExportTitle: 'Опции экспорта',
  helpExportIntro:
    'Pressograph поддерживает множество форматов экспорта для различных случаев использования.',
  helpExportPNGTitle: 'Экспорт PNG',
  helpExportPNGDesc: 'Экспорт изображений PNG высокого разрешения для отчетов и презентаций.',
  helpExportPNGFeature1: 'Настраиваемые размеры (ширина × высота)',
  helpExportPNGFeature2: 'Вывод высокого разрешения (коэффициент масштаба 2x-4x)',
  helpExportPNGFeature3: 'Выбор темы (светлый или темный фон)',
  helpExportPNGFeature4: 'Подходит для встраивания в документы и презентации',
  helpExportPDFTitle: 'Экспорт PDF',
  helpExportPDFDesc: 'Создание профессиональных PDF-документов с графиком и метаданными.',
  helpExportPDFFeature1: 'Множество размеров страницы (A4, Letter, Legal)',
  helpExportPDFFeature2: 'Включает метаданные и параметры испытания',
  helpExportPDFFeature3: 'Профессиональное форматирование для официальных отчетов',
  helpExportPDFFeature4: 'Поисковый текст и встроенные метаданные',
  helpExportJSONTitle: 'Экспорт JSON',
  helpExportJSONDesc:
    'Сохранение полной конфигурации испытания в формате JSON для резервного копирования или повторного использования.',
  helpPerformanceTipsTitle: 'Советы по производительности',
  helpPerformanceTip1:
    'Используйте умеренные размеры для более быстрого экспорта (например, 1920×1080 вместо 4K)',
  helpPerformanceTip2:
    'Экспорт PDF может занять больше времени для сложных графиков с большим количеством точек данных',
  helpPerformanceTip3:
    'Экспорт JSON мгновенный и рекомендуется для резервного копирования конфигураций',
  helpPerformanceTip4:
    'Закройте другие вкладки браузера для оптимальной производительности во время экспорта',

  // FAQ Section
  helpFAQTitle: 'Часто задаваемые вопросы',
  helpFAQ1Q: 'Какова рекомендуемая длительность испытания?',
  helpFAQ1A:
    'Стандартные испытания давлением обычно длятся 24 часа. Расширенные испытания могут длиться 48-72 часа. Короткие испытания (4-8 часов) используются для быстрой проверки.',
  helpFAQ2Q: 'Как добавить промежуточные испытания давлением?',
  helpFAQ2A:
    'На главной странице прокрутите до раздела "Промежуточные испытания давлением" и нажмите "Добавить испытание". Настройте время, длительность и опциональные параметры давления для каждого промежуточного испытания.',
  helpFAQ3Q: 'Могу ли я импортировать предыдущие конфигурации испытаний?',
  helpFAQ3A:
    'Да! Экспортируйте испытание в формате JSON, затем используйте кнопку "Импорт JSON" для загрузки конфигурации в будущей сессии.',
  helpFAQ4Q: 'Какие браузеры поддерживаются?',
  helpFAQ4A:
    'Pressograph лучше всего работает на современных браузерах: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+. Требуется поддержка Canvas API для отрисовки графиков.',
  helpFAQ5Q: 'Почему мой экспорт занимает много времени?',
  helpFAQ5A:
    'Большие размеры (4K+) или сложные графики с множеством промежуточных испытаний могут замедлить экспорт. Попробуйте уменьшить размеры или закрыть другие вкладки.',
  helpFAQ6Q: 'Как переключаться между светлой и темной темами?',
  helpFAQ6A:
    'Нажмите кнопку переключения темы в панели навигации или используйте комбинацию клавиш Ctrl+T (Cmd+T на Mac).',
  helpFAQ7Q: 'Могу ли я поделиться графиками с другими?',
  helpFAQ7A:
    'Да! Экспортируйте как PNG или PDF для обмена по электронной почте или в документах. JSON-файлы можно делиться с другими пользователями Pressograph для репликации точной конфигурации.',
  helpFAQ8Q: 'Где хранятся данные моих испытаний?',
  helpFAQ8A:
    'Данные испытаний хранятся в базе данных приложения. Экспортируйте JSON-файлы для локальных резервных копий. Администраторы могут настроить политики резервного копирования.',

  // Keyboard Shortcuts Section
  helpKeyboardTitle: 'Клавиатурные сочетания',
  helpKeyboardIntro: 'Ускорьте свою работу с помощью этих клавиатурных сочетаний:',
  helpKeyboardExportPNG: 'Экспорт как PNG',
  helpKeyboardExportPDF: 'Экспорт как PDF',
  helpKeyboardSaveJSON: 'Сохранить конфигурацию как JSON',
  helpKeyboardToggleTheme: 'Переключить темную/светлую тему',
  helpKeyboardHelp: 'Открыть страницу помощи',
  helpKeyboardNote: 'Примечание: На macOS используйте Cmd вместо Ctrl для сочетаний клавиш.',

  // History Page
  historyTitle: 'История графиков',
  historySubtitle: 'Просмотр и управление графиками испытаний давлением',
  historySearchPlaceholder: 'Поиск по номеру испытания...',
  historyFilters: {
    dateRange: 'Диапазон дат',
    from: 'С',
    to: 'По',
    format: 'Формат экспорта',
    allFormats: 'Все форматы',
    sortBy: 'Сортировать по',
    newestFirst: 'Сначала новые',
    oldestFirst: 'Сначала старые',
    byTestNumber: 'По номеру испытания',
  },
  historyTable: {
    testNumber: 'Номер испытания',
    title: 'Название графика',
    format: 'Формат',
    fileSize: 'Размер файла',
    generationTime: 'Время генерации',
    createdAt: 'Создано',
    creationDate: 'Дата создания',
    comment: 'Комментарий',
    status: 'Статус',
    actions: 'Действия',
  },
  historyActions: {
    view: 'Просмотр',
    download: 'Скачать',
    downloadJSON: 'Скачать JSON',
    share: 'Поделиться',
    delete: 'Удалить',
    regenerate: 'Перегенерировать',
    edit: 'Редактировать',
  },
  historyEmpty: {
    title: 'История пуста',
    description: 'Создайте свой первый график, чтобы увидеть его здесь',
    button: 'Создать график',
  },
  historyDeleteModal: {
    title: 'Удалить график',
    message: 'Вы уверены, что хотите удалить этот график? Это действие необратимо.',
    cancel: 'Отмена',
    confirm: 'Удалить',
  },
  historyToast: {
    fetchError: 'Не удалось загрузить историю',
    deleteSuccess: 'График успешно удален',
    deleteError: 'Не удалось удалить график',
    downloadError: 'Не удалось скачать график',
    shareSuccess: 'Ссылка скопирована в буфер обмена!',
    shareError: 'Не удалось создать ссылку для обмена',
    commentUpdated: 'Комментарий обновлен',
    commentUpdateError: 'Ошибка обновления комментария',
    graphRegenerated: 'График регенерирован!',
    regenerateError: 'Ошибка регенерации',
    jsonExported: 'JSON экспортирован!',
  },
  historyStatus: {
    success: 'Успешно',
    failed: 'Ошибка',
    pending: 'В процессе',
  },
  historyJustNow: 'только что',
  historyLoading: 'Загрузка истории...',
  historyNoResults: 'Графики не найдены по вашим фильтрам',
  historyShowingResults: 'Показано {{from}} до {{to}} из {{total}} графиков',
  historyCommentPlaceholder: 'Введите комментарий...',
  historyNoComment: 'Комментарий отсутствует',
  historyCancel: 'Отмена',
  historySave: 'Сохранить',
  historyRegenerateModal: {
    title: 'Регенерировать график',
    description:
      'Регенерировать этот график с обновленным отображением шрифтов и выбрать формат экспорта и тему.',
    exportFormat: 'Формат экспорта',
    graphTheme: 'Тема графика',
    highQualityImage: 'Изображение высокого качества',
    printableDocument: 'Печатный документ',
    dataExport: 'Экспорт данных',
    lightBackground: 'Светлый фон',
    darkBackground: 'Темный фон',
    originalComment: 'Исходный комментарий',
    cancel: 'Отмена',
    regenerate: 'Регенерировать',
  },
  historyCommentModal: {
    title: 'Комментарий',
    edit: 'Редактировать',
    cancel: 'Отмена',
    save: 'Сохранить',
    placeholder: 'Введите комментарий...',
    noComment: 'Комментарий отсутствует',
  },

  // Error Boundary
  errorBoundaryTitle: 'Что-то пошло не так',
  errorBoundaryDescription: 'Произошла непредвиденная ошибка. Приносим извинения за неудобства.',
  errorBoundaryUnknownError: 'Произошла неизвестная ошибка',
  errorBoundaryHelpText:
    'Если проблема сохраняется, попробуйте обновить страницу или обратитесь в службу поддержки.',
  errorBoundaryReset: 'Попробовать снова',
  errorBoundaryGoBack: 'Назад',
  errorBoundaryReportIssue: 'Сообщить о проблеме',

  // Validation
  validation: {
    required: 'Это поле обязательно',
    durationRange: 'Длительность должна быть от 0.01 до 1000 часов',
    workingPressureRange: 'Рабочее давление должно быть от 0.01 до 100 МПа',
    maxPressureRange: 'Макс. давление должно быть от 0.01 до 100 МПа',
    pressureDurationRange: 'Длительность должна быть от 1 до 10000 минут',
    temperatureRange: 'Температура должна быть от -273 до 1000 °C',
    titleMaxLength: 'Название не может превышать 100 символов',
    invalidNumber: 'Пожалуйста, введите корректное число',
    formHasErrors: 'Исправьте ошибки перед отправкой формы',
    mustBeGreaterThanWorking: 'Макс. давление должно быть больше рабочего',
  },

  // Accessibility
  accessibility: {
    skipToContent: 'Перейти к основному содержимому',
    mainNavigation: 'Основная навигация',
    applicationLogo: 'Логотип приложения Pressograph',
    searchPlaceholder: 'Поиск в истории',
    toggleTheme: 'Переключить тёмную/светлую тему',
    historyPage: 'Страница истории тестов',
    historyTable: 'Таблица истории тестов',
    searchHistory: 'Поиск в истории тестов',
    testRow: 'Строка результата теста',
    previewGraph: 'Предпросмотр графика теста №{{number}}',
    downloadGraph: 'Скачать график теста №{{number}}',
    deleteGraph: 'Удалить график теста №{{number}}',
    shareGraph: 'Поделиться графиком теста №{{number}}',
    helpPage: 'Страница справки и документации',
    helpNavigation: 'Навигация по разделам справки',
    searchHelp: 'Поиск в документации',
    keyboardShortcuts: 'Горячие клавиши',
    ctrlKSearch: 'Нажмите Ctrl+K для поиска',
    ctrlHHelp: 'Нажмите Ctrl+H для справки',
    escClose: 'Нажмите Esc для закрытия',
    backToTop: 'Вернуться наверх',
  },
};
