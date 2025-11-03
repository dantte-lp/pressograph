# Observability Stack Images Update 2025

## Обновленные образы (Latest versions)

Все образы обновлены на latest версии согласно официальным репозиториям по состоянию на октябрь 2025.

### 🔄 Обновленные образы

| Компонент           | Было                 | Стало                        | База                |
| ------------------- | -------------------- | ---------------------------- | ------------------- |
| VictoriaMetrics     | v1.105.0             | **latest** (v1.124.0+)       | Alpine 3.21.3       |
| vmagent             | v1.105.0             | **latest** (v1.124.0+)       | Alpine 3.21.3       |
| VictoriaLogs        | v0.40.0-victorialogs | **latest-victorialogs**      | Alpine              |
| Grafana             | 11.3.0               | **latest-ubuntu** (v12.1.1+) | **Ubuntu 24.04** ✅ |
| Promtail            | 3.0.0                | **latest**                   | Alpine              |
| Tempo               | 2.6.1                | **latest** (Oct 2025)        | Alpine              |
| PostgreSQL Exporter | v0.15.0              | **latest**                   | Alpine              |
| Node Exporter       | v1.8.2               | **latest**                   | Alpine              |

---

## 🤔 Почему Alpine вместо Debian?

### VictoriaMetrics ecosystem

**Официальные образы:** VictoriaMetrics предоставляет только **Alpine** и **scratch-based** образы.

**Нет Debian версий:** Официальная документация подтверждает:

- Alpine-based images - стандарт (с shell и package manager для debugging)
- Scratch-based images - минимальные (только бинарник, production use)
- **Debian-based - НЕ ДОСТУПНЫ**

**Bitnami альтернатива (устарела):**

- Bitnami ранее предлагал Debian 12 образы (`bitnami/victoriametrics-*:*-debian-12-r*`)
- ⚠️ **С августа 2025** Bitnami прекращает поддержку Debian-based образов
- Все Bitnami образы перемещаются в Legacy репозиторий (`docker.io/bitnamilegacy`)
- Legacy образы НЕ получают обновления и НЕ поддерживаются

**Вывод:** Используем официальные Alpine образы (latest, стабильные, поддерживаемые).

---

### Grafana

**Ubuntu-based образы:** ✅ **ДОСТУПНЫ** и используются!

**Изменение:**

```yaml
# Было (Alpine)
image: docker.io/grafana/grafana:11.3.0

# Стало (Ubuntu)
image: docker.io/grafana/grafana:latest-ubuntu  # v12.1.1+
```

**Преимущества Ubuntu-based:**

- Базируется на Ubuntu 24.04 LTS
- Больше инструментов для debugging
- Лучшая совместимость с некоторыми плагинами
- Рекомендуется для production использования

**Размер:** Ubuntu образ немного больше (~500MB vs ~350MB Alpine), но преимущества перевешивают.

---

### Promtail, Tempo

**Официальные образы:** Grafana Labs предоставляет только Alpine-based образы.

**Нет Ubuntu/Debian версий:** Не предлагаются официально.

**Вывод:** Используем официальные Alpine образы (latest).

---

### PostgreSQL Exporter, Node Exporter

**Prometheus ecosystem:** Все exporters базируются на Alpine или scratch.

**Нет Debian версий:** Не доступны в официальных репозиториях Prometheus Community.

**Вывод:** Используем официальные Alpine образы (latest).

---

## 📊 Сравнение Alpine vs Debian

### Alpine Linux

**Преимущества:**

- ✅ Минимальный размер (~5-15 MB base image)
- ✅ Меньше attack surface (безопаснее)
- ✅ Быстрее скачивание и деплой
- ✅ musl libc (легковесная)
- ✅ Официально поддерживается всеми vendor'ами

**Недостатки:**

- ⚠️ musl libc может иметь совместимость issues (редко)
- ⚠️ Меньше pre-installed tools

### Debian/Ubuntu

**Преимущества:**

- ✅ glibc (широкая совместимость)
- ✅ Больше debugging tools
- ✅ Привычнее для многих admin'ов
- ✅ Лучше для custom builds

**Недостатки:**

- ❌ Больший размер (~100-200 MB base image)
- ❌ Больший attack surface
- ❌ Медленнее скачивание

---

## 🎯 Итоговая стратегия

### Используем:

**Alpine** для:

- VictoriaMetrics ecosystem (нет альтернатив)
- Prometheus exporters (нет альтернатив)
- Promtail, Tempo (нет альтернатив)

**Ubuntu** для:

- ✅ Grafana (доступна Ubuntu версия)

**PostgreSQL:** Debian Trixie (используется в основном стеке)

---

## 🔍 Проверка версий образов

```bash
# VictoriaMetrics
podman pull docker.io/victoriametrics/victoria-metrics:latest
podman inspect victoriametrics/victoria-metrics:latest | grep -i version

# Grafana Ubuntu
podman pull docker.io/grafana/grafana:latest-ubuntu
podman inspect grafana/grafana:latest-ubuntu | grep -i version

# Promtail
podman pull docker.io/grafana/promtail:latest
```

---

## 📅 Дата обновления

**Обновлено:** 29 октября 2025
**Следующая проверка:** январь 2026
**Ответственный:** DevOps team

---

## 🔗 Ссылки

- [VictoriaMetrics Docker Images](https://docs.victoriametrics.com/Quick-Start.html#docker)
- [Grafana Docker Images](https://grafana.com/docs/grafana/latest/setup-grafana/installation/docker/)
- [Bitnami Deprecation Notice](https://github.com/bitnami/containers/issues/83267)
- [Alpine Linux](https://alpinelinux.org/)
- [Prometheus Exporters](https://prometheus.io/docs/instrumenting/exporters/)
