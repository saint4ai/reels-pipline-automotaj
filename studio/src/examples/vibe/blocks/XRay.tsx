import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {elevation} from '../../../ds';
import {Headline} from '../Headline';
import {Chip, clamp, easeIn, iv, Label, M, MI, O, out, spr, TXT, Zone} from './common';

// Паттерн «Рентген» + дорожка модулей (ролик 22): «Без опыта в программировании, только их личный опыт. Первые решения они собирают
// в первом же модуле». Линия сканера проходит по продукту ученика: выше линии — обычный интерфейс, ниже — рентген: слоя «код руками»
// внутри нет (перечёркнут), в центре светится ядро «личный опыт». Затем карточка сжимается в первый узел дорожки из 10 модулей курса
// (10 модулей — факт программы), и узел «Модуль 1» загорается «первое решение».
export const XRAY_DUR = 5.8;
const CARD = {x: 220, y: 470, w: 1000, h: 900};

const Dashboard: React.FC<{xray?: boolean}> = ({xray = false}) => {
  const st = xray ? {fill: 'none', stroke: M} : {fill: '#1B1E22', stroke: 'rgba(255,255,255,.12)'};
  return (
    <svg width={CARD.w} height={CARD.h} viewBox="0 0 100 90" style={{position: 'absolute', inset: 0}}>
      <rect x={0} y={0} width={100} height={90} rx={6} fill={xray ? '#03110E' : '#101214'} stroke={xray ? M : 'none'} strokeWidth={0.4} />
      {xray && Array.from({length: 20}, (_, i) => <path key={i} d={`M ${i * 5} 0 V 90 M 0 ${i * 5} H 100`} stroke={M} strokeWidth={0.08} opacity={0.35} />)}
      <rect x={5} y={5} width={90} height={9} rx={2} fill={st.fill} stroke={st.stroke} strokeWidth={0.4} />
      <path d="M 8 38 C 25 22, 38 46, 55 30 S 82 24, 92 36" fill="none" stroke={xray ? M : M} strokeWidth={1.4} strokeDasharray={xray ? '1.5 1.5' : undefined} />
      {[[8, 38], [55, 30], [92, 36]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2} fill={xray ? 'none' : i === 2 ? O : M} stroke={xray ? M : 'none'} strokeWidth={0.4} />)}
      {[0.45, 0.7, 0.55, 0.9, 0.65, 0.8].map((h, i) => <rect key={i} x={8 + i * 14.5} y={84 - h * 28} width={9} height={h * 28} rx={1.5} fill={xray ? 'none' : i === 3 ? O : M} stroke={xray ? M : 'none'} strokeWidth={0.4} opacity={xray ? 0.8 : 0.9} />)}
    </svg>
  );
};

// дорожка на всю ширину рабочей зоны: зигзаг от левого края к правому
const NODES = Array.from({length: 10}, (_, i) => ({n: i + 1, x: i % 2 ? 1150 : 240, y: 440 + i * 100}));

