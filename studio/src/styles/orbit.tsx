import {AbsoluteFill, Img, random, staticFile} from 'remotion';
import {lift, whip} from '../kit/presentations';
import type {StyleDef} from './engine';
import {Logo} from '../montage/parts';
import {SkinScene, type Skin} from './skinned';

// ORBIT — глубина и объём. Тёмный космос (без синевы: графит, оранжевый край планеты, мятные туманности), предметы
// и настоящие логотипы висят на трёх слоях глубины и не перестают мягко плыть с разной скоростью — дальний медленнее,
// ближний быстрее; из них собирается структура блока. Контейнеры — тёмное стекло, подписи светлые.
const skin: Skin = {
  ink: '#F2F1EE', sub: '#9DA2A8', accent: '#3DEDC3', accent2: '#FF7A2F', tile: '#F4F5F2',
  panel: (r) => ({borderRadius: r, background: 'rgba(22,26,32,.58)', backdropFilter: 'blur(20px) saturate(1.3)', WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,.16), inset 0 0 0 1.5px rgba(255,255,255,.08), 0 30px 70px rgba(0,0,0,.55)'}),
  row: (on) => ({background: on > 0 ? 'rgba(61,237,195,.10)' : 'transparent'}),
};
const STARS = Array.from({length: 140}, (_, i) => ({x: random(`x${i}`), y: random(`y${i}`), r: 0.6 + random(`r${i}`) * 2.2, d: 0.2 + random(`d${i}`) * 0.8}));

const Background: StyleDef['Background'] = ({t, i, f}) => {
  const left = i % 2 === 0, neb = i % 3 === 1 ? '61,237,195' : '255,122,47';
  return (
    <AbsoluteFill style={{background: 'radial-gradient(120% 90% at 50% 20%, #151A21 0%, #0A0D12 55%, #040507 100%)'}}>
      {STARS.map((s, j) => <div key={j} style={{position: 'absolute', left: ((s.x * f.w - t * 12 * s.d) % f.w + f.w) % f.w, top: s.y * f.h, width: s.r, height: s.r, borderRadius: '50%',
        background: '#FFFFFF', opacity: 0.25 + 0.6 * s.d * (0.6 + 0.4 * Math.sin(t * 2 + j))}} />)}
      <div style={{position: 'absolute', left: left ? -f.w * 0.2 : f.w * 0.4, top: f.h * 0.1, width: f.w * 0.9, height: f.w * 0.9, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${neb},.20), rgba(${neb},0) 65%)`, filter: 'blur(40px)'}} />
      {/* край планеты: тёмный диск с оранжевым контровым светом */}
      <div style={{position: 'absolute', left: left ? -f.w * 0.55 : f.w * 0.25, top: f.h * (f.h > f.w ? 0.62 : 0.55), width: f.w * 1.3, height: f.w * 1.3, borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 30%, #1A1E25, #07090C 70%)', boxShadow: '0 -8px 60px rgba(255,122,47,.35), inset 0 18px 40px rgba(255,160,100,.18)',
        transform: `translateX(${Math.sin(t * 0.2) * 20}px)`}} />
    </AbsoluteFill>
  );
};

// Слои глубины: предметы и логотипы блока плывут на трёх плоскостях с разной скоростью и размытием
const Depth: React.FC<{t: number; items: {src?: string; logo?: string}[]; f: {w: number; h: number}}> = ({t, items, f}) => (
  <>
    {items.slice(0, 3).map((it, j) => {
      const plane = [{s: 0.55, blur: 5, o: 0.55, v: 0.5}, {s: 0.8, blur: 1.5, o: 0.8, v: 0.8}, {s: 1, blur: 0, o: 1, v: 1.2}][j];
      // в рилсе — по краям зоны, в YouTube — в свободном правом верху над карточкой спикера
      const base = (f.h > f.w ? [{x: 0.82, y: 0.14}, {x: 0.12, y: 0.52}, {x: 0.86, y: 0.5}] : [{x: 0.76, y: 0.14}, {x: 0.93, y: 0.24}, {x: 0.83, y: 0.33}])[j];
      const size = Math.min(f.w, f.h) * 0.2 * plane.s;
      const x = base.x * f.w + Math.sin(t * 0.5 * plane.v + j) * 24 * plane.v, y = base.y * f.h + Math.cos(t * 0.4 * plane.v + j * 2) * 18 * plane.v;
      return (
        <div key={j} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: plane.o, filter: plane.blur ? `blur(${plane.blur}px)` : undefined,
          transform: `rotate(${Math.sin(t * 0.3 + j) * 8}deg)`}}>
          {it.src ? <Img src={staticFile(`objects/${it.src}.webp`)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
            : <div style={{width: '100%', height: '100%', borderRadius: size * 0.26, background: 'rgba(244,245,242,.92)', display: 'grid', placeItems: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,.5)'}}><Logo name={it.logo!} size={size * 0.56} /></div>}
        </div>
      );
    })}
  </>
);

const Scene: StyleDef['Scene'] = (p) => {
  const b = p.b;
  const logos = b.kind === 'logos' ? b.logos : b.kind === 'flow' ? b.nodes.map((n) => n.logo).filter(Boolean) as string[] : [];
  const items = [{src: b.object ?? ['laptop', 'book', 'coins', 'comment'][p.i % 4]}, ...logos.map((l) => ({logo: l})), {src: ['heart', 'mic', 'gift-box'][p.i % 3]}];
  return (
    <>
      <Depth t={p.t} items={b.kind === 'logos' ? items.slice(0, 1).concat({src: 'coins'}) : items} f={p.f} />
      <SkinScene {...p} skin={skin} />
    </>
  );
};

export const ORBIT: StyleDef = {
  id: 'orbit', speaker: 'card', Background, Scene,
  zone: (f) => f.card,
  captions: (f) => f.captions,
  transition: (i) => (i % 2 ? whip({dir: i % 4 === 1 ? 'left' : 'up'}) : lift()) as never,
  sfx: {move: 'whoosh-long', pop: 'pop-warm', tick: 'tick-soft', count: 'counter'},
};
