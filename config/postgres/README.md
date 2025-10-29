# PostgreSQL Configuration

Конфигурационные файлы для PostgreSQL database.

## 📁 Структура

```
postgres/
├── postgresql.conf.example     # Основная конфигурация
├── pg_hba.conf.example        # Authentication rules
├── init-scripts/              # SQL скрипты инициализации
└── backup-scripts/            # Скрипты бэкапов
```

## 🚀 Использование

```bash
# Скопировать example
cp postgresql.conf.example postgresql.conf

# Tuning для production
# Используйте https://pgtune.leopard.in.ua/

# Применить
podman-compose -f deploy/compose/compose.prod.yaml up -d --force-recreate postgres
```

## 📖 Документация

[PostgreSQL Documentation](https://www.postgresql.org/docs/)
