// ═══════════════════════════════════════════════════════════════════
// Pressure Tests List Component
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useTestStore } from '../../store/useTestStore';
import { useLanguage } from '../../i18n';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  NumberInput,
  Chip,
  Divider,
  Avatar,
  Badge,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  User
} from '@heroui/react';

export const PressureTestsList = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();
  const { pressureTests, addPressureTest, removePressureTest, duplicatePressureTest, updatePressureTest, clearAllTests } =
    useTestStore();

  return (
    <Card shadow="lg" radius="lg">
      <CardHeader className="flex justify-between items-center pb-4">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity flex-1"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="w-8 h-8 flex items-center justify-center bg-default-900 dark:bg-default-100 rounded-md font-semibold text-default-50 dark:text-default-900 text-sm">2</div>
          <h2 className="text-base font-semibold text-foreground uppercase flex-1">
            {t.intermediatePressureTests}
          </h2>
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'} text-default-500`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {!isCollapsed && (
          <div className="flex gap-2 ml-3">
            <Button
              variant="bordered"
              size="sm"
              onPress={addPressureTest}
              startContent={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              {t.addTest}
            </Button>
            {pressureTests.length > 0 && (
              <Button
                variant="flat"
                size="sm"
                onPress={clearAllTests}
                startContent={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                }
              >
                {t.clearAll}
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      {!isCollapsed && (
        <CardBody>
          {pressureTests.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-default-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-default-500 text-sm">
                {t.noIntermediateTests}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pressureTests.map((test, index) => (
                <div key={test.id}>
                  {index > 0 && <Divider className="my-4" />}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Badge
                          content={index + 1}
                          color="primary"
                          placement="bottom-right"
                          size="lg"
                          classNames={{
                            badge: "text-xs font-bold"
                          }}
                        >
                          <Avatar
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            }
                            classNames={{
                              base: "bg-gradient-to-br from-primary-400 to-primary-600",
                              icon: "text-white"
                            }}
                            size="sm"
                          />
                        </Badge>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{t.test} {index + 1}</p>
                          <p className="text-xs text-default-500">
                            {test.time}{t.unitHours} • {test.duration}{t.unitMinutes} • {test.pressure || t.defaultValue} {t.unitMPa}
                          </p>
                        </div>
                      </div>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Test actions">
                          <DropdownItem
                            key="duplicate"
                            startContent={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            }
                            onPress={() => duplicatePressureTest(test.id)}
                          >
                            {t.duplicate}
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            color="danger"
                            className="text-danger"
                            startContent={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            }
                            onPress={() => removePressureTest(test.id)}
                          >
                            {t.delete}
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                    <div className="space-y-4">
                      {/* Основные параметры */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <NumberInput
                          label={t.testTimeLabel}
                          labelPlacement="outside"
                          step={0.1}
                          value={test.time}
                          onValueChange={(value) =>
                            updatePressureTest(test.id, 'time', value || 0)
                          }
                          description={t.testTimeHelper}
                          variant="bordered"
                          classNames={{
                            label: "font-medium text-sm",
                            input: "text-sm",
                            description: "text-xs",
                          }}
                          endContent={
                            <span className="text-sm text-default-400">{t.unitHours}</span>
                          }
                        />
                        <NumberInput
                          label={t.testDurationLabelTest}
                          labelPlacement="outside"
                          step={1}
                          value={test.duration}
                          onValueChange={(value) =>
                            updatePressureTest(test.id, 'duration', value || 0)
                          }
                          description={t.testDurationHelperTest}
                          variant="bordered"
                          classNames={{
                            label: "font-medium text-sm",
                            input: "text-sm",
                            description: "text-xs",
                          }}
                          endContent={
                            <span className="text-sm text-default-400">{t.unitMinutes}</span>
                          }
                        />
                        <NumberInput
                          label={t.testPressure}
                          labelPlacement="outside"
                          step={0.01}
                          placeholder={t.defaultValue}
                          value={test.pressure}
                          onValueChange={(value) =>
                            updatePressureTest(test.id, 'pressure', value)
                          }
                          description={t.testPressureOptional}
                          variant="bordered"
                          classNames={{
                            label: "font-medium text-sm",
                            input: "text-sm",
                            description: "text-xs",
                          }}
                          endContent={
                            <span className="text-sm text-default-400">{t.unitMPa}</span>
                          }
                        />
                      </div>

                      {/* Параметры дрейфа и целевого давления */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <NumberInput
                          label={t.minPressure}
                          labelPlacement="outside"
                          step={0.01}
                          placeholder={t.optional}
                          value={test.minPressure}
                          onValueChange={(value) =>
                            updatePressureTest(test.id, 'minPressure', value)
                          }
                          description={t.minPressureDriftDown}
                          variant="bordered"
                          classNames={{
                            label: "font-medium text-sm",
                            input: "text-sm",
                            description: "text-xs",
                          }}
                          endContent={
                            <span className="text-sm text-default-400">{t.unitMPa}</span>
                          }
                        />
                        <NumberInput
                          label={t.maxPressure}
                          labelPlacement="outside"
                          step={0.01}
                          placeholder={t.optional}
                          value={test.maxPressure}
                          onValueChange={(value) =>
                            updatePressureTest(test.id, 'maxPressure', value)
                          }
                          description={t.maxPressureDriftUp}
                          variant="bordered"
                          classNames={{
                            label: "font-medium text-sm",
                            input: "text-sm",
                            description: "text-xs",
                          }}
                          endContent={
                            <span className="text-sm text-default-400">{t.unitMPa}</span>
                          }
                        />
                        <NumberInput
                          label={t.targetPressure}
                          labelPlacement="outside"
                          step={0.01}
                          placeholder="0"
                          value={test.targetPressure}
                          onValueChange={(value) =>
                            updatePressureTest(test.id, 'targetPressure', value)
                          }
                          description={t.targetPressureAfterRelease}
                          variant="bordered"
                          classNames={{
                            label: "font-medium text-sm",
                            input: "text-sm",
                            description: "text-xs",
                          }}
                          endContent={
                            <span className="text-sm text-default-400">{t.unitMPa}</span>
                          }
                        />
                        <NumberInput
                          label={t.holdDrift}
                          labelPlacement="outside"
                          step={0.01}
                          placeholder="0"
                          value={test.holdDrift}
                          onValueChange={(value) =>
                            updatePressureTest(test.id, 'holdDrift', value)
                          }
                          description={t.holdDriftUntilNext}
                          variant="bordered"
                          classNames={{
                            label: "font-medium text-sm",
                            input: "text-sm",
                            description: "text-xs",
                          }}
                          endContent={
                            <span className="text-sm text-default-400">{t.unitMPa}</span>
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      )}
    </Card>
  );
};
