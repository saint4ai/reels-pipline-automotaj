# Утверждённые шрифты (DECISIONS.md, 2 сентября 2026)

| Роль | Шрифт | Файл здесь | Статус |
|---|---|---|---|
| H1, крупные заголовки | **Benzin** | нет | файл у Александра на Mac (`~/Library/Fonts`); до его появления H1 набирается Gilroy Black |
| H2, подписи, **субтитры** | **Gilroy** | Gilroy-Black / Heavy / Medium / Regular .ttf | из Windows\Fonts этой машины |
| Акцентные слова в тексте | **STIX Two Text Bold Italic** | stix-two-text-{cyrillic,latin}-700-italic.woff2 | OFL-1.1, LICENSE рядом |
| резерв | Soyuz Grotesk Bold | Soyuz_Grotesk_Bold.otf | пока не используется |

Montserrat и IBM Plex Mono **не утверждены**: были подменой, пока файлов не было в проекте.

Файлы шрифтов в git не хранятся (`.gitignore`). В проект их кладёт `bash scripts/fonts.sh videos/<project>`,
он же печатает готовый блок `@font-face`. Проверка кириллицы была сделана ранее через fontTools
(SETUP.md §3); для новых файлов повторить.
