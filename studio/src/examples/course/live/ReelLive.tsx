import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {SpeakerCard} from '../../../components/SpeakerCard';
import {Captions} from '../../montage/Captions';
import {E, k} from '../../montage/parts';
import {WORDS22} from '../words';
import {AgentCursor, camAt, H, Key, pressAt, toScreen, track, W, worldStyle, type CamKey, type Pt} from './canvas';
import {Block, CardSpark, center, Connector, Desk, isLight, linkOf, linkPoint, page, PageLabel, PAGES, px, py, type Link, type Page} from './desk';
import {A1Quote, a1Cursor, A2Threat, a2Cursor, A3Forwarder, a3Cursor, MAN} from './scenes1';
import {A4Fitness, a4Cursor, A5Ads, a5Cursor, A6NoCode, a6Cursor, A7Growth, a7Cursor} from './scenes2';
import {A10Gift, A11Sides, a11Cursor, A12Cta, a12Cursor, A8Products, a8Cursor, A9Inside, a9Cursor, tileCenter} from './scenes3';

// Ролик 22 «Живая сборка» (videos/reels-22-vibecoder-sales/DIRECTION.md).
// Весь ролик — один сценарный канвас: 12 тетрадных листов, тёмные и светлые, камера едет по пунктирным связкам, которые тянет
// ИИ-агент, дважды влетает внутрь экрана (телефон, ноутбук) и трижды отъезжает на общий план — путь, работы учеников, вся система.
const P: Record<string, Page> = Object.fromEntries(PAGES.map((p) => [p.id, p]));
const C = (p: Page, dx = 720, dy = 1280): [number, number] => [px(p) + dx, py(p) + dy];
// Связки строятся от самих карточек: выход из боковой кромки, вход — ровно в верхнюю середину следующей карточки.
const ORDER = ['quote', 'time', 'fwd', 'fit', 'ads', 'nocode', 'growth', 'prod', 'inside', 'gift', 'sides', 'cta'];
const LINKS: Record<string, Link> = Object.fromEntries(ORDER.slice(0, -1).map((id, i) => [`l${i + 1}`, linkOf(P[id], P[ORDER[i + 1]])]));
// [связка, начало, конец] — прорисовка и перелёт камеры идут одним движением.
const DRAW: [string, number, number][] = [
  ['l1', 6.15, 6.85], ['l2', 16.15, 16.7], ['l3', 19.5, 20.1], ['l4', 24.1, 24.65], ['l5', 29.4, 30.0],
  ['l6', 35.3, 35.9], ['l7', 44.6, 45.1], ['l8', 52.4, 52.9], ['l9', 56.1, 56.7], ['l10', 60.0, 60.5], ['l11', 63.4, 63.9],
];
const drawOf = (t: number, id: string) => { const d = DRAW.find((x) => x[0] === id)!; return k(t, d[1], d[2], (v) => v); };