export const XRayScene: React.FC<{t: number}> = ({t}) => {
  const scan = iv(t, 0.15, 1.5, 0, 1, (x) => x); // положение линии сканера 0…1
  const scanY = CARD.h * scan;
  const code = iv(t, 0.75, 1.0), strike = iv(t, 1.1, 1.35);
  const core = spr(t, 1.6, {damping: 10, stiffness: 140});
  const shrink = iv(t, 3.0, 3.6, 0, 1, easeIn);
  const n1 = NODES[0];
  // карточка сжимается в узел «Модуль 1»
  const cx = CARD.x + CARD.w / 2 + (n1.x - (CARD.x + CARD.w / 2)) * shrink, cy = CARD.y + CARD.h / 2 + (n1.y - (CARD.y + CARD.h / 2)) * shrink;
  const cs = 1 - shrink * 0.9;
  const lit = spr(t, 4.6, {damping: 11, stiffness: 160});
  const path = iv(t, 3.4, 4.4, 0, 1, out);
  return (
    <Zone kind="black">
      <AbsoluteFill style={{background: `radial-gradient(900px 900px at 720px ${CARD.y + scanY}px, rgba(61,237,195,${0.18 * (1 - shrink)}), transparent 70%)`}} />
      {/* дорожка модулей: появляется, когда карточка уходит в первый узел */}
      <svg width={1440} height={2560} style={{position: 'absolute', inset: 0, opacity: iv(t, 3.2, 3.6)}}>
        <path d={NODES.map((n, i) => `${i ? 'L' : 'M'} ${n.x} ${n.y}`).join(' ')} fill="none" stroke="rgba(61,237,195,.45)" strokeWidth={8} strokeDasharray="18 14"
          pathLength={1} strokeDashoffset={0} style={{clipPath: `inset(0 0 ${(1 - path) * 100}% 0)`}} />
      </svg>
      {NODES.map((n, i) => {
        const on = i === 0 ? lit : 0;
        const vis = iv(t, 3.3 + i * 0.06, 3.6 + i * 0.06);
        return (
          <div key={n.n} style={{position: 'absolute', left: n.x - 72, top: n.y - 72, width: 144, height: 144, borderRadius: '50%', opacity: vis,
            background: on > 0.5 ? M : 'rgba(255,255,255,.1)', boxShadow: on > 0.5 ? `0 0 ${60 * on}px ${M}, ${elevation[2]}` : 'inset 0 2px 0 rgba(255,255,255,.2)',
            display: 'grid', placeItems: 'center', transform: `scale(${1 + 0.25 * on * Math.max(0, 1 - (t - 4.6) * 2)})`}}>
            <Label size={60} weight={800} color={on > 0.5 ? MI : '#C9CED4'} style={{textShadow: 'none'}}>{String(n.n).padStart(2, '0')}</Label>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 110, top: n1.y - 200, opacity: lit, transform: `translateX(${(1 - lit) * -30}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
          <Label size={88}>Модуль 1</Label>
          <Chip tone="mint" size={60}>✓ первое решение</Chip>
        </div>
      </div>
      {/* карточка продукта: обычный вид выше линии сканера, рентген ниже */}
      {shrink < 1 && (
        <div style={{position: 'absolute', left: cx - CARD.w / 2, top: cy - CARD.h / 2, width: CARD.w, height: CARD.h, transform: `scale(${cs})`, borderRadius: 60, overflow: 'hidden',
          boxShadow: `${elevation[3]}, 0 0 0 4px ${M}55`}}>
          <div style={{position: 'absolute', inset: 0, clipPath: `inset(${scanY}px 0 0 0)`}}><Dashboard /></div>
          <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 0 ${CARD.h - scanY}px 0)`}}>
            <Dashboard xray />
            {/* слой «код руками» — пустой, перечёркнут */}
            <div style={{position: 'absolute', left: 90, top: 470, opacity: code, display: 'flex', alignItems: 'center', gap: 20}}>
              <div style={{position: 'relative', padding: '14px 34px', borderRadius: 999, border: `4px dashed ${O}`, fontFamily: 'JBM', fontWeight: 700, fontSize: 58, color: O}}>
                {'</> код руками'}
                <span style={{position: 'absolute', left: 20, right: 20, top: '50%', height: 8, borderRadius: 4, background: O, transform: `scaleX(${strike})`, transformOrigin: 'left'}} />
              </div>
            </div>
            {/* ядро «личный опыт» */}
            <div style={{position: 'absolute', left: CARD.w / 2 - 150, top: 600, width: 300, height: 300, borderRadius: '50%', transform: `scale(${core})`,
              background: `radial-gradient(circle at 36% 32%, #FFE1CC 0%, ${O} 40%, #8A3510 90%)`, boxShadow: `0 0 ${80 + Math.sin(t * 6) * 30}px ${O}`}} />
          </div>
          {/* линия сканера */}
          {scan > 0 && scan < 1 && <div style={{position: 'absolute', left: 0, right: 0, top: scanY - 5, height: 10, background: `linear-gradient(90deg, transparent, ${M}, #FFFFFF, ${M}, transparent)`, boxShadow: `0 0 40px ${M}, 0 0 90px ${M}`}} />}
        </div>
      )}
      {shrink < 1 && <div style={{position: 'absolute', left: CARD.x + CARD.w / 2 + 170, top: CARD.y + 720, opacity: core * (1 - shrink), transform: `scale(${cs})`, transformOrigin: '-400px -250px'}}>
        <Chip tone="orange" size={64}>личный опыт</Chip>
      </div>}
      {/* заголовки блока: «без кода» → «только опыт» */}
      <div style={{position: 'absolute', left: 70, top: 240, opacity: 1 - iv(t, 1.5, 1.7)}}><Headline text="Без опыта в программировании" at={-0.3} size={96} width={1300} /></div>
      <div style={{position: 'absolute', left: 70, top: 240, opacity: iv(t, 1.6, 1.8) * (1 - iv(t, 2.9, 3.1))}}><Headline text="Только их личный опыт" at={1.6} size={104} width={1300} /></div>
      <div style={{position: 'absolute', left: 400, top: 1300, opacity: interpolate(t, [3.6, 3.9], [0, 1], clamp)}}>
        <Label size={60} weight={700} color={TXT}>10 модулей курса</Label>
      </div>
    </Zone>
  );
};
