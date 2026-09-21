import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {elevation} from '../../../ds';
import {Chip, clamp, easeIn, Glass, iv, Label, M, O, spr, Zone} from './common';

// Паттерн «Перемотка стройки» + «Рекурсия кадра» (ролик 22, фраза «Я заменил на ИИ своего монтажёра, и ты сейчас видишь результат»).
// 0–0,5 с таймлайн этого ролика играет; 0,55–1,1 с перемотка назад с помехами VHS — клипы уходят в обратном порядке;
// 1,1–1,35 с пусто; 1,35–2,4 с ускоренная перемотка вперёд — клипы собираются сами, без курсора;
// 2,6–3,4 с в окне превью идёт этот же кадр, внутри него снова он; 3,4–4,5 с камера влетает в превью.
export const REWIND_DUR = 4.5;

type ClipDef = {track: number; x: number; w: number; kind: 'video' | 'text' | 'gfx' | 'sound'};
const CLIPS: ClipDef[] = [
  {track: 0, x: 0, w: 300, kind: 'video'}, {track: 0, x: 310, w: 240, kind: 'video'}, {track: 0, x: 560, w: 330, kind: 'video'},
  {track: 1, x: 20, w: 170, kind: 'text'}, {track: 1, x: 250, w: 210, kind: 'text'}, {track: 1, x: 560, w: 180, kind: 'text'}, {track: 1, x: 770, w: 120, kind: 'text'},
  {track: 2, x: 90, w: 230, kind: 'gfx'}, {track: 2, x: 420, w: 280, kind: 'gfx'},
  {track: 3, x: 0, w: 520, kind: 'sound'}, {track: 3, x: 540, w: 350, kind: 'sound'},
];
const TRACK_NAMES = ['Видео', 'Титры', 'Графика', 'Звук'];
const FILL = {video: 'linear-gradient(180deg,#4A4F57,#1C1F23)', text: 'linear-gradient(180deg,#FFFFFF,#D7DADD)', gfx: `linear-gradient(180deg,#FFB07A,${O})`, sound: `linear-gradient(180deg,#A8FFE9,${M})`};

