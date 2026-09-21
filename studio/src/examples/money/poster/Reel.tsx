import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {PC} from '../../../kit/poster';
import {SpeakerCard} from '../../../components/SpeakerCard';
import {Captions, type Page} from '../../../components/Captions';
import {WORDS} from '../words';
import {BlockA, BlockB, BlockC, BlockCta, BlockD, BlockE} from './blocks';
import {CANVAS_IN, CANVAS_OUT, FunnelCanvas} from './funnel';

// Ролик 20 «деньги» в стиле «техно-постер» (утверждён Александром 19.09.2026). Карта — videos/reels-20-money-connectors/DIRECTION.md.
// Сцены: A серый «$20 за простой чат» → вспышка → B оранжевый «подключи» → подъём в тёмное → C «покажет, где теряешь» →
// размытие через белый → D «скинь» → рывок влево → E мятный «4 года, $0» → рывок вниз → холст-воронка с камерой → подъём → призыв.
export const MONEY_FPS = 60;
export const MONEY_END = 69.4;
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const accel = Easing.bezier(0.5, 0, 0.75, 0);

// Страницы субтитров по смыслу. dark — тёмный текст на светлых сценах; lines 1 — одна строка ниже (только в сценах, не на холсте:
// там окно заканчивается на 1470 и субтитры всегда в подвале на своей полосе).
const PAGES: Page[] = [
  {from: 0, to: 3.57, dark: true},
  {from: 3.57, to: 6.93, dark: true},
  {from: 6.93, to: 9.0, lines: 1},
  {from: 9.0, to: 12.21, dark: true},
  {from: 12.21, to: 13.74, dark: true, lines: 1},
  {from: 13.74, to: 16.25, dark: true},
  {from: 16.25, to: 19.53},
  {from: 19.53, to: 23.53},
  {from: 23.53, to: 26.33},
  {from: 26.33, to: 30.39},
  {from: 30.39, to: 31.4},
  {from: 31.4, to: 34.91},
  {from: 34.91, to: 38.48},
  {from: 38.48, to: 43.09},
  {from: 43.09, to: 46.18},
  {from: 46.18, to: 50.4},
  {from: 50.4, to: 54.4},
  {from: 54.4, to: 57.39},
  {from: 57.39, to: 59.99},
  {from: 59.99, to: 63.53},
  {from: 63.53, to: 65.47},
  {from: 65.47, to: 69.4},
];

// Звуки — только пак Александра (public/sfx — его файлы): [секунда, файл, громкость, смысл].
const SFX: [number, string, number][] = [
  [0.72, 'rubber', 0.3],        // пузырь приземлился на $20
  [2.7, 'switch', 0.25],        // вкладки: горит только «чат»
  [3.57, 'woosh-air', 0.35],    // вспышка оранжевым
  [4.28, 'switch', 0.35],       // штекер в гнезде
  [4.91, 'rubber', 0.22], [5.55, 'rubber', 0.2], [6.26, 'rubber', 0.22], // плашки реклама / инстаграм / CRM
  [6.78, 'whoosh-long', 0.3],   // подъём в тёмное
  [7.45, 'zoom', 0.35],         // линза на утечке
  [8.95, 'blur', 0.3],          // размытие через белый
  [9.1, 'woosh-air', 0.3],      // самолётик
  [12.1, 'whoosh', 0.35],       // рывок влево
  [14.14, 'flash', 0.3],        // $0
  [14.8, 'rubber', 0.2],        // четыре коннектора
  [16.25, 'whoosh-long', 0.32], // рывок вниз на холст
  [17.6, 'transform', 0.3],     // рисуются связи
  [19.3, 'zoom', 0.3],          // нырок в этап 01
  [20.55, 'transform', 0.25],   // запись Pipeboard
  [21.3, 'rubber', 0.2],        // логотипы площадок
  [27.8, 'switch', 0.35],       // кампания отключена
  [29.34, 'rubber', 0.22],      // новые тесты
  [30.39, 'transform', 0.35],   // штамп «таргетологи, сори»
  [31.05, 'whoosh', 0.3],       // переезд к этапу 02
  [32.42, 'rubber', 0.2],       // каналы
  [35.6, 'typing', 0.22],       // Claude печатает
  [36.65, 'counter', 0.3],      // заявки
  [38.15, 'whoosh', 0.3],       // переезд к этапу 03
  [41.7, 'transform', 0.25],    // страницы GitHub
  [45.03, 'rubber', 0.2],       // сделки
  [47.08, 'flash', 0.25],       // застряли
  [49.0, 'switch', 0.3],        // менеджер
  [50.25, 'whoosh-long', 0.3],  // отъезд на всю воронку
  [52.5, 'transform', 0.28],    // связи сходятся в 04
  [54.15, 'zoom', 0.3],         // нырок в этап 04
  [54.69, 'flash', 0.28],       // Metabase
  [56.35, 'rubber', 0.2],       // Power BI
  [57.15, 'woosh-air', 0.25],   // к дашборду
  [58.6, 'zoom', 0.25], [59.8, 'zoom', 0.22], [61.2, 'zoom', 0.25], // заход в отчёты
  [63.2, 'whoosh-long', 0.32],  // подъём в тёмное
  [64.85, 'typing', 0.25],      // «деньги» печатается
  [65.47, 'switch', 0.3],       // сообщение в директ
];

