# Пак пресетов Premiere «POLYAS_REELS_PACK_2026» — разбор и перенос в код

Источник: `C:\Users\<владелец>\Desktop\POLYAS_REELS_PACK_2026` (Polyas Media, t.me/mediapolyas). Два файла `.prfpset` —
это XML Premiere Pro с ключевыми кадрами эффектов; повторно проверены 06.09.2026 (тики 254 016 000 000/с).
Интерполяция содержит коды, скорости, influence и пространственные тангенсы: один код не описывает всю кривую.
Пресет — рецепт эффектов Premiere, не медиа и не готовая библиотека JavaScript. Перенос в GSAP — адаптация,
не автоматический импорт и не пиксельно точная копия. XML не устанавливает условия распространения пака.

## «Анимации текста.prfpset» — 4 пресета Polyas, один рецепт в четырёх направлениях

| Пресет | Gaussian Blur | Сдвиг (доля кадра) | Opacity | Длительность |
|---|---|---|---|---|
| Появление текст (снизу) | 68 → 0 | y 0.568 → 0.5 (+6.9 % высоты) | 4 → 100 | 0.70 с, ease |
| Появление сверху | 68 → 0 | y 0.422 → 0.5 (−7.8 %) | 4 → 100 (за 0.53 с) | 0.70 с |
| Появление слева | 68 → 0 | x 0.328 → 0.5 (−17.2 % ширины) | 0 → 100 | 0.70 с |
| Появление справа | 68 → 0 | x 0.643 → 0.5 (+14.3 %) | 4 → 100 | 0.70 с |

В коде: `enterText(el, at, dir)` в `videos/reels-4-connectors/parts/scenes.js` — blur 28 px CSS (≈ 68 в Premiere),
сдвиг 131 / −149 / −186 / +154 px на кадре 1080×1920, `power2.inOut`, 0.70 с. CSS blur 28 и эта GSAP-кривая —
художественное приближение, не доказанная эквивалентность Gaussian Blur 68 в Adobe.

## «POLYAS_REELS_PACK_2026.prfpset» — 14 записей, включая информационную 00 (13 рабочих)

Внутреннее имя bin — `1. SKTADAS FREE PRESETS (15)`, описание ссылается на sktadas.com. Число в имени bin не равно числу реально найденных записей.

| № | Пресет | Что делает (ключи) | В коде |
|---|---|---|---|
| 01 | Arial Base Text | базовый текст, Scale 70 | — |
| 02 | Subtitle Pop In | scaleY 75 → 105 (0.07 с) → 100 (0.12 с), scaleX 120 | резерв для плашки субтитров |
| 03 | Slide In Up | y +100 % → 0 за 0.83 с, ease | въезд мокапа (`mockup.enter:"up"`) |
| 04 | Slide Out Down | y 0 → +100.58 % за 0.8333 с; последний ключ на 0.05 с позже AnchorOutPoint | `mockup.exit:"down"`, нормализовать границу |
| 05 | Zoom In Center | scale 100 → 130 за 2.0 с | не применяем: DECISIONS «зумы запрещены» |
| 06 | Zoom Out Center | scale 130 → 100 за 2.0 с | — |
| 07 | Slide Transition | 0.6667 с: x 0 → −106.4062 % (0.31694) → +90.9896 % (0.33333) → 0 относительно центра; scale CurrentValue 107 %; Mirror по краям | `whip(at)` на `#scenes`+`#overlay`; зеркало заменено размытием движения |
| 08 | Cinematic Border In | crop top/bottom 0 → 14 % за 2.28 с | не применяем: конфликт с safe-zone |
| 09 | Cinematic Border Out | 14 → 0 % за 1.65 с | — |
| 10 | Transform (Motion Blur) | базовый Transform с shutter angle | — |
| 11 | Pop In RGB | scale 50 → 110 (0.30 с) → 100 (0.82 с); opacity 0 → 100 за 0.07 с; хроматика R −10 / G +5 / B +10 → 0 за 0.73 / 0.63 / 0.42 с | `rgbPop(el, at)` — три цветных клона (screen) сходятся |
| 14 | Text Glow | 5 Drop Shadow: softness 10/60/150/250/1000, opacity 50/40/30/30/30 + Tint | класс `.glow` (text-shadow ×4, 1000 px отброшен) |
| 15 | Text Glow (Intense) | softness 50/100/300/1000, opacity 50/50/20/50 | — |

Шрифты в паке: Klementina и SF UI Display (ZIP). Условия использования не определяются наличием файла;
в текущей пробе оставлены уже применяемые Manrope/JetBrains Mono. См. `apple-rights.md` для отдельного разбора.

## Зависимости и реальный Adobe-путь, 06.09.2026

Большинство MatchName — `AE.ADBE.*` (Transform/Geometry, Blur, Mirror, Crop, Drop Shadow, Tint, Opacity).
RGB-пресет содержит `AE.Mettle SkyBox Chromatic Aberrations`, DisplayName `VR Chromatic Aberrations`.
Adobe перечисляет VR Chromatic Aberrations в штатных immersive effects: https://helpx.adobe.com/ca/premiere/desktop/add-video-effects/effects-and-transitions-library/immersive-video-effects.html.
Одно слово Mettle не доказывает необходимость покупки стороннего плагина. Точную работу старого пресета в Premiere 26 надо проверять импортом и короткой пробой; такого теста здесь ещё не было.

Локально найдены `AfterFX.exe` 26.2.1, `aerender.exe` 26.2.1.2 и Premiere Pro 26.0.0.72 в `C:/Program Files/Adobe/`.
В пользовательской папке нет `.aep`, `.mogrt` или `.ffx`; `.prfpset` относится к Premiere, не импортируется непосредственно в After Effects или HyperFrames.
After Effects допускает автоматический рендер готовой композиции через aerender: https://helpx.adobe.com/after-effects/desktop/render-and-export/automate-rendering/automated-rendering-network-rendering.html.
Наличие EXE проверено, лицензия/рендер/импорт не тестировались. Никакие плагины не установлены и настройки Adobe не изменены.