const OV1: [number, number, number] = [1900, 1800, 0.40];                 // путь: карточки 01–02
const OV2: [number, number, number] = [4620, 2980, 0.33];                  // работы учеников: 03–05
const OVALL: [number, number, number] = [2020, 9780, 0.33];                // вся система: нижний куст карточек
const CAM: CamKey[] = [
  [0, ...C(P.quote), 1], [5.7, ...C(P.quote), 1],
  [6.22, ...C(P.quote, MAN.x, MAN.y), 6.2],                                  // влёт прямо в перечёркнутого человечка
  [6.24, OV1[0], OV1[1], OV1[2] * 0.1], [6.95, ...OV1],                      // вылет из него уже на канвас
  [7.25, ...C(P.time), 1], [15.5, ...C(P.time), 1],
  [16.12, ...C(P.time, 420, 860), 2.6],                                    // ныряем в стекло часов: время вышло
  [16.7, ...C(P.fwd), 1], [19.35, ...C(P.fwd), 1],                          // карточка целиком в кадре, без наезда
  [20.1, ...C(P.fit), 1], [21.35, ...C(P.fit), 1],
  [21.95, ...C(P.fit, 720, 880), 2.62], [23.9, ...C(P.fit, 720, 1020), 2.62],                 // влёт в экран телефона
  [24.65, ...C(P.ads), 1], [27.8, ...C(P.ads), 1],
  [28.5, ...OV2], [29.35, ...OV2],
  [30.0, ...C(P.nocode), 1], [35.25, ...C(P.nocode), 1],
  [35.9, ...C(P.growth), 1], [44.55, ...C(P.growth), 1],
  [45.1, ...C(P.prod), 1], [52.45, ...C(P.prod), 1],
  [52.95, ...C(P.inside), 1], [55.9, ...C(P.inside), 1],
  [56.55, ...OVALL], [56.95, ...OVALL],
  [57.5, ...C(P.gift), 1], [59.95, ...C(P.gift), 1],
  [60.55, ...C(P.sides), 1], [63.35, ...C(P.sides), 1],
  [63.95, ...C(P.cta), 1], [72.8, ...C(P.cta), 1],
];
type Seg = {from: number; to: number; clicks: number[]} & ({p: Page; pts: Pt[]} | {link: string});
const SEG: Seg[] = [
  {from: 0, to: 5.9, p: P.quote, ...a1Cursor()},
  {from: 6.1, to: 6.9, link: 'l1', clicks: []},
  {from: 7.0, to: 16.15, p: P.time, ...a2Cursor()},
  {from: 16.15, to: 16.7, link: 'l2', clicks: []},
  {from: 16.7, to: 19.5, p: P.fwd, ...a3Cursor()},
  {from: 19.5, to: 20.1, link: 'l3', clicks: []},
  {from: 20.1, to: 24.1, p: P.fit, ...a4Cursor()},
  {from: 24.1, to: 24.65, link: 'l4', clicks: []},
  {from: 24.65, to: 29.4, p: P.ads, ...a5Cursor()},
  {from: 29.4, to: 30.0, link: 'l5', clicks: []},
  {from: 30.0, to: 35.3, p: P.nocode, ...a6Cursor()},
  {from: 35.3, to: 35.9, link: 'l6', clicks: []},
  {from: 35.9, to: 44.6, p: P.growth, ...a7Cursor()},
  {from: 44.6, to: 45.1, link: 'l7', clicks: []},
  {from: 45.1, to: 52.4, p: P.prod, ...a8Cursor()},
  {from: 52.4, to: 52.9, link: 'l8', clicks: []},
  {from: 52.9, to: 56.1, p: P.inside, ...a9Cursor()},
  {from: 56.1, to: 56.7, link: 'l9', clicks: []},
  {from: 60.0, to: 60.5, link: 'l10', clicks: []},
  {from: 60.5, to: 63.4, p: P.sides, ...a11Cursor()},
  {from: 63.4, to: 63.9, link: 'l11', clicks: []},
  {from: 63.9, to: 70.0, p: P.cta, ...a12Cursor()},
];
const A3K = a3Cursor().keys;

