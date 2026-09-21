import React from 'react';
import {AbsoluteFill, interpolate, random} from 'remotion';
import {elevation} from '../../../ds';
import {Chip, clamp, iv, Label, M, MI, O, out, spr, TXT, Zone} from './common';

// Паттерн «Колода фокусника» + «Осколки собираются» (ролик 22, кейсы учеников):
// «Система аналитики для экспедиторов вместо Excel-таблиц. Приложение для тренеров с функциями AI… Сквозная аналитика продаж и рекламы
// с AI-таргетологом. Это собрали мои ученики». Тасовка → карта 1 (таблица Excel бьётся, осколки собираются в дашборд) →
// карта 2 (приложение тренера) → карта 3 (сквозная аналитика) → веер фокусника на «мои ученики».
// Лица карт — векторные макеты без чисел: настоящие экраны учеников заменят их, когда Александр их пришлёт.
export const DECK_DUR = 12.1;
const CW = 560, CH = 800;
const T = {c1: 0.35, c2: 2.6, c3: 7.4, fan: 10.3};

const Back: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, borderRadius: 44, background: '#0B0C0E', overflow: 'hidden', boxShadow: 'inset 0 0 0 6px rgba(255,255,255,.12)'}}>
    <svg width={CW} height={CH} viewBox="0 0 56 80" style={{position: 'absolute', inset: 0}}>
      {Array.from({length: 7}, (_, i) => <rect key={i} x={6 + i * 2.5} y={6 + i * 2.5} width={44 - i * 5} height={68 - i * 5} rx={4} fill="none" stroke={i % 2 ? O : M} strokeWidth={0.5} opacity={0.7 - i * 0.07} />)}
      <circle cx={28} cy={40} r={7} fill={M} /><circle cx={28} cy={40} r={3.4} fill="#0B0C0E" />
    </svg>
  </div>
);
const Face: React.FC<{children: React.ReactNode; title: string}> = ({children, title}) => (
  <div style={{position: 'absolute', inset: 0, borderRadius: 44, background: 'linear-gradient(180deg,#1B1E22,#101214)', overflow: 'hidden', boxShadow: `inset 0 0 0 5px ${M}66`,
    padding: '40px 36px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 26}}>
    <Label size={66} weight={800}>{title}</Label>
    <div style={{position: 'relative', flex: 1}}>{children}</div>
  </div>
);

// Лицо 1: таблица Excel бьётся на осколки, осколки собираются в дашборд экспедитора (маршрут и столбики, без чисел).
const Forwarders: React.FC<{t: number}> = ({t}) => {
  const shatter = iv(t, 1.4, 1.8, 0, 1, out), gather = iv(t, 1.85, 2.4, 0, 1, out);
  const cells = Array.from({length: 30}, (_, i) => ({c: i % 5, r: Math.floor(i / 5)}));
  return (
    <>
      {gather < 1 && cells.map(({c, r}, i) => {
        const x0 = c * 96, y0 = r * 88;
        const dx = (random(`fx${i}`) - 0.5) * 700 * shatter, dy = (random(`fy${i}`) - 0.5) * 900 * shatter, rot = (random(`fr${i}`) - 0.5) * 220 * shatter;
        const tx = 40 + (i % 6) * 70, ty = 300 + Math.floor(i / 6) * 30; // осколки втягиваются в место столбиков
        const x = x0 + dx + (tx - x0 - dx) * gather, y = y0 + dy + (ty - y0 - dy) * gather;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 92, height: 84, background: r === 0 ? '#1F6E43' : '#F2F3F5', border: '2px solid #9BA1A8',
          transform: `rotate(${rot * (1 - gather)}deg) scale(${1 - gather * 0.6})`, opacity: 1 - gather * 0.8}} />;
      })}
      <div style={{position: 'absolute', inset: 0, opacity: gather}}>
        <svg width={488} height={560} viewBox="0 0 488 560">
          <path d="M40 120 C120 40, 200 200, 290 110 S 430 60, 450 150" fill="none" stroke={M} strokeWidth={8} strokeLinecap="round" strokeDasharray="1 18" />
          {[[40, 120], [290, 110], [450, 150]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={16} fill={i === 2 ? O : M} />)}
          {[0.45, 0.7, 0.55, 0.9, 0.65, 0.8].map((h, i) => <rect key={i} x={30 + i * 74} y={520 - h * 260 * gather} width={48} height={h * 260 * gather} rx={10} fill={i === 3 ? O : M} opacity={0.9} />)}
        </svg>
      </div>
    </>
  );
};
// Лицо 2: приложение тренера — кольца активности, тарелка питания, чип ИИ.
const Trainer: React.FC<{t: number}> = ({t}) => {
  const k = iv(t, 3.2, 4.6, 0, 1, out);
  return (
    <div style={{position: 'relative', width: '100%', height: '100%'}}>
      <svg width={488} height={380} viewBox="0 0 488 380">
        {[[150, O, 0.8], [115, M, 0.65], [80, '#F2F3F5', 0.9]].map(([r, c, v], i) => (
          <g key={i}>
            <circle cx={244} cy={190} r={r as number} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={26} />
            <circle cx={244} cy={190} r={r as number} fill="none" stroke={c as string} strokeWidth={26} strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * (r as number) * (v as number) * k} 9999`} transform="rotate(-90 244 190)" />
          </g>
        ))}
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <svg width={150} height={150} viewBox="0 0 40 40"><circle cx={20} cy={20} r={17} fill="#F2F3F5" /><circle cx={14} cy={16} r={5} fill={O} /><circle cx={25} cy={15} r={4} fill={M} /><path d="M12 26 h16" stroke="#2A2D32" strokeWidth={3} strokeLinecap="round" /></svg>
        <Chip tone="mint" size={60}>ИИ · питание</Chip>
      </div>
    </div>
  );
};
// Лицо 3: сквозная аналитика — реклама → заявки → продажи, чип ИИ-таргетолога.
const Funnel: React.FC<{t: number}> = ({t}) => {
  const k = iv(t, 8.0, 9.2, 0, 1, out);
  const rows: [string, number, string][] = [['реклама', 1, O], ['заявки', 0.72, '#F2F3F5'], ['продажи', 0.46, M]];
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 26, alignItems: 'center', paddingTop: 20}}>
      {rows.map(([name, w, c], i) => (
        <div key={name} style={{width: `${w * 100 * Math.min(1, k * 1.3 - i * 0.15 + 0.15)}%`, height: 104, borderRadius: 26, background: c, display: 'grid', placeItems: 'center',
          boxShadow: `inset 0 3px 0 rgba(255,255,255,.5), ${elevation[1]}`}}>
          <Label size={58} color={c === M ? MI : '#15171A'}>{name}</Label>
        </div>
      ))}
      <div style={{marginTop: 20, transform: `scale(${iv(t, 9.0, 9.4, 0, 1, out)})`}}><Chip tone="orange" size={60}>ИИ-таргетолог</Chip></div>
    </div>
  );
};

type Pose = {x: number; y: number; r: number; s: number; flip: number; z: number};
// Раскладка карт по времени: колода в центре → карта вытягивается вверх и переворачивается → уезжает в сторону → веер.
const poseOf = (t: number, i: number): Pose => {
  const draw = [T.c1, T.c2, T.c3][i];
  const shuffle = Math.sin(Math.min(1, t / 0.35) * Math.PI) * (i % 2 ? -1 : 1) * 160; // тасовка «ласточкой»
  const base: Pose = {x: 720 + shuffle, y: 820 + i * 6, r: (i - 1) * 3, s: 0.9, flip: 0, z: 10 - i};
  const up = spr(t, draw, {damping: 15, stiffness: 140, mass: 0.9});
  let p: Pose = t < draw ? base : {x: 720, y: 820 - up * 20, r: 0, s: 0.9 + up * 0.18, flip: iv(t, draw + 0.1, draw + 0.5), z: 30};
  const next = [T.c2, T.c3, T.fan][i];
  if (t >= next && t < T.fan) {
    const k = iv(t, next, next + 0.45, 0, 1, out);
    const side = [{x: 250, y: 560}, {x: 1190, y: 560}, {x: 720, y: 820}][i];
    p = {x: 720 + (side.x - 720) * k, y: 800 + (side.y - 800) * k, r: (i ? 8 : -8) * k, s: 1.08 - 0.5 * k, flip: 1, z: 20};
  }
  if (t >= T.fan) {
    const k = spr(t, T.fan, {damping: 14, stiffness: 120, mass: 0.9});
    const from = i === 2 ? {x: 720, y: 800, s: 1.08} : {x: i ? 1190 : 250, y: 560, s: 0.58};
    const to = {x: 720 + (i - 1) * 300, y: 860 + Math.abs(i - 1) * 50, r: (i - 1) * 16, s: 0.78};
    p = {x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, r: to.r * k, s: from.s + (to.s - from.s) * k, flip: 1, z: 10 + (i === 1 ? 5 : i)};
  }
  return p;
};

export const DeckScene: React.FC<{t: number}> = ({t}) => {
  const faces = [
    <Face key="1" title="экспедиторы"><Forwarders t={t - T.c1} /></Face>,
    <Face key="2" title="тренеры"><Trainer t={t - T.c2 + 2.6} /></Face>,
    <Face key="3" title="сквозная аналитика"><Funnel t={t - T.c3 + 7.4} /></Face>,
  ];
  const fanK = iv(t, T.fan + 0.2, T.fan + 0.6, 0, 1, out);
  return (
    <Zone kind={t < T.c3 ? 'graphite' : 'ember'}>
      <AbsoluteFill style={{perspective: 2000}}>
        {[2, 1, 0].map((i) => {
          const p = poseOf(t, i);
          const shown = p.flip > 0.5;
          return (
            <div key={i} style={{position: 'absolute', left: p.x - CW / 2, top: p.y - CH / 2, width: CW, height: CH, zIndex: p.z,
              transform: `rotate(${p.r}deg) scale(${p.s}) rotateY(${p.flip * 180}deg)`, transformStyle: 'preserve-3d', boxShadow: elevation[3], borderRadius: 44}}>
              <div style={{position: 'absolute', inset: 0, transform: shown ? 'rotateY(180deg)' : undefined}}>{shown ? faces[i] : <Back />}</div>
            </div>
          );
        })}
      </AbsoluteFill>
      {/* подписи под веером: «ученики» */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', justifyContent: 'center', opacity: fanK, transform: `translateY(${(1 - fanK) * 30}px)`}}>
        <Chip tone="mint" size={76}>собрали ученики</Chip>
      </div>
      {t < T.fan && <div style={{position: 'absolute', left: 0, right: 0, top: 250, display: 'flex', justifyContent: 'center', opacity: interpolate(t, [T.c1, T.c1 + 0.4], [0, 1], clamp)}}>
        <Label size={60} weight={700} color={TXT}>{t < T.c2 ? 'вместо Excel' : t < T.c3 ? 'ИИ трекает питание и активность' : 'реклама → продажи'}</Label>
      </div>}
    </Zone>
  );
};
