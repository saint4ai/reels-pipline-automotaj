import {AbsoluteFill} from 'remotion';
import {whip} from '../kit/presentations';
import type {StyleDef} from './engine';
import {Draw, k} from './parts';
import {SkinScene, type Skin} from './skinned';

// TRACE — тетрадь и рисующаяся логика. Бумага в сетку с полем, оранжевая ручка дорисовывает подчёркивания, стрелки
// и галочки прямо на глазах; зачёркнутое исправляется в кадре; крупные числа считаются. Рукописная пометка — Caveat.
const INK = '#15181B', PEN = '#FF7A2F';
const skin: Skin = {
  ink: INK, sub: '#7A7F86', accent: PEN, accent2: '#12A57F', pen: true, tile: '#FFFFFF',
  panel: (r) => ({borderRadius: r, background: '#FFFFFF', boxShadow: '0 1px 0 rgba(20,24,28,.06), 0 16px 34px rgba(20,24,28,.08), inset 0 0 0 1.5px rgba(20,24,28,.07)'}),
  row: (on) => ({background: on > 0 ? 'rgba(255,122,47,.07)' : 'transparent'}),
};
const PAPERS = ['#FBF8F1', '#F8F6EF', '#FAFAF6', '#FBF5EC'];
const Background: StyleDef['Background'] = ({i, f}) => {
  const step = f.w > f.h ? 64 : 56, grid = i % 3;
  const lines = grid === 1 ? `linear-gradient(rgba(20,24,28,.07) 2px, transparent 2px)` :
    grid === 2 ? `radial-gradient(circle, rgba(20,24,28,.16) 2.4px, transparent 3px)` :
    `linear-gradient(rgba(20,24,28,.06) 2px, transparent 2px), linear-gradient(90deg, rgba(20,24,28,.06) 2px, transparent 2px)`;
  return (
    <AbsoluteFill style={{background: PAPERS[i % PAPERS.length]}}>
      <AbsoluteFill style={{backgroundImage: lines, backgroundSize: grid === 1 ? `100% ${step * 1.5}px` : `${step}px ${step}px`}} />
      {/* поле тетради */}
      <div style={{position: 'absolute', left: f.w > f.h ? 90 : 56, top: 0, bottom: 0, width: 3, background: 'rgba(255,122,47,.45)'}} />
    </AbsoluteFill>
  );
};
const Scene: StyleDef['Scene'] = (p) => {
  const {t, b, zone: z} = p;
  const note = ({stat: 'проверено', list: 'по шагам', flow: 'по порядку'} as Record<string, string>)[b.kind];
  return (
    <>
      <SkinScene {...p} skin={skin} />
      {note ? (
        <>
          <div style={{position: 'absolute', right: p.f.w - z.x - z.w + 10, top: z.y - 70, fontFamily: 'Caveat', fontWeight: 700, fontSize: 64, color: PEN,
            transform: 'rotate(-4deg)', opacity: k(t, b.at + 0.9, b.at + 1.2)}}>{note}</div>
          <Draw t={t} a={b.at + 1.1} b={b.at + 1.5} w={p.f.w} h={p.f.h} color={PEN} width={5}
            d={`M${z.x + z.w - 60},${z.y - 10} C${z.x + z.w - 80},${z.y + 30} ${z.x + z.w - 120},${z.y + 40} ${z.x + z.w - 160},${z.y + 50}`} />
        </>
      ) : null}
    </>
  );
};
export const TRACE: StyleDef = {
  id: 'trace', speaker: 'card', Background, Scene,
  zone: (f) => f.card,
  captions: (f) => ({...f.captions, light: true}),
  transition: (i) => whip({dir: i % 2 ? 'left' : 'right'}) as never,
  sfx: {move: 'ui-slide', pop: 'ui-tap', tick: 'tick-soft', count: 'counter'},
};