// Звук: пак Александра. Правка 20.09 — «ещё на 15 % тише»: итог ×0,37 от исходных значений, без приглушения под речь.
const SFX_GAIN = 0.37;
const SFX: [number, string, number][] = [
  // Обновлённый набор 20.09: к прежним звукам добавлены новые тембры из того же пака — реверс-вуш, низкий удар,
  // стеклянный клик, ризер, тёплый поп, шиммер (правка «звуки заезжены»).
  [0.2, 'riser', 0.16], [1.1, 'pop-warm', 0.2],                                   // лист и человечек
  [2.3, 'tick-soft', 0.2], [3.86, 'rev-whoosh', 0.26], [4.14, 'snap', 0.3], [4.3, 'sub-hit', 0.26], // крест
  [4.48, 'ui-glass', 0.24], [4.85, 'ui-slide', 0.16], [5.2, 'tick-soft', 0.18],   // удаление «не», подчёркивание, зачёркивание
  [5.6, 'riser', 0.2], [6.05, 'zoom-deep', 0.3], [6.24, 'sub-hit', 0.28], [6.95, 'shimmer', 0.2], // влёт в объект и вылет на канвас
  [7.2, 'snap', 0.28], [7.85, 'pop-warm', 0.16],                                   // переворот часов
  [8.35, 'rev-whoosh', 0.18], [9.15, 'ui-slide', 0.16],                            // карточка коллеги, опыт
  [10.5, 'tick-soft', 0.2], [10.95, 'ui-glass', 0.26],                             // агент прилетает и пристёгивается
  [11.3, 'ui-seq', 0.14], [13.55, 'tick-soft', 0.16], [14.15, 'tick-soft', 0.16], [14.75, 'tick-soft', 0.16], [15.7, 'pop-warm', 0.22],
  [15.8, 'zoom-deep', 0.24], [16.1, 'rev-whoosh', 0.22], [16.55, 'sub-hit', 0.24],                            // перелёт к экспедиторам
  [16.9, 'ui-seq', 0.14], [17.25, 'zoom-deep', 0.22],                              // ноутбук и сборка
  [18.4, 'ui-glass', 0.2], [18.72, 'blur', 0.22],                                  // Excel выделен и удалён
  [19.45, 'rev-whoosh', 0.24], [20.05, 'sub-hit', 0.24], [20.3, 'shimmer', 0.16],  // выход на светлый лист
  [21.9, 'zoom-deep', 0.26], [22.85, 'pop-warm', 0.16], [23.35, 'pop-warm', 0.16], [23.9, 'ui-soft', 0.12], // влёт в телефон
  [24.05, 'rev-whoosh', 0.22], [24.6, 'sub-hit', 0.22], [25.45, 'zoom-deep', 0.18], // перелёт и подъезд к аналитике
  [26.45, 'snap', 0.2], [27.8, 'riser', 0.2], [28.2, 'shimmer', 0.18],             // AI-таргетолог, отъезд
  [29.4, 'rev-whoosh', 0.22], [29.95, 'sub-hit', 0.24],                            // к листу «без кода»
  [30.35, 'ui-glass', 0.26], [31.75, 'ui-glass', 0.26], [32.5, 'ui-slide', 0.16], [32.65, 'counter', 0.16], // тогглы, дорожка
  [34.2, 'pop-warm', 0.24],                                                        // модуль 1
  [35.3, 'rev-whoosh', 0.22], [35.85, 'sub-hit', 0.22],
  [35.95, 'tick-soft', 0.14], [36.31, 'tick-soft', 0.14], [36.67, 'tick-soft', 0.14], [37.03, 'pop-warm', 0.16], // профессии
  [38.9, 'ui-soft', 0.16], [40.5, 'snap', 0.24], [41.2, 'ui-seq', 0.14], [41.78, 'shimmer', 0.18],  // чип растёт в эксперта
  [44.55, 'rev-whoosh', 0.24], [45.05, 'sub-hit', 0.24],
  [46.25, 'tick-soft', 0.22], [47.6, 'ui-glass', 0.24], [47.75, 'riser', 0.14],    // промпт и отправка
  [48.3, 'ui-glass', 0.14], [49.2, 'ui-glass', 0.14], [50.35, 'ui-glass', 0.14], [51.6, 'ui-glass', 0.14], [51.95, 'zoom-deep', 0.18], // карусель
  [52.4, 'rev-whoosh', 0.22], [52.9, 'sub-hit', 0.22],                             // к кейсу обучения
  [53.15, 'pop-warm', 0.14], [53.3, 'pop-warm', 0.14], [53.45, 'pop-warm', 0.14], [53.9, 'ui-seq', 0.14], [54.8, 'pop-warm', 0.22],
  [56.05, 'riser', 0.2], [56.6, 'shimmer', 0.2], [57.45, 'sub-hit', 0.24],         // отъезд на систему и влёт в подарок
  [57.0, 'ui-soft', 0.14], [59.05, 'zoom-deep', 0.22], [59.3, 'pop-warm', 0.2],    // орбита, «этот ролик»
  [59.95, 'rev-whoosh', 0.22], [60.5, 'sub-hit', 0.22], [62.15, 'pop-warm', 0.22], [62.7, 'ui-glass', 0.2],
  [63.35, 'riser', 0.18], [63.9, 'sub-hit', 0.2], [64.0, 'tick-soft', 0.18], [64.5, 'ui-glass', 0.26], // призыв, набор «гоу»
  [65.1, 'rev-whoosh', 0.16], [65.6, 'pop-warm', 0.2], [67.2, 'ui-seq', 0.12], [67.95, 'pop-warm', 0.2],
  [69.1, 'riser', 0.18], [70.5, 'ui-glass', 0.16], [71.6, 'pop-warm', 0.24],
];

