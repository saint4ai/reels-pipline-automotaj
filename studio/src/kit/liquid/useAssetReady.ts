import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';

// Шрифты для замеров (canvas measureText): пока шрифт не загружен, canvas меряет запасным шрифтом,
// и капсула не совпадёт со словом. Хук держит рендер кадра, пока все шрифты из списка не станут доступны,
// и перерисовывает компонент после загрузки. Пример спецификации: '800 80px "Manrope"'.
// Гонка (ролик 21, стык 6,33 с): loadFont из @remotion/fonts добавляет FontFace в document.fonts только после загрузки,
// а document.fonts.load() на ещё не добавленное семейство сразу отдаёт пустой список — строка мерилась запасным
// шрифтом и слипалась в части кадров. Поэтому ждём, пока шрифт реально найдётся (faces > 0 и check()).
const waitFont = async (spec: string) => {
  for (let i = 0; i < 400; i++) {
    const faces = await document.fonts.load(spec);
    if (faces.length > 0 && document.fonts.check(spec)) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  console.error(`[font] не загрузился: ${spec}`);
};

export const useFontsReady = (specs: string[]) => {
  const key = specs.join('|');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const handle = delayRender(`шрифты: ${key}`);
    let alive = true;
    Promise.all(specs.map(waitFont)).then(() => {
      if (alive) setReady(true);
      continueRender(handle);
    });
    return () => { alive = false; continueRender(handle); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return ready;
};
