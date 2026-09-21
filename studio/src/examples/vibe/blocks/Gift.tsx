import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile} from 'remotion';
import {Object25D} from '../../../kit/liquid/Object25D';
import {NightStage, type Spot} from '../../../kit/liquid/stage';
import {Headline} from '../Headline';
import {Chip, clamp, iv, M, O, out, spr} from './common';

// Подарок (ролик 22): «И в подарок моя премиальная система монтажа, которой собран этот ролик».
// Правка Александра 20.09.2026: крышка не должна перекрывать кадры, «не совсем вау» — нужно летящее конфетти.
// Тёмная сцена с прожектором; стеклянная коробка (сгенерированный объект из public/objects, стиль ролика 21) вздрагивает и на «в подарок»
// раскрывается со вспышкой и залпом конфетти; из луча спиралью вылетают настоящие кадры этого ролика. Спираль считается в 3D вручную:
// задняя половина рисуется за коробкой, передняя — перед ней, поэтому крышка всегда позади кадров.
export const GIFT_DUR = 4.4;
const FRAMES = Array.from({length: 8}, (_, i) => `reels/vibe/frames/f${i}.jpg`);
const BOX = {x: 720, y: 1080, size: 860};
const OPEN = 0.5;
const SPOTS: Spot[] = [{x: 720, y: -200, angle: 0, spread: 13, power: 1.1}, {x: 150, y: -120, angle: 18, spread: 10, power: 0.5, color: '214,255,245'}];

type Piece = {x: number; y: number; z: number; r: number; w: number; h: number; c: string};
// Конфетти: залп из раскрытой коробки вверх и в стороны, дальше падает с вращением и лёгким парусением.
const confetti = (t: number): Piece[] => {
  const k = t - OPEN;
  if (k < 0) return [];
  return Array.from({length: 90}, (_, i) => {
    const a = -Math.PI / 2 + (random(`ca${i}`) - 0.5) * 2.4, v = 900 + random(`cv${i}`) * 1500;
    const z = (random(`cz${i}`) - 0.5) * 2; // −1 далеко … 1 близко
    const drift = Math.sin(k * (3 + random(`cf${i}`) * 4) + i) * 40;
    return {
      x: BOX.x + Math.cos(a) * v * k * 0.9 + drift, y: BOX.y - 200 + Math.sin(a) * v * k + 1400 * k * k, z,
      r: k * (400 + random(`cr${i}`) * 900) * (i % 2 ? 1 : -1), w: 18 + random(`cw${i}`) * 22, h: 28 + random(`ch${i}`) * 30,
      c: [M, O, '#FFFFFF', '#FFD2B0', '#B6FFEC'][i % 5],
    };
  });
};

const FrameCard: React.FC<{src: string; x: number; y: number; s: number; tilt: number; o: number; blur: number}> = ({src, x, y, s, tilt, o, blur}) => (
  <div style={{position: 'absolute', left: x - 115 * s, top: y - 205 * s, width: 230 * s, height: 410 * s, borderRadius: 26 * s, overflow: 'hidden', opacity: o,
    transform: `rotateY(${tilt}deg)`, boxShadow: `0 ${24 * s}px ${50 * s}px rgba(0,0,0,.55), 0 0 0 ${5 * s}px rgba(255,255,255,.85), 0 0 ${40 * s}px ${M}55`, filter: blur ? `blur(${blur}px)` : undefined}}>
    <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  </div>
);

