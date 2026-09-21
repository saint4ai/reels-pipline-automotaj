import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {elevation} from '../../../ds';
import {Chip, Glass, iv, Label, M, O, out, spr, Zone} from './common';

// Паттерн «Разбор на детали» (ролик 22): «Внутри обучения мои шаблоны и инструменты за четыре года опыта».
// Обучение — стеклянный блок; на «внутри» он разлетается слоями, как взрыв-схема в промдизайне: шаблоны, инструменты
// (настоящие логотипы), «4 года практики». Камера чуть облетает схему.
export const EXPLODE_DUR = 4.1;
const LOGOS: [string, string][] = [['claude', '#D97757'], ['openai', '#FFFFFF'], ['cursor', '#FFFFFF'], ['github', '#FFFFFF'], ['supabase', '#3ECF8E'], ['vercel', '#FFFFFF']];
const Logo: React.FC<{name: string; color: string; s: number}> = ({name, color, s}) => (
  <span style={{display: 'inline-block', width: s, height: s, background: color, WebkitMask: `url(${staticFile(`brand/${name}.svg`)}) center / contain no-repeat`, mask: `url(${staticFile(`brand/${name}.svg`)}) center / contain no-repeat`}} />
);

const Layer: React.FC<{title: string; children: React.ReactNode; accent: string}> = ({title, children, accent}) => (
  <Glass w={1100} h={300} r={56} pad="34px 50px" style={{boxShadow: `${elevation[3]}, inset 0 -4px 0 ${accent}88`}}>
    <div style={{display: 'flex', flexDirection: 'column', gap: 24, height: '100%'}}>
      <Label size={60}>{title}</Label>
      <div style={{display: 'flex', gap: 26, alignItems: 'center'}}>{children}</div>
    </div>
  </Glass>
);

export const ExplodeScene: React.FC<{t: number}> = ({t}) => {
  const ex = spr(t, 0.35, {damping: 14, stiffness: 110, mass: 1});
  const orbit = Math.sin(t * 0.9) * 6;
  const gap = 300 * ex;
  const layers = [
    <Layer key="a" title="шаблоны" accent={M}>
      {Array.from({length: 5}, (_, i) => <div key={i} style={{width: 150, height: 110, borderRadius: 18, background: 'rgba(255,255,255,.1)', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.2)',
        padding: 16, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10}}>{[80, 60, 70].map((w, k) => <span key={k} style={{height: 12, width: `${w}%`, borderRadius: 6, background: k ? 'rgba(255,255,255,.5)' : M}} />)}</div>)}
    </Layer>,
    <Layer key="b" title="инструменты" accent={O}>
      {LOGOS.map(([n, c]) => <div key={n} style={{width: 120, height: 120, borderRadius: 30, background: 'rgba(10,11,13,.6)', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.2)'}}><Logo name={n} color={c} s={66} /></div>)}
    </Layer>,
    <Layer key="c" title="4 года практики" accent="#FFFFFF">
      <Chip tone="mint" size={52}>метод</Chip><Chip tone="white" size={52}>структуры работы с агентом</Chip>
    </Layer>,
  ];
  return (
    <Zone kind="graphite">
      <AbsoluteFill style={{perspective: 2200, perspectiveOrigin: '720px 300px'}}>
        <div style={{position: 'absolute', left: 170, top: 620, transformStyle: 'preserve-3d', transform: `rotateX(${34 - ex * 6}deg) rotateZ(${orbit * 0.3}deg) rotateY(${orbit}deg)`}}>
          {layers.map((l, i) => (
            <div key={i} style={{position: 'absolute', left: 0, top: 0, transform: `translateZ(${(1 - i) * gap}px) translateY(${(i - 1) * (30 + ex * 300)}px)`, opacity: i === 0 ? 1 : iv(ex, 0.25, 0.6)}}>{l}</div>
          ))}
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 230, display: 'flex', justifyContent: 'center', opacity: iv(t, 0.2, 0.5), transform: `translateY(${(1 - iv(t, 0.2, 0.5, 0, 1, out)) * 30}px)`}}>
        <Label size={84}>внутри обучения</Label>
      </div>
    </Zone>
  );
};
