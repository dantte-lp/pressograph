# Nginx Configuration

Конфигурационные файлы для Nginx (production frontend).

## 📁 Файлы

- `nginx.conf.example` - основная конфигурация Nginx
- `default.conf.example` - site configuration для React SPA
- `security-headers.conf.example` - HTTP security headers
- `gzip.conf.example` - настройки сжатия

## 🚀 Использование

```bash
# Скопировать examples
cp nginx.conf.example nginx.conf
cp default.conf.example default.conf

# Редактировать под свои нужды
nano nginx.conf

# Примонтировать в compose
# См. deploy/compose/compose.prod.yaml
```

## 📖 Документация

[Nginx Documentation](https://nginx.org/en/docs/)
