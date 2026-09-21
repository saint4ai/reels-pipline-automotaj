import {Config} from '@remotion/cli/config';
import {enableTailwind} from '@remotion/tailwind-v4';

// Правила репозитория: один воркер нагрузки, высокое качество.
Config.setConcurrency(2);
// Вывод 2K 1440×2560 (Александр, вечер 18.09.2026: «4K очень долго»). Для 4K — Config.setScale(1.5), рендер ×1,7 дольше.
Config.setScale(1);
// Кадр с 3D и перемоткой видео может считаться дольше стандартных 30 с — запас до двух минут.
Config.setDelayRenderTimeoutInMilliseconds(120000);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
// Битрейт вместо CRF: в 2K цель 48 Мбит/с (правило 15.09.2026), фактический замеряется по файлу.
Config.setVideoBitrate('48M');
Config.setPixelFormat('yuv420p');
Config.overrideBundlerConfig((c) => enableTailwind(c));
