import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {SpeakerCard} from '../../components/SpeakerCard';
import {holePath} from '../../kit/liquid/Glyph';
import {Beam, rnd} from '../../kit/liquid/stage';
import {Captions} from './Captions';
import {E, k} from './parts';
import {BOX, G, Gift, HERO, HOLE_C, Proof, Wall} from './scenesA';
import {Sky, STEPS, TimelineScene} from './scenesB';
import {Context, GROW, Pins, Render, Style, Cta} from './scenesC';
import {B} from './timing';

// Ролик 21 «монтаж» (Liquid Glass × язык ролика «агент»). Карта — videos/reels-21-montage-agent/DIRECTION.md.
// Каждая сцена рисуется от глобального времени t; стыки считаются здесь, у каждого — причина из речи:
// луч прожектора (переход к «монтирует всё») → пролёт сквозь «0» в «100K» (в подарок) → влёт в открытую коробку (в набор правил) →
// капсула «по шагам» становится миром-таймлайном → растворение пузырями (к рендеру) → вспышка оранжевого (подписка) →
// размытие через белый (правки) → рывок (Pinterest) → подъём в тёмное (призыв).
const L: React.FC<{style?: React.CSSProperties; children: React.ReactNode}> = ({style, children}) => (
  <AbsoluteFill style={{overflow: 'hidden', ...style}}>{children}</AbsoluteFill>
);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// T1 световая шторка: прожектор далеко сверху ведёт луч слева направо; всё, что луч прошёл, — уже новая сцена.
const SWEEP = {x: 720, y: -3200};
const sweepAngle = (p: number) => -17 + 34 * p;
const sweepClip = (p: number) => {
  const phi = sweepAngle(p), pts: string[] = [`${SWEEP.x}px ${SWEEP.y}px`];
  const at = (a: number) => `${SWEEP.x + Math.sin((a * Math.PI) / 180) * 9000}px ${SWEEP.y + Math.cos((a * Math.PI) / 180) * 9000}px`;
  for (let a = -40; a <= phi; a += 1) pts.push(at(a));
  pts.push(at(phi));
  return `polygon(${pts.join(', ')})`;
};

// T5 жидкое растворение: сцена рендера проступает растущими пузырями (детерминированные центры).
const r5 = rnd(55);
const BUBBLES = Array.from({length: 34}, () => ({x: r5() * 1440, y: 300 + r5() * 1900, d: r5() * 0.22, r: 380 + r5() * 260}));
const DZ = [44.0, 44.58] as const;