const ClipView: React.FC<{c: ClipDef; dx: number; blur: number; h: number}> = ({c, dx, blur, h}) => (
  <div style={{position: 'absolute', left: c.x + dx, top: 0, width: c.w, height: h, borderRadius: h / 2, background: FILL[c.kind], filter: blur ? `blur(${blur}px)` : undefined,
    boxShadow: `inset 0 2px 0 rgba(255,255,255,.5), inset 0 -4px 0 rgba(0,0,0,.25), ${elevation[1]}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    {c.kind === 'video' && <svg width={h * 0.45} height={h * 0.45} viewBox="0 0 40 40"><path d="M13 9 L32 20 L13 31 Z" fill="#FFFFFF" /></svg>}
    {c.kind === 'text' && <span style={{fontFamily: 'Manrope', fontWeight: 800, fontSize: h * 0.5, color: '#15171A'}}>Aa</span>}
    {c.kind === 'sound' && (
      <svg width={c.w - 30} height={h * 0.6}>{Array.from({length: Math.floor((c.w - 30) / 13)}, (_, i) => {
        const hh = h * 0.12 + Math.abs(Math.sin(i * 1.7)) * h * 0.4; return <rect key={i} x={i * 13} y={(h * 0.6 - hh) / 2} width={7} height={hh} rx={3.5} fill="#05231D" />;
      })}</svg>
    )}
  </div>
);

// Позиция клипа во времени: при перемотке назад клипы уходят влево в обратном порядке, при перемотке вперёд прилетают справа по порядку.
const clipState = (t: number, i: number, n: number) => {
  const back0 = 0.55 + ((n - 1 - i) / n) * 0.4, fwd0 = 1.35 + (i / n) * 0.85;
  if (t < back0) return {dx: 0, blur: 0, on: 1};
  if (t < 1.35) { const k = iv(t, back0, back0 + 0.16, 0, 1, easeIn); return {dx: -k * 1400, blur: k * 16, on: k < 1 ? 1 : 0}; }
  const k = spr(t, fwd0, {damping: 16, stiffness: 220, mass: 0.6});
  return {dx: (1 - k) * 1300, blur: Math.max(0, 1 - k) * 18, on: t >= fwd0 - 0.02 ? 1 : 0};
};

export const TimelinePanel: React.FC<{t: number; w?: number; mini?: boolean}> = ({t, w = 1240, mini = false}) => {
  const k = w / 1240, rowH = 128 * k, clipH = 76 * k;
  const back = t > 0.55 && t < 1.1, fwd = t > 1.35 && t < 2.4;
  const play = t < 0.55 ? 330 + t * 400 : t < 1.1 ? interpolate(t, [0.55, 1.1], [550, 330], clamp) : t < 1.35 ? 330 : t < 2.4 ? interpolate(t, [1.35, 2.4], [330, 1150], clamp) : 1150 - ((t - 2.4) * 120) % 800;
  return (
    <Glass w={w} h={rowH * 4 + 70 * k} r={48 * k}>
      <div style={{position: 'absolute', left: 36 * k, top: 34 * k, right: 36 * k}}>
        {TRACK_NAMES.map((name, row) => (
          <div key={name} style={{position: 'relative', height: rowH, display: 'flex', alignItems: 'center', borderBottom: row < 3 ? `${2 * k}px solid rgba(255,255,255,.08)` : undefined}}>
            {!mini && <div style={{width: 250 * k, flex: 'none'}}><Label size={58 * k} weight={700}>{name}</Label></div>}
            <div style={{position: 'relative', flex: 1, height: clipH}}>
              {CLIPS.map((c, i) => {
                if (c.track !== row) return null;
                const s = clipState(t, i, CLIPS.length);
                return s.on ? <ClipView key={i} c={{...c, x: c.x * k, w: c.w * k}} dx={s.dx * k} blur={s.blur * k} h={clipH} /> : null;
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', top: 20 * k, bottom: 20 * k, left: play * k, width: 6 * k, borderRadius: 3, background: O, boxShadow: `0 0 ${18 * k}px ${O}`,
        filter: back || fwd ? `blur(${2 * k}px)` : undefined}} />
    </Glass>
  );
};

// Мини-кадр ролика для рекурсии: фон, превью (внутри — снова мини-кадр), таймлайн, карточка спикера, строка субтитров.
const MiniFrame: React.FC<{depth: number; t: number}> = ({depth, t}) => (
  <div style={{position: 'relative', width: 1440, height: 2560, background: 'radial-gradient(90% 60% at 30% 20%, #3B3F45 0%, #24272B 50%, #141618 100%)', overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 585, top: 190, width: 270, height: 480, borderRadius: 26, overflow: 'hidden', boxShadow: `0 0 0 6px rgba(255,255,255,.35), 0 0 40px ${M}55`}}>
      {depth > 0 ? <div style={{transform: `scale(${270 / 1440})`, transformOrigin: '0 0'}}><MiniFrame depth={depth - 1} t={t} /></div> : <div style={{width: '100%', height: '100%', background: '#1C1F23'}} />}
    </div>
    <div style={{position: 'absolute', left: 100, top: 720}}><TimelinePanel t={2.6 + t} mini /></div>
    <div style={{position: 'absolute', left: 280, top: 1250, width: 880, height: 26, borderRadius: 13, background: 'rgba(242,243,245,.7)'}} />
    <div style={{position: 'absolute', left: 288, top: 1701, width: 864, height: 819, borderRadius: 64, background: 'linear-gradient(180deg,#6B5A4E,#3A302A)', boxShadow: 'inset 0 0 0 4px rgba(255,255,255,.2)'}}>
      <svg width={864} height={819} viewBox="0 0 100 95"><circle cx={50} cy={40} r={16} fill="rgba(255,236,220,.55)" /><path d="M18 95 C18 70 32 62 50 62 C68 62 82 70 82 95 Z" fill="rgba(40,32,28,.8)" /></svg>
    </div>
  </div>
);

const PREVIEW = {x: 585, y: 190, w: 270, h: 480};
export const RewindScene: React.FC<{t: number}> = ({t}) => {
  const back = t > 0.55 && t < 1.1, fwd = t > 1.35 && t < 2.4;
  const vhs = back ? 1 : fwd ? 0.6 : 0;
  const shake = vhs ? Math.sin(t * 90) * 6 * vhs : 0;
  const recur = iv(t, 2.55, 2.95);
  // влёт в превью: масштаб вокруг центра окна превью, пока окно не накроет кадр
  const push = t < 3.4 ? 1 : interpolate(t, [3.4, 4.5], [1, 1440 / PREVIEW.w], {...clamp, easing: easeIn});
  const cx = PREVIEW.x + PREVIEW.w / 2, cy = PREVIEW.y + PREVIEW.h / 2;
  return (
    <Zone kind="graphite">
      <AbsoluteFill style={{transformOrigin: `${cx}px ${cy}px`, transform: `scale(${push}) translateX(${shake}px)`}}>
        {/* окно превью: сначала тёмное, на «видишь результат» в нём этот же кадр, а внутри — снова он */}
        <div style={{position: 'absolute', left: PREVIEW.x, top: PREVIEW.y, width: PREVIEW.w, height: PREVIEW.h, borderRadius: 26, overflow: 'hidden',
          boxShadow: `0 0 0 6px rgba(255,255,255,.35), ${elevation[3]}, 0 0 ${60 * recur}px ${M}88`, background: '#101214'}}>
          <div style={{opacity: recur, transform: `scale(${PREVIEW.w / 1440})`, transformOrigin: '0 0'}}><MiniFrame depth={2} t={t} /></div>
          {recur < 1 && <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: 1 - recur}}>
            <svg width={90} height={90} viewBox="0 0 40 40"><path d="M13 9 L32 20 L13 31 Z" fill="rgba(255,255,255,.8)" /></svg></div>}
        </div>
        <div style={{position: 'absolute', left: 100, top: 720}}><TimelinePanel t={t} /></div>
        {/* индикатор перемотки */}
        <div style={{position: 'absolute', left: 100, top: 1316, opacity: back || fwd ? 1 : 0}}>
          <Chip tone={back ? 'orange' : 'mint'} size={54}>{back ? '◀◀ перемотка' : '▶▶ собирает агент'}</Chip>
        </div>
      </AbsoluteFill>
      {/* помехи VHS: горизонтальные полосы и цветовой сдвиг в палитре */}
      {vhs > 0 && (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          <AbsoluteFill style={{opacity: 0.22 * vhs, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.35) 0 2px, transparent 2px 7px)'}} />
          {[0, 1, 2].map((i) => {
            const y = ((t * 1700 + i * 830) % 2560);
            return <div key={i} style={{position: 'absolute', left: 0, right: 0, top: y, height: 40 + i * 20, background: `linear-gradient(90deg, ${O}55, ${M}55, transparent)`, mixBlendMode: 'screen', opacity: vhs}} />;
          })}
        </AbsoluteFill>
      )}
    </Zone>
  );
};