export const GiftScene: React.FC<{t: number}> = ({t}) => {
  const opened = t >= OPEN;
  const shake = t > 0.22 && t < OPEN ? Math.sin(t * 70) * 10 * iv(t, 0.22, OPEN) : 0;
  const flash = interpolate(t, [OPEN - 0.02, OPEN + 0.08, OPEN + 0.6], [0, 1, 0], clamp);
  const rise = iv(t, OPEN + 0.15, 2.4, 0, 1, out);
  // кадры спирали: угол вокруг вертикальной оси над коробкой, подъём вверх по мере выхода из луча
  const cards = FRAMES.map((src, i) => {
    const born = OPEN + 0.18 + i * 0.1;
    const k = iv(t, born, born + 0.5, 0, 1, out);
    const a = (i / FRAMES.length) * Math.PI * 2 + t * 1.3;
    const R = 470 * k, depth = Math.cos(a); // 1 — к зрителю
    const s = (0.72 + 0.28 * (depth + 1) / 2) * (0.4 + 0.6 * k);
    return {src, i, depth, x: BOX.x + Math.sin(a) * R, y: BOX.y - 200 - rise * (40 + (i % 4) * 50) - k * 60, s, tilt: -Math.sin(a) * 35, o: k, blur: depth < -0.3 ? 2 : 0};
  });
  const pieces = confetti(t);
  const pieceEl = (p: Piece, i: number) => {
    const s = 0.7 + (p.z + 1) * 0.35;
    return <div key={i} style={{position: 'absolute', left: p.x, top: p.y, width: p.w * s, height: p.h * s, borderRadius: 4, background: p.c,
      transform: `rotate(${p.r}deg) rotateX(${p.r * 1.7}deg)`, opacity: 1 - iv(t, 3.4, 4.3), filter: p.z > 0.7 ? 'blur(3px)' : undefined, boxShadow: `0 0 10px ${p.c}66`}} />;
  };
  return (
    <AbsoluteFill style={{transform: `translateX(${shake * 0.4}px)`}}>
      <NightStage t={t} spots={SPOTS} dust={60} floor={1420} />
      {/* задний план: кадры и конфетти за коробкой */}
      {cards.filter((c) => c.depth < 0).map((c) => <FrameCard key={c.i} {...c} />)}
      {pieces.filter((p) => p.z < 0).map(pieceEl)}
      {/* луч света из раскрытой коробки */}
      {opened && <div style={{position: 'absolute', left: BOX.x - 260, top: 0, width: 520, height: BOX.y - 120, opacity: iv(t, OPEN, OPEN + 0.2) * 0.8,
        background: `linear-gradient(0deg, ${M}CC 0%, ${M}55 45%, transparent 100%)`, filter: 'blur(30px)', mixBlendMode: 'screen'}} />}
      {/* коробка: закрытая вздрагивает, на «в подарок» — раскрытая */}
      <div style={{transform: `translateX(${shake}px) rotate(${shake * 0.3}deg)`}}>
        {!opened
          ? <Object25D src="objects/gift-box.webp" x={BOX.x} y={BOX.y} size={BOX.size} t={t} at={-0.2} float={8} moon={0.5} />
          : <Object25D src="objects/gift-open.webp" x={BOX.x} y={BOX.y} size={BOX.size} t={t} at={-10} float={10} moon={0.5} scale={1 + 0.06 * Math.max(0, 1 - (t - OPEN) * 4)} />}
      </div>
      {/* передний план: кадры и конфетти перед коробкой и её крышкой */}
      {cards.filter((c) => c.depth >= 0).map((c) => <FrameCard key={c.i} {...c} />)}
      {pieces.filter((p) => p.z >= 0).map(pieceEl)}
      <AbsoluteFill style={{background: `radial-gradient(900px 800px at ${BOX.x}px ${BOX.y - 150}px, ${M}BB, transparent 70%)`, opacity: flash, mixBlendMode: 'screen'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 230, display: 'flex', justifyContent: 'center', transform: `scale(${spr(t, 0.3)})`, opacity: 1 - iv(t, 1.95, 2.15)}}>
        <Chip tone="orange" size={84}>в подарок</Chip>
      </div>
      <div style={{position: 'absolute', left: 70, top: 220, opacity: iv(t, 2.1, 2.4)}}>
        <Headline text="система монтажа этого ролика" at={2.1} size={92} width={1300} />
      </div>
    </AbsoluteFill>
  );
};
