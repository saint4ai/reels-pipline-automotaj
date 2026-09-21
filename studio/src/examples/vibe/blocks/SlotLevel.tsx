import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile} from 'remotion';
import {elevation} from '../../../ds';
import {LiquidCapsule} from '../../../kit/LiquidCapsule';
import {Chip, clamp, Glass, iv, Label, M, O, out, spr, TXT, Zone} from './common';

// Паттерн «Слот-машина профессий» + «Прокачка» (ролик 22):
// «Это для тех, кто уже силён в своём деле и хочет вырасти из рядового пользователя ChatGPT в эксперта, который в 10 раз эффективнее
// при помощи ИИ-агентов». Барабаны крутят профессии и встают тремя «эксперт» подряд — джекпот опыта. Потом полоса уровня
// «пользователь ChatGPT» наливается водой и взрывается вспышкой «эксперт с ИИ-агентами». Цифра «10» в кадр не выводится.
export const SLOT_DUR = 10.7;
const JOBS = ['маркетолог', 'бухгалтер', 'логист', 'тренер', 'юрист', 'консультант', 'дизайнер', 'предприниматель'];
const ROW = 150;

// Барабан: лента профессий крутится с замедлением и встаёт на «эксперт».
const Reel: React.FC<{t: number; stop: number; seed: number}> = ({t, stop, seed}) => {
  const total = 14 + seed * 3; // сколько строк пролетит до остановки
  const k = iv(t, 0.2, stop, 0, 1, (x) => 1 - Math.pow(1 - x, 3));
  const pos = k * total; // строк прокручено
  const settle = t > stop ? Math.sin((t - stop) * 18) * 14 * Math.max(0, 1 - (t - stop) * 4) : 0;
  const speed = t < stop ? (1 - k) : 0;
  const words = Array.from({length: total + 2}, (_, i) => (i === total ? 'эксперт' : JOBS[(i + seed * 3) % JOBS.length]));
  return (
    <div style={{position: 'relative', width: 400, height: ROW, overflow: 'hidden', borderRadius: 28, background: 'linear-gradient(180deg,#0B0C0E,#1C1F23 50%,#0B0C0E)',
      boxShadow: 'inset 0 10px 20px rgba(0,0,0,.6), inset 0 -10px 20px rgba(0,0,0,.6)'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: -(pos * ROW) + settle, filter: speed > 0.05 ? `blur(${speed * 6}px)` : undefined}}>
        {words.map((w, i) => (
          <div key={i} style={{height: ROW, display: 'grid', placeItems: 'center'}}>
            <Label size={w === 'эксперт' ? 62 : 50} weight={800} color={w === 'эксперт' && t > stop ? '#9FFFE6' : TXT}>{w}</Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SlotScene: React.FC<{t: number}> = ({t}) => {
  const stops = [1.8, 2.3, 2.85];
  const jackpot = t > 2.9;
  const flash = interpolate(t, [2.9, 3.0, 3.4], [0, 1, 0], clamp);
  const slide = iv(t, 3.6, 4.1, 0, 1, out); // автомат уезжает вверх, выходит полоса уровня
  const fill = interpolate(t, [4.2, 6.6, 6.9], [0.12, 0.55, 1], clamp);
  const burst = spr(t, 6.9, {damping: 10, stiffness: 160});
  const lvl = t > 6.9;
  return (
    <Zone kind="ember">
      {/* автомат: стеклянная рама, три барабана, линия выигрыша */}
      <div style={{position: 'absolute', left: 720 - 690, top: 330 - slide * 220, transform: `scale(${1 - slide * 0.35})`, transformOrigin: '50% 0%'}}>
        <Glass w={1380} h={330} r={60} style={{boxShadow: `${elevation[3]}${jackpot ? `, 0 0 ${80 * (1 - slide)}px ${M}` : ''}`}}>
          <div style={{position: 'absolute', left: 45, top: 90, display: 'flex', gap: 45}}>
            {stops.map((s, i) => <Reel key={i} t={t} stop={s} seed={i} />)}
          </div>
          <div style={{position: 'absolute', left: 30, right: 30, top: 162, height: 6, borderRadius: 3, background: jackpot ? M : 'rgba(255,255,255,.25)', boxShadow: jackpot ? `0 0 24px ${M}` : 'none'}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 18, display: 'flex', justifyContent: 'center'}}>
            <Label size={52} weight={700} color="#F2F3F5">{jackpot ? 'силён в своём деле' : 'кто ты?'}</Label>
          </div>
        </Glass>
      </div>
      {/* вспышка джекпота */}
      <AbsoluteFill style={{background: `radial-gradient(900px 600px at 720px 500px, ${M}AA, transparent 70%)`, opacity: flash, mixBlendMode: 'screen'}} />
      {Array.from({length: 26}, (_, i) => {
        const k = iv(t, 2.9, 3.8, 0, 1, out);
        const a = random(`cf${i}`) * Math.PI * 2, d = 200 + random(`cd${i}`) * 700;
        return <div key={i} style={{position: 'absolute', left: 720 + Math.cos(a) * d * k, top: 500 + Math.sin(a) * d * k + k * k * 300, width: 18, height: 30, borderRadius: 6,
          background: i % 2 ? M : '#F2F3F5', transform: `rotate(${a * 180 + t * 400}deg)`, opacity: t > 2.9 && t < 3.9 ? 1 - k : 0}} />;
      })}

      {/* уровень: «пользователь ChatGPT» → вода наливается → вспышка «эксперт с ИИ-агентами» */}
      <div style={{position: 'absolute', left: 90, top: 700, width: 1260, opacity: slide, transform: `translateY(${(1 - slide) * 80}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 26, marginBottom: 34}}>
          <span style={{width: 120, height: 120, borderRadius: 32, background: lvl ? M : '#F2F3F5', display: 'grid', placeItems: 'center', boxShadow: elevation[2], flex: 'none'}}>
            {lvl ? <svg width={70} height={70} viewBox="0 0 24 24"><path d="M12 3 L14.6 9 L21 9.4 L16 13.5 L17.7 20 L12 16.4 L6.3 20 L8 13.5 L3 9.4 L9.4 9 Z" fill="#05231D" /></svg>
              : <Img src={staticFile('brand/openai.svg')} style={{width: 72, height: 72}} />}
          </span>
          <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
            <Label size={48} weight={600} color="#FFE1CC">{lvl ? 'новый уровень' : 'сейчас'}</Label>
            <Label size={lvl ? 72 : 64} weight={800}>{lvl ? 'эксперт с ИИ-агентами' : 'пользователь ChatGPT'}</Label>
          </div>
        </div>
        <div style={{transform: `scale(${1 + (lvl ? 0.04 * Math.max(0, 1 - (t - 6.9) * 2) : 0)})`}}>
          <LiquidCapsule w={1260} h={150} level={fill} t={t} slosh={interpolate(t, [4.2, 6.9, 7.6], [0.6, 1, 0.3], clamp)} tone={lvl ? 'mint' : 'white'} />
        </div>
      </div>
      {/* вспышка уровня: лучи из центра полосы */}
      {lvl && (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          <svg width={1440} height={2560} style={{position: 'absolute', inset: 0, opacity: Math.max(0, 1 - (t - 6.9) * 0.9)}}>
            {Array.from({length: 18}, (_, i) => {
              const a = (i / 18) * Math.PI * 2, r0 = 120 * burst, r1 = 900 * burst;
              return <line key={i} x1={720 + Math.cos(a) * r0} y1={1100 + Math.sin(a) * r0} x2={720 + Math.cos(a) * r1} y2={1100 + Math.sin(a) * r1} stroke={i % 2 ? M : '#FFFFFF'} strokeWidth={10} strokeLinecap="round" opacity={0.7} />;
            })}
          </svg>
        </AbsoluteFill>
      )}
      {/* скорость: на «эффективнее» полосы движения вдоль уровня */}
      {Array.from({length: 12}, (_, i) => {
        const on = iv(t, 8.2, 8.5) * (1 - iv(t, 10.2, 10.6));
        const y = 1180 + random(`sp${i}`) * 220, len = 240 + random(`spl${i}`) * 380;
        const x = ((t * 2400 + random(`spx${i}`) * 1600) % 2100) - 500;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: len, height: 6, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${M})`, opacity: on * 0.8}} />;
      })}
      <div style={{position: 'absolute', left: 90, top: 1250, opacity: iv(t, 8.3, 8.6)}}><Chip tone="white" size={56}>быстрее · эффективнее</Chip></div>
      <div style={{position: 'absolute', right: 90, top: 1250, opacity: iv(t, 8.5, 8.8)}}><Chip tone="orange" size={56}>ИИ-агенты</Chip></div>
    </Zone>
  );
};