// Звуки — только пак Александра (public/sfx — его файлы): [секунда, файл, громкость]. Смысл — в комментарии.
// Правки Александра 19–20.09: первая версия ×0,55 — «громко, перебивает голос»; ×0,23 с приглушением под речь — «слишком тихо»;
// итог 20.09 — «на 20 % тише первой»: ×0,44, без приглушения под речь.
const SFX_GAIN = 0.44;
const SFX: [number, string, number][] = [
  [0.02, 'woosh-air', 0.2],                                   // сцена со стеной роликов
  [1.33, 'rubber', 0.3],                                      // капсула под «ИИ-монтажом»
  [3.03, 'switch', 0.2],                                      // обучение Claude
  [4.05, 'counter', 0.32], [4.62, 'transform', 0.22],        // $700 перебирается и фиксируется
  [5.34, 'rubber', 0.22], [5.73, 'rubber', 0.2],             // 2 месяца, жизни
  [6.05, 'whoosh-long', 0.3],                                 // луч открывает рифлёное стекло
  [7.4, 'rubber', 0.25], [7.84, 'typing', 0.18],             // «всё», субтитры
  [8.62, 'zoom', 0.25],                                       // вставка из ролика «агент»
  [9.82, 'rubber', 0.2], [10.02, 'rubber', 0.2], [10.22, 'rubber', 0.22], [10.4, 'counter', 0.28], // карточки просмотров
  [11.58, 'rubber', 0.22], [12.2, 'transform', 0.3],         // 5K → 100K
  [13.62, 'zoom', 0.4],                                       // пролёт сквозь ноль
  [13.95, 'switch', 0.35], [14.45, 'rubber', 0.3],           // прожектор, коробка на постаменте
  [14.91, 'rubber', 0.25],                                    // «бесплатно»
  [15.85, 'rubber', 0.2], [16.3, 'rubber', 0.2], [16.71, 'rubber', 0.2], // лайк, репост, комментарий
  [17.1, 'woosh-air', 0.28], [17.5, 'flash', 0.32], [17.72, 'whoosh-long', 0.34], // оплата → коробка открылась → влёт
  [18.3, 'woosh-air', 0.18], [18.47, 'rubber', 0.2], [19.11, 'rubber', 0.2], [20.73, 'transform', 0.2], // правила в облаках
  [22.2, 'whoosh-long', 0.28], [22.6, 'woosh-air', 0.24],   // подъём над облаками, ссылка летит
  [23.3, 'transform', 0.3],                                   // поле → панель
  [23.9, 'switch', 0.16], [24.1, 'switch', 0.16], [24.3, 'switch', 0.16], [24.5, 'switch', 0.16], // галочки
  [24.35, 'whoosh', 0.22], [25.0, 'flash', 0.24],            // «сразу знает»
  [26.65, 'rubber', 0.3], [27.0, 'zoom', 0.34],              // «по шагам» → мир-таймлайн
  [27.6, 'rubber', 0.2], [28.45, 'whoosh-long', 0.18],       // запись на дорожке, длинная волна
  [29.96, 'typing', 0.24], [30.88, 'transform', 0.24], [31.31, 'flash', 0.18], // расшифровка, нарезка, сильные куски
  [32.2, 'whoosh', 0.3], [32.9, 'transform', 0.22],          // к раскадровке
  [34.84, 'rubber', 0.2], [35.4, 'rubber', 0.15], [35.55, 'rubber', 0.15], [35.7, 'rubber', 0.15], [35.85, 'rubber', 0.15], // скрины, логотипы
  [36.7, 'whoosh', 0.3], [38.25, 'blur', 0.22],              // к проверке, сканер
  [40.38, 'switch', 0.2], [41.07, 'transform', 0.24], [42.1, 'switch', 0.2], [42.86, 'transform', 0.24], [43.35, 'flash', 0.2], // лицо, кнопки
  [44.0, 'blur', 0.3], [44.49, 'rubber', 0.25], [46.55, 'rubber', 0.25], // растворение, «у тебя», «средней мощности»
  [48.05, 'flash', 0.3], [48.6, 'switch', 0.25],             // вспышка оранжевого, «не сожжёт»
  [49.76, 'transform', 0.24], [51.0, 'whoosh', 0.2],         // стопка проекта, нужное
  [53.05, 'flash', 0.3], [53.3, 'whoosh-long', 0.24], [53.78, 'rubber', 0.35], // ×25, пресс
  [54.05, 'rubber', 0.2], [55.02, 'flash', 0.24],            // ужал, качество
  [56.72, 'blur', 0.3], [57.1, 'typing', 0.3], [57.95, 'zoom', 0.25], // белый, «субтитры крупнее», субтитры растут
  [58.3, 'rubber', 0.2], [59.13, 'typing', 0.18],            // правила, рукописная строка
  [61.0, 'rubber', 0.16], [61.18, 'rubber', 0.16], [61.36, 'rubber', 0.16], [61.83, 'rubber', 0.22], // стиль
  [62.22, 'whoosh', 0.3], [62.45, 'woosh-air', 0.2], [63.72, 'rubber', 0.25], // рывок, пины, Pinterest
  [64.6, 'whoosh-long', 0.24], [65.45, 'flash', 0.2],        // пины стекают в репозиторий
  [66.38, 'whoosh-long', 0.3], [67.35, 'typing', 0.3], [67.9, 'switch', 0.3], // подъём в тёмное, «монтаж», отправка
  [68.0, 'woosh-air', 0.24], [68.85, 'rubber', 0.16], [69.05, 'rubber', 0.16], [69.25, 'rubber', 0.16], // директ, шаги
];