// Ближний слой: пылинки и блики летят быстрее камеры (параллакс), и мягкий ключевой свет едет вместе с ней.
const DUST = Array.from({length: 26}, (_, i) => {
  const r = (i * 9301 + 49297) % 233280 / 233280, r2 = (i * 4363 + 1301) % 99991 / 99991;
  return {x: r * 1440, y: r2 * 2560, s: 3 + ((i * 7) % 5), o: 0.12 + ((i * 13) % 7) / 40, k: 1.15 + ((i * 5) % 4) / 20};
});
const NearLayer: React.FC<{cam: {cx: number; cy: number; s: number}; t: number}> = ({cam, t}) => (
  <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
    {DUST.map((d, i) => {
      const dx = -(cam.cx * (d.k - 1) * cam.s) % 1800, dy = -(cam.cy * (d.k - 1) * cam.s) % 3000;
      return <div key={i} style={{position: 'absolute', left: ((d.x + dx) % 1800 + 1800) % 1800 - 180, top: ((d.y + dy + Math.sin(t * 0.4 + i) * 12) % 3000 + 3000) % 3000 - 220,
        width: d.s, height: d.s, borderRadius: '50%', background: '#DCEBFF', opacity: d.o, filter: 'blur(0.5px)'}} />;
    })}
    {/* ключевой свет едет вместе с камерой */}
    <AbsoluteFill style={{background: `radial-gradient(70% 45% at ${50 + Math.sin(cam.cx / 2600) * 22}% ${18 + Math.cos(cam.cy / 3000) * 8}%, rgba(190,220,255,.10), rgba(190,220,255,0) 70%)`,
      mixBlendMode: 'screen'}} />
  </AbsoluteFill>
);
export const ReelLive: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cam = camAt(t, CAM);
  const next = camAt(t + 1 / fps, CAM);
  const smear = Math.min(44, Math.hypot((next.cx - cam.cx) * cam.s, (next.cy - cam.cy) * cam.s) * 0.2);
  const near = (p: Page) => {
    const d = Math.hypot(center(p).cx - cam.cx, center(p).cy - cam.cy);
    return cam.s < 0.6 ? 1 : 1 - 0.72 * Math.min(1, d / 1300);
  };
  const vis = (p: Page) => {
    const a = toScreen(cam, px(p), py(p)), b = toScreen(cam, px(p) + W, py(p) + H);
    return a.x < W + 80 && b.x > -80 && a.y < H + 80 && b.y > -80;
  };
  // неон карточки: вспышка при приезде камеры, потом ровное свечение
  const hot = (p: Page) => {
    const flash = k(t, p.at - 0.15, p.at + 0.25) * (1 - k(t, p.at + 0.8, p.at + 1.8, E.inOut));
    const live = near(p) > 0.9 ? 0.35 : 0;
    return Math.max(flash, live);
  };
  const seg = SEG.find((s) => t >= s.from && t < s.to);
  let cursor: React.ReactNode = null;
  if (seg) {
    const [wx, wy] = 'link' in seg ? linkPoint(LINKS[seg.link], drawOf(t, seg.link)) : (() => { const q = track(t, seg.pts); return [seg.p.x + q.x, seg.p.y + q.y]; })();
    const sp = toScreen(cam, wx, wy);
    const o = Math.min(1, k(t, seg.from, seg.from + 0.18) * (1 - k(t, seg.to - 0.18, seg.to)) + 0.0001);
    // метка «Claude» прячется, пока курсор работает по списку задач коллеги — иначе она закрывает пункты
    const busy = t > 13.3 && t < 15.25;
    cursor = <AgentCursor x={sp.x} y={sp.y} press={pressAt(t, seg.clicks)} ripple={seg.clicks} t={t} o={o} tag={!busy} />;
  }
  // «призрак» будущего пути виден на общих планах
  const ghost = cam.s < 0.55 ? Math.min(1, (0.55 - cam.s) * 4) : 0;
  const white = PAGES.some((p) => isLight(p) && near(p) > 0.9) ? 1 : 0;
  const content = (p: Page) => {
    switch (p.id) {
      case 'quote': return <><A1Quote t={t} /><Key x={250} y={800} label="⌫" t={t} at={4.48} /></>;
      case 'time': return <A2Threat t={t} />;
      case 'fwd': return <><A3Forwarder t={t} />{A3K.map(([a, l, x, y], j) => <Key key={j} x={x} y={y} label={l} t={t} at={a} />)}</>;
      case 'fit': return <A4Fitness t={t} />;
      case 'ads': return <A5Ads t={t} />;
      case 'nocode': return <A6NoCode t={t} />;
      case 'growth': return <A7Growth t={t} />;
      case 'prod': return <A8Products t={t} />;
      case 'inside': return <A9Inside t={t} />;
      case 'gift': return <A10Gift t={t} />;
      case 'sides': return <A11Sides t={t} />;
      case 'cta': return <A12Cta t={t} />;
      default: return null;
    }
  };
  return (
    <AbsoluteFill style={{background: '#0F1012'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs><filter id="pan22" x="-12%" y="-12%" width="124%" height="124%"><feGaussianBlur stdDeviation={`${smear} ${smear * 0.4}`} /></filter></defs>
      </svg>
      <div style={{...worldStyle(cam), filter: smear > 1.5 ? 'url(#pan22)' : undefined}}>
        <Desk cx={cam.cx} cy={cam.cy} s={cam.s} hot={hot} />
        {PAGES.filter(vis).map((p) => <PageLabel key={p.id} p={p} o={0.85 * Math.max(0, (near(p) - 0.6) / 0.4)} />)}
        {PAGES.filter(vis).map((p) => <CardSpark key={`s${p.id}`} p={p} g={hot(p)} />)}
        {Object.entries(LINKS).map(([id, l]) => <Connector key={id} l={l} draw={drawOf(t, id)} ghost={ghost} sw={Math.min(26, 8 / cam.s)} />)}
        {PAGES.filter(vis).map((p) => <Block key={p.id} p={p} o={near(p)} hot={hot}>{content(p)}</Block>)}
        {/* надпись на самом канвасе — видна на общем плане работ учеников */}
        <div style={{position: 'absolute', left: OV2[0] - 1400, top: -520, width: 2800, textAlign: 'center', fontFamily: 'Manrope', fontWeight: 800, fontSize: 260,
          letterSpacing: '-0.03em', color: '#F2F1EE', opacity: k(t, 28.2, 28.7) * (1 - k(t, 29.3, 29.55)), textShadow: '0 8px 30px rgba(0,0,0,.6)'}}>
          работы учеников
        </div>
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(140% 90% at 50% 40%, transparent 58%, rgba(0,0,0,.45) 100%)', pointerEvents: 'none', opacity: 1 - 0.7 * white}} />
      {/* белая вспышка на влёте в объект — она же прячет склейку */}
      <AbsoluteFill style={{background: '#FFFFFF', pointerEvents: 'none', opacity: k(t, 6.02, 6.22) * (1 - k(t, 6.24, 6.5))}} />
      <NearLayer cam={cam} t={t} />
      {cursor}
      <SpeakerCard src="r22/speaker.mp4" headY={920}
        plan={[{at: 16.7, to: 'compact'}, {at: 29.9, to: 'base'}, {at: 45.1, to: 'compact'}, {at: 52.9, to: 'base'}, {at: 69.3, to: 'wide'}]} />
      <Captions t={t} words={WORDS22} />
      {SFX.map(([s, f, v], i) => (
        <Sequence key={i} from={Math.round(s * fps)}><Audio src={staticFile(`sfx/${f}.wav`)} volume={v * SFX_GAIN} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
