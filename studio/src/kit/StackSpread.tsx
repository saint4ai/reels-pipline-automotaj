import React from 'react';
import {PC} from './poster';

// Стопка карточек, которая разлетается по кадру (перенос «Stack Spread» из Hyperiux Vault / 21st.dev, 19.09.2026).
// В оригинале прогресс берётся из прокрутки страницы, а параллакс — из курсора; в ролике ни того ни другого нет,
// поэтому прогресс задаёт вызывающий (0 — стопка, 1 — разлёт), а параллакс — медленный дрейф по времени.
// Геометрия оригинала сохранена: смещения и наклоны в стопке, точки разлёта, порядок слоёв, глубина параллакса.
// Единицы x/y/w/h — проценты ширины и высоты сцены (в оригинале vw/vh).
export type SpreadCard = {
  face: React.ReactNode;
  stack: {x: number; y: number; rotate: number};
  target: {x: number; y: number; w: number; h: number; scale?: number};
  z: number;
};

// Раскладка оригинала (8 карточек, порядок = слои снизу вверх), пересчитанная под вертикальный кадр:
// ширины ×1,6 и высоты ×0,65, чтобы карточки не превращались в узкие полоски на 9:16.
export const SPREAD_LAYOUT: Omit<SpreadCard, 'face'>[] = [
  {stack: {x: -8, y: -10, rotate: -18}, target: {x: -22, y: -34, w: 27, h: 15, scale: 0.7}, z: 2},
  {stack: {x: 14, y: -10, rotate: 20}, target: {x: 26, y: -30, w: 29, h: 21, scale: 0.9}, z: 3},
  {stack: {x: -16, y: 0, rotate: -4}, target: {x: -30, y: -2, w: 24, h: 21, scale: 0.9}, z: 4},
  {stack: {x: 1, y: -10, rotate: -2}, target: {x: 4, y: -32, w: 40, h: 20, scale: 0.8}, z: 5},
  {stack: {x: 18, y: 1, rotate: 6}, target: {x: 30, y: 6, w: 29, h: 21, scale: 0.8}, z: 6},
  {stack: {x: -6, y: 10, rotate: 6}, target: {x: -22, y: 30, w: 35, h: 17, scale: 0.9}, z: 7},
  {stack: {x: 8, y: 7, rotate: 3}, target: {x: 4, y: 34, w: 32, h: 17, scale: 0.8}, z: 8},
  {stack: {x: 20, y: 12, rotate: -7}, target: {x: 28, y: 30, w: 26, h: 13, scale: 0.9}, z: 9},
];

const depthOf = (i: number, n: number) => (n <= 1 ? 1 : 0.55 + (i / (n - 1)) * 0.75);

// mute 0…1 — приглушение, когда разлёт работает фоном под надписями и карточкой спикера (правка 19.09.2026):
// яркость и насыщенность ниже, дальние карточки чуть размыты, тени мягче. Фильтр висит на самой карточке,
// а не на предке, поэтому стекло поверх разлёта по-прежнему размывает его (правило Backdrop Root).
export const StackSpread: React.FC<{cards: SpreadCard[]; progress: number; t: number; w: number; h: number; stackScale?: number; radius?: number; drift?: number; mute?: number}> =
  ({cards, progress: p, t, w, h, stackScale = 0.82, radius = 22, drift = 1, mute = 0}) => (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden'}}>
      {cards.map((c, i) => {
        const d = depthOf(i, cards.length) * p * drift;
        // Дрейф вместо курсора: у каждой карточки своя фаза, дальние слои двигаются меньше.
        const dx = Math.sin(t * 0.45 + i * 1.7) * 1.1 * d, dy = Math.cos(t * 0.38 + i * 2.3) * 0.8 * d;
        const x = c.stack.x + (c.target.x - c.stack.x) * p + dx, y = c.stack.y + (c.target.y - c.stack.y) * p + dy;
        const sc = stackScale + ((c.target.scale ?? 1) - stackScale) * p;
        const cw = (c.target.w / 100) * w, ch = (c.target.h / 100) * h;
        return (
          <div key={i} style={{position: 'absolute', left: w / 2 + (x / 100) * w - cw / 2, top: h / 2 + (y / 100) * h - ch / 2, width: cw, height: ch, zIndex: c.z,
            transform: `rotate(${c.stack.rotate * (1 - p)}deg) scale(${sc})`, borderRadius: radius, overflow: 'hidden',
            filter: mute ? `brightness(${1 - 0.5 * mute}) saturate(${1 - 0.35 * mute}) blur(${(1.3 - depthOf(i, cards.length)) * 6 * mute}px)` : undefined,
            boxShadow: `0 2px 0 rgba(255,255,255,${0.08 * (1 - mute)}) inset, 0 18px 40px rgba(0,0,0,.45), 0 60px 120px rgba(0,0,0,${0.35 * (1 - mute * 0.5)})`}}>
            {c.face}
          </div>
        );
      })}
    </div>
  );

