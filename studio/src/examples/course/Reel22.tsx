import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {SpeakerCard} from '../../components/SpeakerCard';
import {Captions} from '../montage/Captions';
import {E, k} from '../montage/parts';
import {Opening, PREVIEW_C, Threat} from './scenesA';
import {GalleryScene, GrowthScene, NoCodeScene} from './scenesB';
import {CtaScene, GiftScene, InsideScene, ProductsScene, SideScene} from './scenesC';
import {B} from './timing';
import {WORDS22} from './words';

// Ролик 22 «вайб-кодер», концепция «Премьера» (videos/reels-22-vibecoder-sales/DIRECTION.md): один герой в свете, вокруг воздух.
// Стыки — по речи: пролёт в окно превью («ты видишь результат» → «тебя заменят») → мятная вспышка от агента (к работам учеников) →
// размытие через мятный (без опыта) → подъём (рост) → рывок (агент умеет всё) → работы сжимаются в кейс курса →
// кейс становится подарком → подарок раскалывается на две стороны → подъём в ночь (призыв).
const L: React.FC<{style?: React.CSSProperties; children: React.ReactNode}> = ({style, children}) => (
  <AbsoluteFill style={{overflow: 'hidden', ...style}}>{children}</AbsoluteFill>
);

// Звуки — пак Александра (public/sfx): [секунда, файл, громкость до общего множителя]. Громкость: итог ролика 21 — ×0,44, без приглушения под речь.
const SFX_GAIN = 0.44;
const SFX: [number, string, number][] = [
  [0.3, 'woosh-air', 0.2], [2.55, 'rubber', 0.28],                          // плита с цитатой, «большой опыт»
  [3.7, 'whoosh', 0.3], [4.5, 'switch', 0.2],                                 // плита поворачивается, «монтажёр — ИИ»
  [6.75, 'zoom', 0.35],                                                       // пролёт в окно превью
  [7.1, 'rubber', 0.22], [8.2, 'rubber', 0.22], [8.7, 'transform', 0.2],     // «ты», «коллега», опыт меньше
  [10.45, 'woosh-air', 0.25], [10.95, 'switch', 0.25],                        // агент прилетает и пристёгивается
  [12.9, 'transform', 0.2], [14.6, 'whoosh', 0.2], [15.66, 'rubber', 0.28],  // делает агент, гонка, «быстрее»
  [16.15, 'flash', 0.3], [16.4, 'woosh-air', 0.2], [17.42, 'rubber', 0.2],   // мятная вспышка, ноутбук, «для экспедиторов»
  [18.37, 'whoosh', 0.25],                                                    // Excel падает
  [19.45, 'whoosh-long', 0.25], [20.35, 'rubber', 0.2], [21.0, 'typing', 0.14], [22.17, 'rubber', 0.2], // к телефону, подписи, ИИ-подсказка
  [22.8, 'switch', 0.16], [23.3, 'switch', 0.16],                             // питание, активность
  [24.05, 'whoosh-long', 0.25], [26.35, 'transform', 0.25], [26.45, 'rubber', 0.18], // к аналитике, AI-таргетолог
  [27.8, 'whoosh', 0.25], [28.0, 'rubber', 0.28],                             // отъезд, «собрали ученики»
  [29.4, 'blur', 0.3], [30.3, 'switch', 0.3], [31.7, 'switch', 0.3],         // через мятный, выкл / вкл
  [32.4, 'whoosh', 0.2], [32.62, 'counter', 0.2], [34.14, 'flash', 0.2], [34.2, 'rubber', 0.25], // дорожка модулей, модуль 1
  [35.2, 'whoosh-long', 0.3],                                                 // подъём к рассвету
  [35.8, 'switch', 0.12], [36.16, 'switch', 0.12], [36.52, 'switch', 0.12], [36.88, 'switch', 0.14], // профессии перелистываются
  [37.6, 'whoosh', 0.2], [38.8, 'rubber', 0.22], [39.9, 'whoosh-long', 0.22], [40.6, 'rubber', 0.3], [41.73, 'flash', 0.2], // путь к эксперту
  [44.5, 'whoosh', 0.3], [44.72, 'rubber', 0.22],                             // рывок, знак агента
  [46.17, 'typing', 0.25], [47.6, 'switch', 0.28], [47.62, 'woosh-air', 0.22], // промпт, отправка, холст
  [48.2, 'whoosh', 0.18], [48.85, 'whoosh', 0.18], [49.1, 'typing', 0.12], [50.3, 'whoosh', 0.18], [50.55, 'rubber', 0.15], // камера по продуктам
  [51.15, 'zoom', 0.25],                                                      // общий план
  [52.1, 'transform', 0.3], [53.1, 'rubber', 0.18], [53.24, 'rubber', 0.18], [53.38, 'rubber', 0.18], // в кейс, материалы
  [53.85, 'switch', 0.15], [54.72, 'rubber', 0.28],                           // стек, «4 года»
  [55.85, 'flash', 0.25], [56.4, 'woosh-air', 0.25], [56.62, 'rubber', 0.2], // кейс → подарок, орбита, подпись
  [59.05, 'zoom', 0.3], [59.2, 'rubber', 0.25],                               // «этот ролик»
  [59.85, 'whoosh', 0.3], [61.6, 'woosh-air', 0.15], [62.1, 'rubber', 0.28], [62.66, 'switch', 0.2], // стороны, вопрос
  [63.25, 'whoosh-long', 0.3], [63.8, 'typing', 0.25], [64.4, 'switch', 0.28], // в ночь, «гоу», отправка
  [65.0, 'whoosh', 0.2], [65.56, 'rubber', 0.25], [67.14, 'typing', 0.18], [67.9, 'rubber', 0.25], // директ, программа, ответ агента
  [68.95, 'whoosh', 0.22], [70.47, 'rubber', 0.2], [71.54, 'rubber', 0.3],   // финальная надпись
];