export const MoneyReel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const bloom = interpolate(t, [3.57, 3.95], [0, 2300], {...cl, easing: accel});
  const liftC = interpolate(t, [6.78, 7.08], [2560, 0], {...cl, easing: inOut});
  const blurOut = interpolate(t, [8.95, 9.1], [0, 1], cl), blurIn = interpolate(t, [9.1, 9.32], [1, 0], cl);
  const whipX = interpolate(t, [12.1, 12.4], [0, 1], {...cl, easing: inOut});
  const whipY = interpolate(t, [16.25, 16.6], [0, 1], {...cl, easing: inOut});
  const liftCta = interpolate(t, [63.2, 63.55], [2560, 0], {...cl, easing: inOut});
  const smear = (k: number) => Math.sin(Math.PI * k) * 26; // размытие движения на рывке
  return (
    <AbsoluteFill style={{background: PC.ink}}>
      {t < 3.96 ? <BlockA t={t} /> : null}
      {t >= 3.57 && t < 7.09 ? (
        <AbsoluteFill style={{clipPath: t < 3.95 ? `circle(${bloom}px at 1060px 880px)` : undefined, filter: t > 6.78 ? `brightness(${0.5 + 0.5 * liftC / 2560})` : undefined}}><BlockB t={t} /></AbsoluteFill>
      ) : null}
      {t >= 6.78 && t < 9.11 ? <AbsoluteFill style={{transform: `translateY(${liftC}px)`, filter: blurOut > 0 ? `blur(${blurOut * 26}px)` : undefined}}><BlockC t={t} /></AbsoluteFill> : null}
      {t >= 9.05 && t < 12.41 ? (
        <AbsoluteFill style={{transform: `translateX(${-whipX * 1440}px)`, filter: blurIn > 0 || whipX > 0 ? `blur(${Math.max(blurIn * 26, smear(whipX))}px)` : undefined}}><BlockD t={t} /></AbsoluteFill>
      ) : null}
      {t >= 12.1 && t < 16.61 ? (
        <AbsoluteFill style={{transform: `translate(${(1 - whipX) * 1440}px, ${-whipY * 2560}px)`, filter: whipX < 1 || whipY > 0 ? `blur(${Math.max(smear(whipX), smear(whipY))}px)` : undefined}}><BlockE t={t} /></AbsoluteFill>
      ) : null}
      {t >= CANVAS_IN && t < CANVAS_OUT + 0.01 ? (
        <AbsoluteFill style={{transform: `translateY(${(1 - whipY) * 2560}px)`, filter: whipY < 1 ? `blur(${smear(whipY)}px)` : t > 63.2 ? `brightness(${0.5 + 0.5 * liftCta / 2560})` : undefined}}><FunnelCanvas t={t} /></AbsoluteFill>
      ) : null}
      {t >= 63.2 ? <AbsoluteFill style={{transform: `translateY(${liftCta}px)`}}><BlockCta t={t} /></AbsoluteFill> : null}
      <AbsoluteFill style={{background: '#FFFFFF', opacity: Math.min(blurOut, t < 9.1 ? 1 : blurIn), pointerEvents: 'none'}} />
      <SpeakerCard src="reels/money/speaker.mp4" headY={886} plan={[{at: 16.3, to: 'compact'}, {at: 63.25, to: 'base'}]} />
      <Captions words={WORDS} pages={PAGES} width={1120} />
      {SFX.map(([s, f, v], i) => (
        <Sequence key={i} from={Math.round(s * fps)}><Audio src={staticFile(`sfx/${f}.wav`)} volume={v} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