// ---------- лица карточек: «кодер + космос», палитра оранжевый / мятный / чёрный / белый ----------
const fill: React.CSSProperties = {position: 'absolute', inset: 0};
const stars = (seed: number, n: number, color = '#FFFFFF') => {
  let s = seed;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  return Array.from({length: n}, (_, i) => <circle key={i} cx={`${r() * 100}%`} cy={`${r() * 100}%`} r={r() * 1.8 + 0.4} fill={color} opacity={0.35 + r() * 0.6} />);
};

// Планета с кольцом на чёрном: светлая сторона сверху слева.
export const PlanetFace: React.FC<{tone?: 'orange' | 'mint'}> = ({tone = 'orange'}) => {
  const [a, b] = tone === 'orange' ? ['#FFC39A', PC.orange] : ['#B8FFEC', PC.mint];
  return (
    <div style={{...fill, background: '#07080A'}}>
      <svg width="100%" height="100%" style={fill}>{stars(7, 60)}</svg>
      <div style={{position: 'absolute', left: '26%', top: '18%', width: '48%', aspectRatio: '1', borderRadius: '50%',
        background: `radial-gradient(circle at 32% 30%, ${a} 0%, ${b} 45%, #3A1A0A 100%)`, boxShadow: `0 0 80px ${b}55`}} />
      <div style={{position: 'absolute', left: '10%', top: '40%', width: '80%', height: '12%', borderRadius: '50%', border: `3px solid ${a}`, transform: 'rotate(-14deg)', opacity: 0.8}} />
    </div>
  );
};
// Звёздное небо с мятным созвездием.
export const StarsFace: React.FC = () => (
  <div style={{...fill, background: '#0A0B0D'}}>
    <svg width="100%" height="100%" style={fill}>
      {stars(11, 90)}
    </svg>
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={fill}>
      <polyline points="15,70 32,52 48,58 66,30 84,38" fill="none" stroke={PC.mint} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
    </svg>
    {[[15, 70], [32, 52], [48, 58], [66, 30], [84, 38]].map(([x, y]) => <span key={x} style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: 12, height: 12, margin: -6, borderRadius: '50%', background: PC.mint}} />)}
  </div>
);
// Карточка кода: строки-штрихи с подсветкой синтаксиса вместо букв — на фоне текст всё равно не читается,
// а мелкие буквы нарушают минимум кегля и вылезали за карточку (правка 19.09.2026).
const CODE_ROWS: [number, [string, number][]][] = [
  [0, [[PC.mint, 26], ['#C9CED4', 14]]], [1, [['#C9CED4', 16], [PC.orange, 10]]], [1, [['#C9CED4', 18], [PC.orange, 30]]],
  [1, [['#C9CED4', 16], [PC.mint, 16]]], [0, [['#C9CED4', 8]]],
];
export const CodeFace: React.FC = () => (
  <div style={{...fill, background: '#0E1013', padding: '8% 7%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '7%'}}>
    <div style={{display: 'flex', gap: 10, marginBottom: '2%'}}>{[PC.orange, '#8C9196', PC.mint].map((c) => <span key={c} style={{width: 18, height: 18, borderRadius: '50%', background: c}} />)}</div>
    {CODE_ROWS.map(([indent, parts], i) => (
      <div key={i} style={{display: 'flex', gap: '4%', height: '9%', paddingLeft: `${indent * 10}%`}}>
        {parts.map(([c, wd], k) => <span key={k} style={{width: `${wd}%`, borderRadius: 999, background: c}} />)}
      </div>
    ))}
  </div>
);
// Таймлайн монтажа: дорожки видео, субтитров, графики и плейхед.
export const TimelineFace: React.FC = () => {
  const rows: [string, number[][]][] = [[PC.orange, [[0, 30], [34, 22], [60, 36]]], [PC.mint, [[4, 12], [20, 10], [36, 14], [58, 12], [76, 16]]], ['#EEEFF0', [[10, 24], [50, 30]]]];
  return (
    <div style={{...fill, background: '#15171A', padding: '26px 22px', boxSizing: 'border-box'}}>
      {rows.map(([c, segs], row) => (
        <div key={row} style={{position: 'relative', height: '22%', marginBottom: '6%'}}>
          {segs.map(([l, wd]) => <span key={l} style={{position: 'absolute', left: `${l}%`, width: `${wd}%`, top: 0, bottom: 0, borderRadius: 8, background: c}} />)}
        </div>
      ))}
      <span style={{position: 'absolute', left: '46%', top: 10, bottom: 10, width: 4, background: '#FF5A3C'}} />
    </div>
  );
};
// Орбиты: схема чернилами на мятном.
export const OrbitFace: React.FC = () => (
  <div style={{...fill, background: PC.mint}}>
    <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" style={fill}>
      {[40, 64, 88].map((r) => <ellipse key={r} cx={100} cy={100} rx={r} ry={r * 0.55} fill="none" stroke={PC.mintInk} strokeWidth={1.6} strokeDasharray={r === 64 ? '5 4' : undefined} />)}
      <circle cx={100} cy={100} r={16} fill={PC.mintInk} />
      <circle cx={164} cy={82} r={7} fill={PC.orange} /><circle cx={52} cy={126} r={5} fill="#FFFFFF" />
    </svg>
  </div>
);
// Каркасный глобус мятными линиями.
export const GlobeFace: React.FC = () => (
  <div style={{...fill, background: '#07080A'}}>
    <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" style={fill}>
      {Array.from({length: 9}, (_, i) => <ellipse key={`m${i}`} cx={100} cy={100} rx={Math.abs(Math.cos((i / 9) * Math.PI)) * 70} ry={70} fill="none" stroke={PC.mint} strokeWidth={0.8} opacity={0.7} />)}
      {Array.from({length: 7}, (_, i) => { const y = 100 + (i - 3) * 20; const rx = Math.sqrt(Math.max(0, 70 * 70 - (y - 100) ** 2)); return <ellipse key={`p${i}`} cx={100} cy={y} rx={rx} ry={rx * 0.18} fill="none" stroke={PC.mint} strokeWidth={0.8} opacity={0.7} />; })}
    </svg>
  </div>
);
// Полумесяц на сером.
export const MoonFace: React.FC = () => (
  <div style={{...fill, background: PC.grey}}>
    <div style={{position: 'absolute', left: '32%', top: '14%', width: '36%', aspectRatio: '1', borderRadius: '50%', background: PC.ink, boxShadow: 'inset -34px 0 0 0 #F6F7F8'}} />
  </div>
);
// Журнал агента: три этапа отмечены галочками, четвёртый — полоса рендера. Без мелкого текста.
export const LogFace: React.FC = () => (
  <div style={{...fill, background: PC.orange, padding: '9% 8%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
    {[62, 44, 54].map((wd, i) => (
      <div key={i} style={{display: 'flex', alignItems: 'center', gap: '6%', height: '14%'}}>
        <svg viewBox="0 0 24 24" style={{height: '100%', aspectRatio: '1', flex: 'none'}}><circle cx={12} cy={12} r={11} fill={PC.ink} /><path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke={PC.orange} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span style={{width: `${wd}%`, height: '55%', borderRadius: 999, background: PC.ink, opacity: 0.85}} />
      </div>
    ))}
    <div style={{height: '14%', borderRadius: 999, background: 'rgba(10,11,13,.25)', overflow: 'hidden'}}><div style={{width: '64%', height: '100%', borderRadius: 999, background: PC.ink}} /></div>
  </div>
);

export const SPACE_CODER_FACES = [<PlanetFace key="p" />, <StarsFace key="s" />, <CodeFace key="c" />, <TimelineFace key="t" />, <OrbitFace key="o" />, <GlobeFace key="g" />, <MoonFace key="m" />, <LogFace key="l" />];
export const spaceCoderCards = (): SpreadCard[] => SPREAD_LAYOUT.map((l, i) => ({...l, face: SPACE_CODER_FACES[i]}));
