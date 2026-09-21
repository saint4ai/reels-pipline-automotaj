import {useLayoutEffect, useRef} from 'react';
import {getInputProps} from 'remotion';

// Проверка контейнера после загрузки шрифтов: содержимое не вылезает и поля не меньше половины кегля.
// Нарушение пишется в консоль как [fit] и подсвечивается красной рамкой в режиме qa.
export const useFit = (name: string) => {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    const pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight);
    const over = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
    const tight = pl < fs * 0.5 || pr < fs * 0.5;
    const bad = over || tight;
    el.dataset.fit = bad ? 'bad' : 'ok';
    if (bad) console.error(`[fit] ${name}: scroll ${el.scrollWidth}×${el.scrollHeight} client ${el.clientWidth}×${el.clientHeight} padding ${pl}/${pr} font ${fs}`);
    if (bad && (getInputProps() as {qa?: boolean}).qa) el.style.outline = '6px solid #FF2D2D';
  });
  return ref;
};
