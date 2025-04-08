# Telegram Stars Roulette

Веб-приложение европейской рулетки для Telegram с использованием Stars в качестве валюты.

## Особенности
- 🎰 Европейская рулетка (37 ячеек: 0-36)
- 💫 Интеграция с Telegram Stars
- 🎲 Анимированное колесо рулетки на Canvas
- 📱 Адаптивный дизайн
- 💾 Сохранение истории игр

## Установка

1. Разместите файлы на веб-сервере:
```bash
git clone [ваш-репозиторий]
cd roulette-webapp
```

2. Настройте Telegram WebApp:
- Создайте бота через @BotFather
- Добавьте веб-приложение к боту
- Укажите URL вашего приложения

## Интеграция в Telegram

### Через бота
```javascript
// Пример команды для бота
bot.command('roulette', (ctx) => {
    ctx.reply('Играть в рулетку', {
        reply_markup: {
            inline_keyboard: [[
                { text: '🎰 Открыть рулетку', web_app: { url: 'URL_ВАШЕГО_ПРИЛОЖЕНИЯ' } }
            ]]
        }
    });
});
```

### Через канал
Добавьте кнопку с ссылкой:
```
https://t.me/iv?url=URL_ВАШЕГО_ПРИЛОЖЕНИЯ&rhash=XXXXX
```

## Разработка

### Структура проекта
```
roulette-webapp/
├── index.html      # Основной HTML
├── style.css       # Стили
├── script.js       # Логика игры
└── sounds/         # Звуковые эффекты
```

### Технологии
- HTML5 Canvas для рулетки
- CSS3 для анимаций и стилей
- JavaScript (ES6+)
- Telegram WebApp API

## Лицензия
MIT 