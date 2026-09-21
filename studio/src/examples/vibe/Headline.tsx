import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

// Заголовок как в ролике 19 (копия для ролика 22): крупный Manrope 800, слова из размытия, буквы с выдавкой.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const TXT = '#F2F3F5';
const useT = () => { const f = useCurrentFrame(); const {fps} = useVideoConfig(); return f / fps; };
// Заголовок как в ролике 19: крупный Manrope 800, слова проявляются из размытия, буквы с выдавкой (глубина).
// Правка Александра 19.09.2026: «заголовки — как в ролике 19: крупнее, с глубиной, проявление из размытия».
export const Headline: React.FC<{text: string; at: number; size?: number; light?: boolean; color?: string; width?: number | 'auto'}> =
  ({text, at, size = 118, light = false, color, width = 1300}) => {
    // width 'auto' — по ширине текста в одну строку (строка с логотипом)
    const t = useT();
    const ink = color ?? (light ? '#101214' : TXT);
    const depth = Math.max(3, Math.round(size / 30));
    const extrude = light
      ? `0 2px 0 rgba(255,255,255,.9), 0 ${depth + 10}px 30px rgba(0,0,0,.14)`
      : `${Array.from({length: depth}, (_, i) => `0 ${i + 1}px 0 #33373D`).join(', ')}, 0 ${depth + 14}px 36px rgba(0,0,0,.55)`;
    return (
      <div style={{width, whiteSpace: width === 'auto' ? 'nowrap' : undefined, textAlign: 'center', fontFamily: 'Manrope', fontWeight: 800, fontSize: size, lineHeight: 1.06, letterSpacing: '-0.03em', color: ink, textShadow: extrude}}>
        {text.split(' ').map((w, i) => {
          const k = interpolate(t, [at + i * 0.07, at + i * 0.07 + 0.34], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) ** 3});
          return <span key={i} style={{display: 'inline-block', marginRight: '0.24em', opacity: k, filter: `blur(${(1 - k) * 16}px)`, transform: `translateY(${(1 - k) * 26}px)`}}>{w}</span>;
        })}
      </div>
    );
  };
