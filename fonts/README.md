# Шрифты системы (с 3 сентября 2026)

| Роль | Гарнитура | Файл | Лицензия |
|---|---|---|---|
| H1, H2, субтитры | Manrope ExtraBold (800) | `Manrope-Variable.ttf` | OFL-1.1, `LICENSE-MANROPE.txt` |
| Вторичный текст, подстрочники | Manrope Regular (400) / Medium (500) | тот же файл | OFL-1.1 |
| Техническая разметка: надзаголовки, адреса, номера, терминал | JetBrains Mono (700) | `JetBrainsMono-Variable.ttf` | OFL-1.1, `LICENSE-JETBRAINS-MONO.txt` |
| Рукописный второй голос | STIX Two Text 700 Italic | `stix-two-text-*-700-italic.woff2` | OFL-1.1 |
| Запасной H1 | Benzin Bold | `Benzin-Bold.otf` (из системы Александра, не распространяется) | проприетарный |

Gilroy и Soyuz Grotesk выведены из системы (платные, в репозиторий не идут). Шрифты в проект кладёт
`bash scripts/fonts.sh videos/<project>`; сборщик сам пишет `@font-face` по файлам в `assets/fonts`.