export const Reel22: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  // T2 6.75–7.28: пролёт в окно превью
  const zp = k(t, 6.75, 7.28, E.acc), Z = Math.exp(Math.log(9) * zp);
  const thIn = k(t, 7.1, 7.45, E.out);
  // T3 16.15–16.75: мятная вспышка от знака агента
  const bloom = k(t, 16.15, 16.45, E.out), bloomOut = k(t, 16.42, 16.8, E.out), galIn = k(t, 16.35, 16.62);
  // T4 29.35–29.9: размытие через мятный
  const b1 = k(t, 29.35, 29.6, E.acc), b2 = k(t, 29.6, 29.9, E.out);
  // T5 35.2–35.65: подъём
  const lf = k(t, 35.2, 35.65, E.inOut);
  // T6 44.5–44.85: рывок
  const wh = k(t, 44.5, 44.85, E.inOut), smear = Math.sin(Math.PI * wh) * 46;
  // T7 52.05–52.5: работы сжимаются в кейс
  const sh = k(t, 52.05, 52.5, E.acc), inIn = k(t, 52.2, 52.5);
  // T8 55.85–56.3: кейс становится подарком
  const mo = k(t, 55.85, 56.3, E.inOut);
  // T9 59.85–60.3: подарок раскалывается на две стороны
  const sp = k(t, 59.85, 60.3, E.inOut);
  // T10 63.25–63.7: подъём в ночь
  const lc = k(t, 63.25, 63.7, E.inOut);
  return (
    <AbsoluteFill style={{background: '#070707'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs><filter id="whip22" x="-10%" y="0%" width="120%" height="100%"><feGaussianBlur stdDeviation={`${smear} 0`} /></filter></defs>
      </svg>
      {t >= 7.1 && t < 16.8 ? (
        <L style={{opacity: thIn, transform: thIn < 1 ? `scale(${1.14 - 0.14 * thIn})` : undefined, filter: thIn < 1 ? `blur(${(1 - thIn) * 16}px)` : undefined}}>
          <Threat t={t} />
        </L>
      ) : null}
      {t < 7.32 ? (
        <L style={{transformOrigin: `${PREVIEW_C.x}px ${PREVIEW_C.y}px`, transform: zp > 0 ? `scale(${Z})` : undefined, opacity: 1 - k(t, 7.14, 7.3),
          filter: zp > 0.4 ? `blur(${(zp - 0.4) * 20}px)` : undefined}}>
          <Opening t={t} />
        </L>
      ) : null}
      {bloom > 0 && bloomOut < 1 ? (
        <AbsoluteFill style={{pointerEvents: 'none', opacity: 1 - bloomOut, mixBlendMode: 'screen',
          background: `radial-gradient(${200 + bloom * 2600}px ${200 + bloom * 2600}px at 1295px 590px, #F2FFFB 0%, #3DEDC3EE 30%, #3DEDC300 70%)`}} />
      ) : null}
      {t >= 16.35 && t < 29.9 ? (
        <L style={{opacity: galIn, filter: b1 > 0 ? `blur(${b1 * 22}px)` : undefined, transform: b1 > 0 ? `scale(${1 + 0.05 * b1})` : undefined}}>
          <GalleryScene t={t} />
        </L>
      ) : null}
      {t >= 29.6 && t < 35.66 ? (
        <L style={{filter: b2 < 1 ? `blur(${(1 - b2) * 22}px)` : undefined, transform: lf > 0 ? `translateY(${-2560 * lf}px)` : b2 < 1 ? `scale(${1.05 - 0.05 * b2})` : undefined}}>
          <NoCodeScene t={t} />
        </L>
      ) : null}
      {b1 > 0 && b2 < 1 ? <AbsoluteFill style={{pointerEvents: 'none', background: '#3DEDC3', opacity: 0.55 * (t < 29.6 ? b1 : 1 - b2)}} /> : null}
      {t >= 35.2 && t < 44.86 ? (
        <L style={{transform: lf < 1 ? `translateY(${2560 * (1 - lf)}px)` : wh > 0 ? `translateX(${-1440 * wh}px)` : undefined,
          filter: wh > 0 && wh < 1 ? 'url(#whip22)' : undefined, boxShadow: '0 -40px 80px rgba(0,0,0,.5)'}}>
          <GrowthScene t={t} />
        </L>
      ) : null}
      {t >= 44.5 && t < 52.52 ? (
        <L style={{transform: wh < 1 ? `translateX(${1440 * (1 - wh)}px)` : sh > 0 ? `scale(${1 - 0.9 * sh})` : undefined, transformOrigin: '720px 1040px',
          filter: wh > 0 && wh < 1 ? 'url(#whip22)' : sh > 0 ? `blur(${sh * 10}px)` : undefined, opacity: 1 - k(t, 52.3, 52.5)}}>
          <ProductsScene t={t} />
        </L>
      ) : null}
      {t >= 52.2 && t < 56.3 ? (
        <L style={{opacity: inIn * (1 - mo), filter: mo > 0 ? `blur(${mo * 14}px)` : undefined}}>
          <InsideScene t={t} />
        </L>
      ) : null}
      {t >= 59.85 && t < 63.72 ? (
        <L style={{transform: lc > 0 ? `translateY(${-2560 * lc}px)` : undefined, filter: lc > 0 ? `brightness(${1 - 0.6 * lc})` : undefined}}>
          <SideScene t={t} />
        </L>
      ) : null}
      {t >= 55.85 && t < 60.32 ? (
        sp > 0 ? (
          <>
            <L style={{clipPath: 'inset(0 720px 0 0)', transform: `translateX(${-760 * sp}px)`, filter: `brightness(${1 - 0.4 * sp})`}}><GiftScene t={t} /></L>
            <L style={{clipPath: 'inset(0 0 0 720px)', transform: `translateX(${760 * sp}px)`, filter: `brightness(${1 - 0.4 * sp})`}}><GiftScene t={t} /></L>
          </>
        ) : (
          <L style={{opacity: mo, transform: mo < 1 ? `scale(${1.06 - 0.06 * mo})` : undefined, filter: mo < 1 ? `blur(${(1 - mo) * 12}px)` : undefined}}>
            <GiftScene t={t} />
          </L>
        )
      ) : null}
      {mo > 0 && mo < 1 ? (
        <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: Math.sin(Math.PI * mo) * 0.8,
          background: 'radial-gradient(700px 700px at 720px 1040px, #E6FFF8 0%, #3DEDC3AA 35%, #3DEDC300 70%)'}} />
      ) : null}
      {t >= 63.25 ? (
        <L style={{transform: lc < 1 ? `translateY(${2560 * (1 - lc)}px)` : undefined, boxShadow: '0 -40px 80px rgba(0,0,0,.5)'}}>
          <CtaScene t={t} />
        </L>
      ) : null}
      <SpeakerCard src="r22/speaker.mp4" headY={920}
        plan={[{at: B.gallery, to: 'compact'}, {at: B.noCode, to: 'base'}, {at: B.products, to: 'compact'}, {at: B.inside, to: 'base'}, {at: 69.3, to: 'wide'}]} />
      <Captions t={t} words={WORDS22} />
      {SFX.map(([s, f, v], i) => (
        <Sequence key={i} from={Math.round(s * fps)}><Audio src={staticFile(`sfx/${f}.wav`)} volume={v * SFX_GAIN} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
