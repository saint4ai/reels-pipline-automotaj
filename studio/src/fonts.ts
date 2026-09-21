import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Шрифты дизайн-системы ONai. loadFont сам держит рендер, пока файл не загрузится.
loadFont({family: 'Manrope', url: staticFile('fonts/Manrope-Variable.ttf'), weight: '200 800'});
loadFont({family: 'JBM', url: staticFile('fonts/JetBrainsMono-Variable.ttf'), weight: '100 800'});
// Пиксельный стиль «воксельное стекло» (проба 19.09.2026). Pixelify отклонён: в кириллице «д» как «a», «ь» как «b».
// DotGothic16 — заголовки (мелкий пиксель, чистая кириллица), Handjet — текст интерфейса (узкий, пиксельная сетка).
loadFont({family: 'DotGothic16', url: staticFile('fonts/DotGothic16-Regular.ttf'), weight: '400'});
// Handjet — подмножества с Google Fonts: в файле из репозитория google/fonts ось ELSH 0 — «пустая» форма, текст исчезает.
const CYR = 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116';
const LAT = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
loadFont({family: 'Handjet', url: staticFile('fonts/Handjet-cyr.woff2'), weight: '100 900', unicodeRange: CYR, format: 'woff2'});
loadFont({family: 'Handjet', url: staticFile('fonts/Handjet-lat.woff2'), weight: '100 900', unicodeRange: LAT, format: 'woff2'});
// Стиль «техно-постер» (проба 19.09.2026 по референсам Александра: BLAST/CS, Cyberpunk 2025, M56):
// Inter Tight — огромные заголовки, Tektur — техно-надписи, Martian Mono — технические подписи.
loadFont({family: 'Inter Tight', url: staticFile('fonts/InterTight-Variable.ttf'), weight: '100 900'});
loadFont({family: 'Tektur', url: staticFile('fonts/Tektur-Variable.ttf'), weight: '400 900'});
loadFont({family: 'Martian Mono', url: staticFile('fonts/MartianMono-Variable.ttf'), weight: '100 800'});
// Рукописный второй голос ролика 21 (Caveat, подмножества Google Fonts через fontsource): кириллица и латиница.
loadFont({family: 'Caveat', url: staticFile('fonts/Caveat-cyr-600.woff2'), weight: '600', unicodeRange: CYR, format: 'woff2'});
loadFont({family: 'Caveat', url: staticFile('fonts/Caveat-lat-600.woff2'), weight: '600', unicodeRange: LAT, format: 'woff2'});
