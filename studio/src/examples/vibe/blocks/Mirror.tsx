import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {elevation} from '../../../ds';
import {Chip, clamp, Glass, iv, Label, M, MI, O, out, spr, TXT, Zone} from './common';
import {interpolate} from 'remotion';

// Паттерн «Непослушное отражение» + «Стоп-кадр с облётом» (ролик 22):
// «Тебя может заменить коллега с опытом поменьше, который делегирует ИИ-агенту то, что ты до сих пор делаешь руками,
// и он всё равно будет эффективнее и быстрее».
// Сверху «ты»: задачи-плитки берутся по одной и делаются руками — медленно. Снизу, в жидком зеркале, «коллега»:
// те же плитки улетают к агенту и закрываются сразу. На «заменить» всё застывает, камера обходит застывший момент по дуге.
export const MIRROR_DUR = 10.6;
const FREEZE = {from: 0.6, to: 1.9};
// Время сцены с паузой: во время стоп-кадра предметы стоят, камера движется.
const sceneT = (t: number) => (t < FREEZE.from ? t : t < FREEZE.to ? FREEZE.from : t - (FREEZE.to - FREEZE.from));

const TASKS = ['table', 'doc', 'mail', 'chart'] as const;
const TaskIcon: React.FC<{k: (typeof TASKS)[number]; s: number}> = ({k, s}) => (
  <svg width={s} height={s} viewBox="0 0 40 40" fill="none" stroke="#F2F3F5" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
    {k === 'table' && <><rect x={6} y={8} width={28} height={24} rx={3} /><path d="M6 16 H34 M6 24 H34 M16 8 V32 M25 8 V32" /></>}
    {k === 'doc' && <><path d="M11 5 H24 L31 12 V35 H11 Z" /><path d="M24 5 V12 H31 M16 19 H26 M16 25 H26" /></>}
    {k === 'mail' && <><rect x={5} y={10} width={30} height={21} rx={3} /><path d="M6 12 L20 22 L34 12" /></>}
    {k === 'chart' && <><path d="M7 33 H34" /><rect x={10} y={20} width={5} height={12} /><rect x={18} y={13} width={5} height={19} /><rect x={26} y={17} width={5} height={15} /></>}
  </svg>
);
const Tile: React.FC<{k: (typeof TASKS)[number]; done?: boolean; progress?: number; glow?: string}> = ({k, done = false, progress, glow}) => (
  <div style={{position: 'relative', width: 190, height: 190, borderRadius: 40, background: 'linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.04)), rgba(24,27,34,.72)',
    boxShadow: `inset 0 2px 0 rgba(255,255,255,.25), inset 0 -3px 0 rgba(0,0,0,.35), ${elevation[2]}${glow ? `, 0 0 40px ${glow}` : ''}`, display: 'grid', placeItems: 'center'}}>
    <TaskIcon k={k} s={96} />
    {progress !== undefined && !done && (
      <div style={{position: 'absolute', left: 22, right: 22, bottom: 18, height: 12, borderRadius: 6, background: 'rgba(255,255,255,.15)'}}>
        <div style={{width: `${progress * 100}%`, height: '100%', borderRadius: 6, background: O}} />
      </div>
    )}
    {done && <span style={{position: 'absolute', right: -14, top: -14, width: 64, height: 64, borderRadius: '50%', background: M, display: 'grid', placeItems: 'center', boxShadow: `0 0 30px ${M}`}}>
      <svg width={34} height={34} viewBox="0 0 24 24"><path d="M5 12.5 L10 17 L19 7" fill="none" stroke={MI} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" /></svg></span>}
  </div>
);
// Полоса «опыт»: у «тебя» длинная, у «коллеги» короче — «с опытом поменьше».
const Exp: React.FC<{k: number; color: string}> = ({k, color}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
    <Label size={48} weight={700} color="#C9CED4">опыт</Label>
    <div style={{width: 360, height: 18, borderRadius: 9, background: 'rgba(255,255,255,.12)'}}><div style={{width: `${k * 100}%`, height: '100%', borderRadius: 9, background: color}} /></div>
  </div>
);

const MIRROR_Y = 830;
export const MirrorScene: React.FC<{t: number}> = ({t}) => {
  const s = sceneT(t);
  const frozen = t >= FREEZE.from && t < FREEZE.to;
  // облёт: камера обходит застывший момент по дуге и возвращается
  const orbit = frozen ? Math.sin(((t - FREEZE.from) / (FREEZE.to - FREEZE.from)) * Math.PI) : 0;
  const colleague = spr(t, 1.95);
  // верх: руками — первая плитка делается медленно весь блок
  const handProgress = interpolate(s, [0.2, 9], [0, 0.45], clamp);
  // низ: делегирует — плитки улетают к агенту по одной с 3,1 с
  const ORB = {x: 1060, y: 1180};
  return (
    <Zone kind="black">
      <AbsoluteFill style={{perspective: 1800, perspectiveOrigin: '720px 830px'}}>
        <AbsoluteFill style={{transform: `rotateY(${orbit * 24}deg) rotateX(${orbit * -6}deg) scale(${1 - orbit * 0.06})`, transformStyle: 'preserve-3d'}}>
          {/* верх: ты, руками */}
          <div style={{position: 'absolute', left: 90, top: 250, display: 'flex', flexDirection: 'column', gap: 18}}>
            <Chip tone="white" size={60}>ты</Chip>
            <Exp k={0.9} color="#E4E7EA" />
          </div>
          <div style={{position: 'absolute', left: 90, top: 520, display: 'flex', gap: 34}}>
            <Tile k="table" progress={handProgress} glow={`${O}55`} />
            {TASKS.slice(1).map((k) => <div key={k} style={{opacity: 0.55}}><Tile k={k} /></div>)}
          </div>
          <div style={{position: 'absolute', left: 1080, top: 300}}>
            {/* рука, которая стучит по плитке */}
            <svg width={200} height={200} viewBox="0 0 40 40" style={{transform: `translateY(${Math.abs(Math.sin(s * 5)) * -12}px)`}}>
              <path d="M14 22 V10 a2.5 2.5 0 0 1 5 0 V20 M19 19 V8 a2.5 2.5 0 0 1 5 0 V19 M24 19 V10 a2.5 2.5 0 0 1 5 0 V21 M29 21 V14 a2.5 2.5 0 0 1 5 0 V25 c0 7 -5 11 -11 11 c-5 0 -8 -3 -10 -7 l-4 -7 a2.5 2.5 0 0 1 4 -3 l3 3"
                fill="none" stroke="#F2F3F5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* линия зеркала */}
          <div style={{position: 'absolute', left: 0, right: 0, top: MIRROR_Y - 3, height: 6, background: `linear-gradient(90deg, transparent, ${M}, #FFFFFF, ${M}, transparent)`, boxShadow: `0 0 30px ${M}`}} />

          {/* низ: отражение — коллега делегирует агенту; вода: мятный тон и рябь */}
          <div style={{position: 'absolute', left: 0, right: 0, top: MIRROR_Y, height: 700, overflow: 'hidden',
            background: 'linear-gradient(180deg, rgba(61,237,195,.14), rgba(61,237,195,.04) 60%, transparent)'}}>
            <div style={{position: 'absolute', left: 90, top: 40, display: 'flex', flexDirection: 'column', gap: 18, transform: `scale(${colleague})`, transformOrigin: '0 0'}}>
              <Chip tone="mint" size={60}>коллега</Chip>
              <Exp k={0.45} color={M} />
            </div>
            {/* агент: мятное ядро с кольцами */}
            <div style={{position: 'absolute', left: ORB.x - 110, top: ORB.y - MIRROR_Y - 110, width: 220, height: 220, borderRadius: '50%',
              background: `radial-gradient(circle at 34% 30%, #E6FFF8 0%, ${M} 38%, #0F6E5A 80%, #05231D 100%)`, boxShadow: `0 0 ${80 + Math.sin(s * 4) * 20}px ${M}`}} />
            {[1.35, 1.8].map((k, i) => <div key={i} style={{position: 'absolute', left: ORB.x - 110 * k, top: ORB.y - MIRROR_Y - 110 * k, width: 220 * k, height: 220 * k, borderRadius: '50%',
              border: `3px solid ${M}`, opacity: 0.35 - i * 0.12, transform: `rotate(${s * 40 * (i ? -1 : 1)}deg)`, borderStyle: 'dashed'}} />)}
            <div style={{position: 'absolute', left: ORB.x - 70, top: ORB.y - MIRROR_Y + 130}}><Label size={50} weight={700} color={M}>ИИ-агент</Label></div>
            {TASKS.map((k, i) => {
              const go = 3.1 + i * 0.45;
              const f = iv(s, go, go + 0.4, 0, 1, out); // полёт к агенту
              const back = iv(s, go + 0.55, go + 0.85, 0, 1, out); // возврат готовой плиткой в стопку
              const sx = 90 + i * 224, sy = 330;
              const tx = ORB.x - 95, ty = ORB.y - MIRROR_Y - 95;
              const ex = 90 + i * 150, ey = 330;
              const x = back > 0 ? tx + (ex - tx) * back : sx + (tx - sx) * f;
              const y = back > 0 ? ty + (ey - ty) * back : sy + (ty - sy) * f - Math.sin(f * Math.PI) * 160;
              const sc = back > 0 ? 0.6 + 0.4 * back : 1 - f * 0.4;
              return <div key={k} style={{position: 'absolute', left: x, top: y, transform: `scale(${sc})`}}><Tile k={k} done={back > 0.5} /></div>;
            })}
            {/* скорость на «эффективнее и быстрее»: полосы движения */}
            {Array.from({length: 14}, (_, i) => {
              const on = iv(s, 7.2, 7.6) * (1 - iv(s, 9.8, 10.2));
              const y = 60 + random(`sl${i}`) * 560, len = 200 + random(`sll${i}`) * 400;
              const x = ((s * 2600 + random(`slx${i}`) * 1440) % 2000) - 400;
              return <div key={i} style={{position: 'absolute', left: x, top: y, width: len, height: 5, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${M})`, opacity: on * 0.8}} />;
            })}
            {/* рябь по воде: светлые эллипсы расходятся от точки касания; во время стоп-кадра стоят */}
            {[0, 1, 2].map((i) => {
              const r = ((s * 0.8 + i / 3) % 1);
              return <div key={i} style={{position: 'absolute', left: 720 - 700 * r, top: 10 - 40 * r, width: 1400 * r, height: 80 * r, borderRadius: '50%',
                border: '3px solid rgba(255,255,255,.35)', opacity: 1 - r}} />;
            })}
          </div>
          {/* застывшие капли над зеркалом во время стоп-кадра */}
          {Array.from({length: 18}, (_, i) => {
            const on = iv(t, 0.45, 0.6) * (1 - iv(t, 1.9, 2.1));
            const x = 200 + random(`d${i}`) * 1040, y = MIRROR_Y - 40 - random(`dy${i}`) * 260, r = 6 + random(`dr${i}`) * 12;
            return <div key={i} style={{position: 'absolute', left: x, top: y, width: r, height: r * 1.3, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #FFFFFF, #3DEDC3 70%)', opacity: on * 0.9, boxShadow: `0 0 12px ${M}`}} />;
          })}
        </AbsoluteFill>
      </AbsoluteFill>
      {/* метка стоп-кадра — как пауза на видео */}
      <div style={{position: 'absolute', right: 90, top: 580, opacity: frozen ? 1 : 0}}><Chip tone="orange" size={56}>❚❚ стоп</Chip></div>
      <div style={{position: 'absolute', left: 90, top: 1370, opacity: iv(s, 7.2, 7.5)}}><Chip tone="mint" size={56}>готово · коллега</Chip></div>
      <div style={{position: 'absolute', left: 90, top: 780 - 80, opacity: iv(s, 7.2, 7.5)}}><Label size={50} weight={700} color="#C9CED4">ещё в работе…</Label></div>
    </Zone>
  );
};