export const MontageReel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  // T1 6.05–6.55
  const wipe = k(t, B.a3 - 0.25, B.a3 + 0.25, E.inOut);
  // T2 13.62–14.2: пролёт сквозь ноль
  const zp = k(t, B.a4 - 0.1, B.a4 + 0.48, E.acc);
  const Z = Math.exp(Math.log(70) * zp);
  // T3 17.62–18.25: камера влетает в открытую коробку, из вспышки — небо
  const bp = k(t, 17.62, 18.22, E.acc);
  const Zb = Math.exp(Math.log(9) * bp);
  const flashB = k(t, 17.8, 18.1) * (1 - k(t, 18.14, 18.5));
  const skyIn = k(t, 18.02, 18.6, E.out);
  // T4 27.0–27.55: капсула «по шагам» раздувается в мир-таймлайн
  const il = k(t, 27.0, 27.55, E.inOut);
  const rect = {x: lerp(STEPS.x, 0, il), y: lerp(STEPS.y, 0, il), w: lerp(STEPS.w, 1440, il), h: lerp(STEPS.h, 2560, il), r: lerp(STEPS.h / 2, 0, il)};
  // T5 44.0–44.58: растворение пузырями
  const dz = k(t, DZ[0], DZ[1], (v) => v);
  // T6 48.05–48.5: вспышка оранжевого от экрана ноутбука
  const bo = k(t, 48.05, 48.3, E.out), boIn = k(t, 48.26, 48.55, E.out);
  // T7 56.72–57.15: размытие через белый
  const wo = k(t, 56.72, 56.95, E.acc), wi = k(t, 56.95, 57.2, E.out);
  // T8 62.22–62.56: рывок влево
  const wh = k(t, 62.22, 62.56, E.inOut), smear = Math.sin(Math.PI * wh) * 46;
  // T9 66.38–66.78: подъём в тёмное
  const lf = k(t, 66.38, 66.78, E.inOut);
  const grow = (s: number) => 1 + 0.28 * k(s, GROW[0], GROW[0] + 0.25, E.pop) * (1 - k(s, GROW[1] - 0.25, GROW[1], E.inOut));
  return (
    <AbsoluteFill style={{background: '#050506'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="whipX" x="-10%" y="0%" width="120%" height="100%"><feGaussianBlur stdDeviation={`${smear} 0`} /></filter>
          <clipPath id="dzClip" clipPathUnits="userSpaceOnUse">
            {BUBBLES.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={b.r * k(t, DZ[0] + b.d * 0.6, DZ[0] + b.d * 0.6 + 0.42, E.out)} />)}
          </clipPath>
        </defs>
      </svg>
      {t < B.a3 + 0.26 ? <L><Wall t={t} /></L> : null}
      {t >= B.a3 - 0.26 && t < B.a4 + 0.5 ? (
        <L style={{clipPath: wipe < 1 ? sweepClip(wipe) : undefined, transformOrigin: `${HOLE_C.x}px ${HOLE_C.y}px`, transform: zp > 0 ? `scale(${Z})` : undefined}}>
          <Proof t={t} />
        </L>
      ) : null}
      {wipe > 0 && wipe < 1 ? <Beam s={{x: SWEEP.x, y: SWEEP.y, angle: sweepAngle(wipe), spread: 2.2, power: 1.7, color: '235,255,248', len: 7000}} /> : null}
      {t >= B.a4 - 0.1 && t < 18.3 ? (
        <L style={{clipPath: zp < 1 ? `path('${holePath(G, 1, HERO, Z, HOLE_C.x, HOLE_C.y)}')` : undefined,
          transformOrigin: `${BOX.x}px ${BOX.y - 140}px`, transform: bp > 0 ? `scale(${Zb})` : undefined, filter: bp > 0.5 ? `blur(${(bp - 0.5) * 24}px)` : undefined,
          opacity: 1 - k(t, 18.12, 18.28)}}>
          <Gift t={t} />
        </L>
      ) : null}
      {t >= 18.0 && t < 27.56 ? (
        <L style={{opacity: skyIn, transform: skyIn < 1 ? `scale(${1.18 - 0.18 * skyIn})` : undefined, filter: skyIn < 1 ? `blur(${(1 - skyIn) * 14}px)` : undefined}}>
          <Sky t={t} />
        </L>
      ) : null}
      {flashB > 0 ? <AbsoluteFill style={{pointerEvents: 'none', opacity: flashB,
        background: 'radial-gradient(90% 60% at 50% 30%, #FFFFFF 0%, #E6FFF8 35%, #9FF3DD 70%, #3DEDC3 100%)'}} /> : null}
      {t >= 27.0 && t < DZ[1] + 0.01 ? (
        <L style={{clipPath: il < 1 ? `inset(${rect.y}px ${1440 - rect.x - rect.w}px ${2560 - rect.y - rect.h}px ${rect.x}px round ${rect.r}px)` : undefined,
          opacity: k(t, 27.0, 27.1)}}>
          <TimelineScene t={t} />
        </L>
      ) : null}
      {il > 0 && il < 1 ? (
        <div style={{position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: rect.r, pointerEvents: 'none', opacity: 1 - il,
          boxShadow: 'inset 0 0 0 6px rgba(61,237,195,.9), 0 0 60px rgba(61,237,195,.55), inset 0 0 60px rgba(61,237,195,.35)'}} />
      ) : null}
      {t >= DZ[0] && t < 48.52 ? (
        <L style={{clipPath: dz < 1 ? 'url(#dzClip)' : undefined, filter: bo > 0 ? `blur(${bo * 16}px)` : undefined, transform: bo > 0 ? `scale(${1 + bo * 0.08})` : undefined}}>
          <Render t={t} />
        </L>
      ) : null}
      {bo > 0 && boIn < 1 ? <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: 1 - boIn * 0.9,
        background: `radial-gradient(${400 + bo * 1900}px ${400 + bo * 1900}px at 720px 720px, #FFB27E 0%, #FF7A2FDD 30%, #FF7A2F00 70%)`}} /> : null}
      {t >= 48.26 && t < 57.2 ? (
        <L style={{opacity: boIn, filter: boIn < 1 ? `blur(${(1 - boIn) * 14}px)` : wo > 0 ? `blur(${wo * 26}px)` : undefined,
          transform: boIn < 1 ? `scale(${1.06 - 0.06 * boIn})` : wo > 0 ? `translateY(${-wo * 70}px) scale(${1 + wo * 0.05})` : undefined}}>
          <Context t={t} />
        </L>
      ) : null}
      {t >= 56.95 && t < 62.57 ? (
        <L style={{opacity: wi, filter: wi < 1 ? `blur(${(1 - wi) * 18}px)` : wh > 0 ? 'url(#whipX)' : undefined,
          transform: wh > 0 ? `translateX(${-1440 * wh}px)` : wi < 1 ? `scale(${1.03 - 0.03 * wi})` : undefined}}>
          <Style t={t} />
        </L>
      ) : null}
      {wo > 0 && wi < 1 ? <AbsoluteFill style={{background: '#FFFFFF', opacity: t < 56.95 ? wo : 1 - wi, pointerEvents: 'none'}} /> : null}
      {t >= 62.22 && t < 66.8 ? (
        <L style={{transform: wh < 1 ? `translateX(${1440 * (1 - wh)}px)` : lf > 0 ? `translateY(${-2560 * lf}px)` : undefined,
          filter: wh > 0 && wh < 1 ? 'url(#whipX)' : lf > 0 ? `brightness(${1 - 0.6 * lf})` : undefined}}>
          <Pins t={t} />
        </L>
      ) : null}
      {t >= 66.38 ? (
        <L style={{transform: lf < 1 ? `translateY(${2560 * (1 - lf)}px)` : undefined, boxShadow: '0 -40px 80px rgba(0,0,0,.5)'}}>
          <Cta t={t} />
        </L>
      ) : null}
      <SpeakerCard src="r21/speaker.mp4" headY={935}
        plan={[{at: 27.1, to: 'compact'}, {at: 44.05, to: 'base'}, {at: 48.2, to: 'compact'}, {at: 56.8, to: 'wide'}, {at: 62.25, to: 'base'}]} />
      <Captions t={t} grow={grow} />
      {SFX.map(([s, f, v], i) => (
        <Sequence key={i} from={Math.round(s * fps)}><Audio src={staticFile(`sfx/${f}.wav`)} volume={v * SFX_GAIN} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
