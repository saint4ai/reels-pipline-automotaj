import {AbsoluteFill} from 'remotion';
import {blurThrough, lift} from '../kit/presentations';
import type {Box} from '../formats';
import type {StyleDef} from './engine';
import {SkinScene, type Skin} from './skinned';

// APPLE DEPTH — спикер на всю нижнюю половину рилса (в YouTube — правая половина), сверху тёмная сцена с прожектором:
// крупный белый заголовок по центру, стеклянные плитки с бликом, глубина за счёт света и тени; шов мягко растворён.
const skin: Skin = {
  ink: '#F5F5F7', sub: '#A1A1A6', accent: '#3DEDC3', accent2: '#FF7A2F', align: 'center', head: 104, tile: '#F5F5F7',
  font: 'Inter Tight',
  panel: (r) => ({borderRadius: r, background: 'linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.04))', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,.22), inset 0 0 0 1px rgba(255,255,255,.08), 0 30px 60px rgba(0,0,0,.6)'}),
  row: (on) => ({background: on > 0 ? 'rgba(61,237,195,.1)' : 'transparent'}),
};
const top = (f: {w: number; h: number}): Box => f.h > f.w ? {x: 0, y: 0, w: f.w, h: f.h / 2} : {x: 0, y: 0, w: f.w / 2, h: f.h};
const Background: StyleDef['Background'] = ({t, i, f}) => {
  const r = top(f), tint = ['255,255,255', '61,237,195', '255,178,126'][i % 3];
  return (
    <AbsoluteFill style={{background: '#08090B'}}>
      <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, overflow: 'hidden',
        background: 'linear-gradient(180deg, #16181C 0%, #0B0C0F 100%)'}}>
        <div style={{position: 'absolute', left: r.w * 0.5 - r.w * 0.6 + Math.sin(t * 0.3) * 30, top: -r.h * 0.4, width: r.w * 1.2, height: r.h * 1.2, borderRadius: '50%',
          background: `radial-gradient(closest-side, rgba(${tint},.16), transparent)`}} />
      </div>
    </AbsoluteFill>
  );
};
export const APPLE: StyleDef = {
  id: 'apple', speaker: 'half', Background,
  Scene: (p) => <SkinScene {...p} skin={skin} />,
  zone: (f) => f.h > f.w ? {x: 90, y: 230, w: 1260, h: 940} : {x: 110, y: 130, w: 1060, h: 1060},
  captions: (f) => f.h > f.w ? {cx: 720, cy: 1400, maxW: 1000, size: 53.3} : {cx: 640, cy: 1290, maxW: 1000, size: 54},
  transition: (i) => (i % 2 ? blurThrough({color: '#0B0C0F'}) : lift()) as never,
  sfx: {move: 'whoosh-big', pop: 'ui-glass', tick: 'ui-tap', count: 'counter'},
  // шов: верх записи растворяется в тёмной сцене
  Overlay: ({f}) => f.h > f.w
    ? <div style={{position: 'absolute', left: 0, top: f.h / 2, width: f.w, height: 220, background: 'linear-gradient(180deg, #0B0C0F, rgba(11,12,15,0))'}} />
    : <div style={{position: 'absolute', left: f.w / 2, top: 0, width: 260, height: f.h, background: 'linear-gradient(90deg, #0B0C0F, rgba(11,12,15,0))'}} />,
};
