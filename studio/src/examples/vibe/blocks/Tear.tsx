import React from 'react';
import {AbsoluteFill, interpolate, random} from 'remotion';
import {Chip, clamp, iv, Label, M, MI, out, spr, Zone} from './common';
import {Cursor} from '../../../kit/Cursor';

// Паттерн «Разрыв кадра» (ролик 22): «Замена всё равно будет. Вопрос — на какой ты стороне».
// На «Замена» кадр рвётся по вертикали рваным краем, половины расходятся с загнутыми краями:
// слева серая сторона «руками», справа живая мятная «с агентом». Курсор зависает между ними и уходит вправо.
export const TEAR_DUR = 4.0;
const EDGE = Array.from({length: 40}, (_, i) => [720 + (random(`te${i}`) - 0.5) * 70, (i / 39) * 2560] as const);
const edgePath = (side: 'L' | 'R') => side === 'L'
  ? `M 0 0 ${EDGE.map(([x, y]) => `L ${x} ${y}`).join(' ')} L 0 2560 Z`
  : `M 1440 0 ${EDGE.map(([x, y]) => `L ${x} ${y}`).join(' ')} L 1440 2560 Z`;

const Half: React.FC<{side: 'L' | 'R'; open: number; t: number}> = ({side, open, t}) => {
  const L = side === 'L';
  const dx = (L ? -1 : 1) * open * 150;
  return (
    <AbsoluteFill style={{clipPath: `path('${edgePath(side)}')`, transform: `translateX(${dx}px) rotateY(${(L ? 1 : -1) * open * 8}deg)`, transformOrigin: L ? '0 50%' : '100% 50%',
      filter: L ? `grayscale(${open}) brightness(${1 - open * 0.35})` : undefined}}>
      <Zone kind={L ? 'graphite' : 'mint'}>
        <div style={{position: 'absolute', left: L ? 250 : 820, top: 420, display: 'flex', flexDirection: 'column', gap: 30, alignItems: 'flex-start'}}>
          <Chip tone={L ? 'white' : 'mint'} size={64}>{L ? 'руками' : 'с агентом'}</Chip>
          {[0.25, 0.4, 0.15].map((k, i) => (
            <div key={i} style={{width: 380, height: 30, borderRadius: 15, background: 'rgba(255,255,255,.15)'}}>
              <div style={{width: `${(L ? k + Math.min(0.1, t * 0.02) : 1) * 100}%`, height: '100%', borderRadius: 15, background: L ? '#9BA1A8' : M}} />
            </div>
          ))}
          {!L && <div style={{marginTop: 20, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle at 34% 30%, #E6FFF8, ${M} 42%, #0F6E5A)`, boxShadow: `0 0 90px ${M}`, alignSelf: 'center'}} />}
          {L && <svg width={220} height={220} viewBox="0 0 40 40" style={{alignSelf: 'center', marginTop: 20, opacity: 0.8}}>
            <path d="M14 22 V10 a2.5 2.5 0 0 1 5 0 V20 M19 19 V8 a2.5 2.5 0 0 1 5 0 V19 M24 19 V10 a2.5 2.5 0 0 1 5 0 V21 M29 21 V14 a2.5 2.5 0 0 1 5 0 V25 c0 7 -5 11 -11 11 c-5 0 -8 -3 -10 -7 l-4 -7 a2.5 2.5 0 0 1 4 -3 l3 3" fill="none" stroke="#F2F3F5" strokeWidth={2} strokeLinecap="round" /></svg>}
        </div>
      </Zone>
      {/* загнутый край: тень и светлая кромка вдоль разрыва */}
      <svg width={1440} height={2560} style={{position: 'absolute', inset: 0}}>
        <path d={`M ${EDGE.map(([x, y]) => `${x} ${y}`).join(' L ')}`} fill="none" stroke="rgba(255,255,255,.85)" strokeWidth={6 * open} />
        <path d={`M ${EDGE.map(([x, y]) => `${x + (L ? -16 : 16)} ${y}`).join(' L ')}`} fill="none" stroke="rgba(0,0,0,.45)" strokeWidth={30 * open} style={{filter: 'blur(8px)'}} />
      </svg>
    </AbsoluteFill>
  );
};

export const TearScene: React.FC<{t: number}> = ({t}) => {
  const open = spr(t, 0.25, {damping: 16, stiffness: 120, mass: 1});
  const f30 = (s: number) => Math.round(s * 30);
  return (
    <AbsoluteFill style={{background: '#050607'}}>
      {/* свет из разрыва */}
      <AbsoluteFill style={{background: `linear-gradient(90deg, transparent 40%, rgba(255,255,255,${0.9 * open}) 50%, transparent 60%)`, filter: 'blur(20px)'}} />
      <Half side="L" open={open} t={t} />
      <Half side="R" open={open} t={t} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 230, display: 'flex', justifyContent: 'center', opacity: iv(t, 1.6, 1.9), transform: `translateY(${(1 - iv(t, 1.6, 1.9, 0, 1, out)) * 20}px)`}}>
        <Label size={84}>на какой ты стороне?</Label>
      </div>
      {t > 2.0 && <Cursor appear={f30(2.05)} clicks={[f30(3.5)]} moves={[
        {from: [720, 1300], to: [690, 1150], start: f30(2.05), end: f30(2.6)},
        {from: [690, 1150], to: [760, 1170], start: f30(2.6), end: f30(2.95), bend: 0.4},
        {from: [760, 1170], to: [1050, 780], start: f30(3.0), end: f30(3.45)},
      ]} size={96} />}
      <div style={{position: 'absolute', right: 110, top: 1330, opacity: iv(t, 3.5, 3.7), transform: `scale(${iv(t, 3.5, 3.7, 0.6, 1, out)})`}}>
        <Chip tone="mint" size={60} style={{color: MI}}>✓ выбор</Chip>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, background: '#050607', opacity: interpolate(t, [0, 0.25], [0.6, 0], clamp)}} />
    </AbsoluteFill>
  );
};
