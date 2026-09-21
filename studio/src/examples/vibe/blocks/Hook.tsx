import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {elevation} from '../../../ds';
import {Chip, clamp, easeIn, Glass, iv, O, spr, TXT, Zone} from './common';

// Хук ролика 22: «Меня ИИ не заменит, у меня большой опыт». С кадра 0 — стеклянный пузырь-цитата с огромными оранжевыми
// кавычками (это мысль зрителя, не автора). На «большой опыт» справа растёт башня стеклянных пластин.
// Дверь в следующую сцену: в конце пузырь уменьшается и встаёт первым клипом на дорожку таймлайна (перемотка стройки).
export const HOOK_DUR = 3.3;
const WORDS = ['Меня', 'ИИ', 'не', 'заменит —', 'у меня', 'большой', 'опыт'];

export const HookScene: React.FC<{t: number}> = ({t}) => {
  const out = iv(t, 2.95, 3.3, 0, 1, easeIn);
  // уменьшение в место первого видеоклипа на таймлайне следующей сцены
  const tx = interpolate(out, [0, 1], [0, 386 + 150 - 720], clamp), ty = interpolate(out, [0, 1], [0, 720 + 34 + 64 - 640], clamp);
  return (
    <Zone kind="black">
      <AbsoluteFill style={{transformOrigin: '720px 640px', transform: `translate(${tx}px, ${ty}px) scale(${1 - out * 0.76})`}}>
        <div style={{position: 'absolute', left: 90, top: 330}}>
          <Glass w={1260} h={620} r={80} pad="110px 80px 70px 90px">
            <div style={{fontFamily: 'Manrope', fontWeight: 800, fontSize: 104, lineHeight: 1.12, color: TXT, letterSpacing: '-0.03em'}}>
              {WORDS.map((w, i) => {
                const k = iv(t, -0.35 + i * 0.06, -0.05 + i * 0.06);
                const hot = (w === 'большой' || w === 'опыт') && t > 2.05;
                return <span key={i} style={{display: 'inline-block', marginRight: '0.24em', opacity: k, filter: `blur(${(1 - k) * 14}px)`,
                  color: hot ? '#FFD2B0' : TXT, textShadow: '0 3px 0 rgba(0,0,0,.35), 0 14px 30px rgba(0,0,0,.5)'}}>{w}</span>;
              })}
            </div>
          </Glass>
          {/* кавычки: объёмные, оранжевые, наполовину вне пузыря */}
          <div style={{position: 'absolute', left: -20, top: -150, fontFamily: 'Georgia, serif', fontSize: 380, lineHeight: 1, color: O,
            textShadow: `0 6px 0 #A8431A, 0 12px 0 #7A2F0F, 0 30px 60px rgba(0,0,0,.5)`, transform: `rotate(${-6 + Math.sin(t * 2) * 2}deg)`}}>“</div>
          {/* хвост пузыря */}
          <div style={{position: 'absolute', left: 180, top: 600, width: 90, height: 90, transform: 'rotate(45deg)', background: 'rgba(16,18,20,.42)', backdropFilter: 'blur(22px)',
            borderRight: '2px solid rgba(255,255,255,.25)', borderBottom: '2px solid rgba(255,255,255,.25)'}} />
        </div>
        {/* башня опыта: пластины падают друг на друга на «большой опыт» */}
        <div style={{position: 'absolute', left: 840, top: 1000, width: 440, height: 440}}>
          {Array.from({length: 7}, (_, i) => {
            const k = spr(t, 2.1 + i * 0.09, {damping: 12, stiffness: 220, mass: 0.6});
            return <div key={i} style={{position: 'absolute', left: (i % 2 ? 14 : 0), bottom: i * 58, width: 420, height: 50, borderRadius: 16,
              background: 'linear-gradient(180deg, rgba(255,255,255,.3), rgba(255,255,255,.08)), rgba(24,27,34,.6)', boxShadow: `inset 0 2px 0 rgba(255,255,255,.4), inset 0 -3px 0 ${O}88, ${elevation[1]}`,
              transform: `translateY(${(1 - k) * -700}px)`, opacity: t < 2.1 + i * 0.09 - 0.02 ? 0 : 1}} />;
          })}
          <div style={{position: 'absolute', left: 90, bottom: 7 * 58 + 20, opacity: iv(t, 2.7, 2.9)}}><Chip tone="orange" size={60}>опыт</Chip></div>
        </div>
      </AbsoluteFill>
    </Zone>
  );
};
