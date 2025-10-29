// ═══════════════════════════════════════════════════════════════════
// Help Page - Comprehensive Documentation and Support
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Accordion,
  AccordionItem,
  Button,
  Chip,
} from '@heroui/react';
import { useLanguage } from '../i18n';
import { useShallow } from 'zustand/react/shallow';
import { useThemeStore } from '../store/useThemeStore';
import toast from 'react-hot-toast';

interface Section {
  id: string;
  titleKey: string;
  content: React.ReactNode;
}

export const Help: React.FC = () => {
  const { t } = useLanguage();
  const theme = useThemeStore(useShallow((state) => state.theme));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['getting-started']));

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value.toLowerCase());
  }, []);

  // Copy to clipboard function
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t.helpCopySuccess || 'Copied to clipboard!');
    }).catch(() => {
      toast.error(t.helpCopyError || 'Failed to copy');
    });
  }, [t]);

  // Code block component with copy button
  const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language = 'json' }) => (
    <div className="relative my-4">
      <div className={`rounded-lg p-4 font-mono text-sm overflow-x-auto ${
        theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'
      }`}>
        <Button
          size="sm"
          variant="flat"
          className="absolute top-2 right-2"
          onPress={() => copyToClipboard(code)}
        >
          {t.helpCopy || 'Copy'}
        </Button>
        <pre className="pr-20">{code}</pre>
      </div>
    </div>
  );

  // Define all help sections
  const sections: Section[] = useMemo(() => [
    {
      id: 'getting-started',
      titleKey: 'helpGettingStartedTitle',
      content: (
        <div className="space-y-4">
          <p className="text-default-700">{t.helpGettingStartedIntro}</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">{t.helpQuickOverview}</h3>
          <p className="text-default-700">{t.helpQuickOverviewText}</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">{t.helpLoginGuide}</h3>
          <ol className="list-decimal list-inside space-y-2 text-default-700">
            <li>{t.helpLoginStep1}</li>
            <li>{t.helpLoginStep2}</li>
            <li>{t.helpLoginStep3}</li>
          </ol>

          <h3 className="text-xl font-semibold mt-6 mb-3">{t.helpFirstGraphTitle}</h3>
          <ol className="list-decimal list-inside space-y-2 text-default-700">
            <li>{t.helpFirstGraphStep1}</li>
            <li>{t.helpFirstGraphStep2}</li>
            <li>{t.helpFirstGraphStep3}</li>
            <li>{t.helpFirstGraphStep4}</li>
            <li>{t.helpFirstGraphStep5}</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'test-configuration',
      titleKey: 'helpTestConfigTitle',
      content: (
        <div className="space-y-4">
          <p className="text-default-700">{t.helpTestConfigIntro}</p>

          <div className="space-y-6 mt-6">
            <div>
              <h4 className="font-semibold text-lg mb-2">
                <Chip color="primary" variant="flat" size="sm" className="mr-2">{t.testNumber}</Chip>
              </h4>
              <p className="text-default-700">{t.helpTestNumberDesc}</p>
              <p className="text-sm text-default-500 mt-1">{t.helpTestNumberRange}</p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2">
                <Chip color="primary" variant="flat" size="sm" className="mr-2">{t.temperature}</Chip>
              </h4>
              <p className="text-default-700">{t.helpTemperatureDesc}</p>
              <p className="text-sm text-default-500 mt-1">{t.helpTemperatureRange}</p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2">
                <Chip color="primary" variant="flat" size="sm" className="mr-2">{t.graphTitle}</Chip>
              </h4>
              <p className="text-default-700">{t.helpGraphTitleDesc}</p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2">
                <Chip color="primary" variant="flat" size="sm" className="mr-2">{t.testDuration}</Chip>
              </h4>
              <p className="text-default-700">{t.helpTestDurationDesc}</p>
              <p className="text-sm text-default-500 mt-1">{t.helpTestDurationRange}</p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2">
                <Chip color="primary" variant="flat" size="sm" className="mr-2">{t.workingPressure}</Chip>
              </h4>
              <p className="text-default-700">{t.helpWorkingPressureDesc}</p>
              <p className="text-sm text-default-500 mt-1">{t.helpWorkingPressureRange}</p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2">
                <Chip color="primary" variant="flat" size="sm" className="mr-2">{t.maxPressure}</Chip>
              </h4>
              <p className="text-default-700">{t.helpMaxPressureDesc}</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-3">{t.helpExampleConfigTitle}</h3>
          <p className="text-default-700">{t.helpExampleConfigText}</p>
          <CodeBlock code={`{
  "testNumber": "2024-001",
  "temperature": 20,
  "graphTitle": "Pressure Test - Building A",
  "testDuration": 24,
  "workingPressure": 1.5,
  "maxPressure": 2.0
}`} />
        </div>
      ),
    },
    {
      id: 'graph-interpretation',
      titleKey: 'helpGraphInterpretTitle',
      content: (
        <div className="space-y-4">
          <p className="text-default-700">{t.helpGraphInterpretIntro}</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">{t.helpReadingCurveTitle}</h3>
          <p className="text-default-700">{t.helpReadingCurveText}</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">{t.helpStagesTitle}</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">
                <Chip color="success" variant="flat" size="sm" className="mr-2">1</Chip>
                {t.helpStageHold}
              </h4>
              <p className="text-default-700">{t.helpStageHoldDesc}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">
                <Chip color="warning" variant="flat" size="sm" className="mr-2">2</Chip>
                {t.helpStageDrop}
              </h4>
              <p className="text-default-700">{t.helpStageDropDesc}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">
                <Chip color="primary" variant="flat" size="sm" className="mr-2">3</Chip>
                {t.helpStageDrain}
              </h4>
              <p className="text-default-700">{t.helpStageDrainDesc}</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-3">{t.helpPassFailTitle}</h3>
          <p className="text-default-700">{t.helpPassFailText}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card className="border-2 border-success">
              <CardBody>
                <h4 className="font-semibold text-success mb-2">{t.helpPassCriteria}</h4>
                <p className="text-sm text-default-700">{t.helpPassCriteriaText}</p>
              </CardBody>
            </Card>

            <Card className="border-2 border-danger">
              <CardBody>
                <h4 className="font-semibold text-danger mb-2">{t.helpFailCriteria}</h4>
                <p className="text-sm text-default-700">{t.helpFailCriteriaText}</p>
              </CardBody>
            </Card>
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-3">{t.helpColorCodingTitle}</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-blue-500"></div>
              <span className="text-default-700">{t.helpColorPressure}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-green-500"></div>
              <span className="text-default-700">{t.helpColorAcceptable}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-red-500"></div>
              <span className="text-default-700">{t.helpColorFailed}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'export-options',
      titleKey: 'helpExportTitle',
      content: (
        <div className="space-y-4">
          <p className="text-default-700">{t.helpExportIntro}</p>

          <div className="space-y-6 mt-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">
                <Chip color="primary" variant="flat" className="mr-2">PNG</Chip>
                {t.helpExportPNGTitle}
              </h3>
              <p className="text-default-700 mb-2">{t.helpExportPNGDesc}</p>
              <ul className="list-disc list-inside space-y-1 text-default-700">
                <li>{t.helpExportPNGFeature1}</li>
                <li>{t.helpExportPNGFeature2}</li>
                <li>{t.helpExportPNGFeature3}</li>
                <li>{t.helpExportPNGFeature4}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">
                <Chip color="danger" variant="flat" className="mr-2">PDF</Chip>
                {t.helpExportPDFTitle}
              </h3>
              <p className="text-default-700 mb-2">{t.helpExportPDFDesc}</p>
              <ul className="list-disc list-inside space-y-1 text-default-700">
                <li>{t.helpExportPDFFeature1}</li>
                <li>{t.helpExportPDFFeature2}</li>
                <li>{t.helpExportPDFFeature3}</li>
                <li>{t.helpExportPDFFeature4}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">
                <Chip color="warning" variant="flat" className="mr-2">JSON</Chip>
                {t.helpExportJSONTitle}
              </h3>
              <p className="text-default-700 mb-2">{t.helpExportJSONDesc}</p>
              <CodeBlock code={`{
  "testNumber": "2024-001",
  "temperature": 20,
  "graphTitle": "Pressure Test",
  "testDuration": 24,
  "workingPressure": 1.5,
  "maxPressure": 2.0,
  "intermediateTests": [
    {
      "time": 6,
      "duration": 30,
      "testPressure": 1.5
    }
  ]
}`} />
            </div>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-3">{t.helpPerformanceTipsTitle}</h3>
          <ul className="list-disc list-inside space-y-2 text-default-700">
            <li>{t.helpPerformanceTip1}</li>
            <li>{t.helpPerformanceTip2}</li>
            <li>{t.helpPerformanceTip3}</li>
            <li>{t.helpPerformanceTip4}</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'faq',
      titleKey: 'helpFAQTitle',
      content: (
        <div className="space-y-4">
          <Accordion variant="bordered">
            <AccordionItem
              key="faq-1"
              aria-label={t.helpFAQ1Q}
              title={<span className="font-semibold">{t.helpFAQ1Q}</span>}
            >
              <p className="text-default-700">{t.helpFAQ1A}</p>
            </AccordionItem>

            <AccordionItem
              key="faq-2"
              aria-label={t.helpFAQ2Q}
              title={<span className="font-semibold">{t.helpFAQ2Q}</span>}
            >
              <p className="text-default-700">{t.helpFAQ2A}</p>
            </AccordionItem>

            <AccordionItem
              key="faq-3"
              aria-label={t.helpFAQ3Q}
              title={<span className="font-semibold">{t.helpFAQ3Q}</span>}
            >
              <p className="text-default-700">{t.helpFAQ3A}</p>
            </AccordionItem>

            <AccordionItem
              key="faq-4"
              aria-label={t.helpFAQ4Q}
              title={<span className="font-semibold">{t.helpFAQ4Q}</span>}
            >
              <p className="text-default-700">{t.helpFAQ4A}</p>
            </AccordionItem>

            <AccordionItem
              key="faq-5"
              aria-label={t.helpFAQ5Q}
              title={<span className="font-semibold">{t.helpFAQ5Q}</span>}
            >
              <p className="text-default-700">{t.helpFAQ5A}</p>
            </AccordionItem>

            <AccordionItem
              key="faq-6"
              aria-label={t.helpFAQ6Q}
              title={<span className="font-semibold">{t.helpFAQ6Q}</span>}
            >
              <p className="text-default-700">{t.helpFAQ6A}</p>
            </AccordionItem>

            <AccordionItem
              key="faq-7"
              aria-label={t.helpFAQ7Q}
              title={<span className="font-semibold">{t.helpFAQ7Q}</span>}
            >
              <p className="text-default-700">{t.helpFAQ7A}</p>
            </AccordionItem>

            <AccordionItem
              key="faq-8"
              aria-label={t.helpFAQ8Q}
              title={<span className="font-semibold">{t.helpFAQ8Q}</span>}
            >
              <p className="text-default-700">{t.helpFAQ8A}</p>
            </AccordionItem>
          </Accordion>
        </div>
      ),
    },
    {
      id: 'keyboard-shortcuts',
      titleKey: 'helpKeyboardTitle',
      content: (
        <div className="space-y-4">
          <p className="text-default-700">{t.helpKeyboardIntro}</p>

          <div className="space-y-3 mt-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-content2">
              <span className="text-default-700">{t.helpKeyboardExportPNG}</span>
              <Chip variant="flat" size="sm">Ctrl + E</Chip>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-content2">
              <span className="text-default-700">{t.helpKeyboardExportPDF}</span>
              <Chip variant="flat" size="sm">Ctrl + P</Chip>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-content2">
              <span className="text-default-700">{t.helpKeyboardSaveJSON}</span>
              <Chip variant="flat" size="sm">Ctrl + S</Chip>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-content2">
              <span className="text-default-700">{t.helpKeyboardToggleTheme}</span>
              <Chip variant="flat" size="sm">Ctrl + T</Chip>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-content2">
              <span className="text-default-700">{t.helpKeyboardHelp}</span>
              <Chip variant="flat" size="sm">F1</Chip>
            </div>
          </div>

          <p className="text-sm text-default-500 mt-6">{t.helpKeyboardNote}</p>
        </div>
      ),
    },
  ], [t, theme, copyToClipboard]);

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery) return sections;

    return sections.filter(section => {
      const title = t[section.titleKey as keyof typeof t];
      if (typeof title === 'string') {
        return title.toLowerCase().includes(searchQuery);
      }
      return false;
    });
  }, [sections, searchQuery, t]);

  // Scroll to section when active section changes
  useEffect(() => {
    if (activeSection) {
      const element = document.getElementById(`section-${activeSection}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [activeSection]);

  // Sidebar navigation items
  const navigationItems = [
    { id: 'getting-started', titleKey: 'helpGettingStartedTitle', icon: '🚀' },
    { id: 'test-configuration', titleKey: 'helpTestConfigTitle', icon: '⚙️' },
    { id: 'graph-interpretation', titleKey: 'helpGraphInterpretTitle', icon: '📊' },
    { id: 'export-options', titleKey: 'helpExportTitle', icon: '💾' },
    { id: 'faq', titleKey: 'helpFAQTitle', icon: '❓' },
    { id: 'keyboard-shortcuts', titleKey: 'helpKeyboardTitle', icon: '⌨️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t.helpTitle}</h1>
          <p className="text-default-600">{t.helpSubtitle}</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <Input
            placeholder={t.helpSearchPlaceholder}
            value={searchQuery}
            onValueChange={handleSearchChange}
            size="lg"
            startContent={<span className="text-default-400">🔍</span>}
            classNames={{
              input: 'text-base',
              inputWrapper: 'shadow-sm',
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <Card className="sticky top-4 shadow-lg">
              <CardHeader>
                <h2 className="text-lg font-semibold">{t.helpSections}</h2>
              </CardHeader>
              <CardBody className="p-2">
                <nav className="space-y-1">
                  {navigationItems.map((item) => {
                    const title = t[item.titleKey as keyof typeof t];
                    return (
                      <Button
                        key={item.id}
                        variant={activeSection === item.id ? 'flat' : 'light'}
                        color={activeSection === item.id ? 'primary' : 'default'}
                        className="w-full justify-start"
                        onPress={() => setActiveSection(item.id)}
                      >
                        <span className="mr-2">{item.icon}</span>
                        {typeof title === 'string' ? title : ''}
                      </Button>
                    );
                  })}
                </nav>
              </CardBody>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            {filteredSections.length > 0 ? (
              <div className="space-y-6">
                {filteredSections.map((section) => {
                  const title = t[section.titleKey as keyof typeof t];
                  return (
                    <Card key={section.id} id={`section-${section.id}`} className="shadow-lg">
                      <CardHeader>
                        <h2 className="text-2xl font-bold">
                          {typeof title === 'string' ? title : ''}
                        </h2>
                      </CardHeader>
                      <CardBody>
                        {section.content}
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="shadow-lg">
                <CardBody className="py-20 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-2xl font-semibold mb-2">{t.helpNoResults}</h2>
                  <p className="text-default-600">{t.helpNoResultsText}</p>
                </CardBody>
              </Card>
            )}
          </main>
        </div>

        {/* Back to Top Button (Mobile) */}
        <Button
          className="fixed bottom-6 right-6 lg:hidden shadow-lg"
          color="primary"
          isIconOnly
          onPress={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ↑
        </Button>
      </div>
    </div>
  );
};

export default Help;
