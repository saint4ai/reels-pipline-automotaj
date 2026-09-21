import {AbsoluteFill} from 'remotion';
import {blurThrough} from '../kit/presentations';
import type {StyleDef} from './engine';
import {Draw, k} from './parts';
import {SkinScene, type Skin} from './skinned';

// ЭКСПЕРТНОЕ СТЕКЛО — платиновый Liquid Glass. Серебряный фон с мягкими отражениями, панели из матового стекла с кантом,
// компактный квадрат спикера, светлые субтитры с подчёркиванием каждого слова, рукописная пометка Caveat со стрелкой.
const skin: Skin = {
  ink: '#15181B', sub: '#6A7078', accent: '#FF7A2F', accent2: '#12A57F', pen: true, tile: '#FFFFFF',
  panel: (r) => ({borderRadius: r, background: 'linear-gradient(180deg, rgba(255,255,255,.62), rgba(255,255,255,.38))', backdropFilter: 'blur(28px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.5)', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.95), inset 0 -10px 24px rgba(20,24,28,.06), inset 0 0 0 1.5px rgba(255,255,255,.7), 0 24px 60px rgba(20,24,28,.14)'}),
  row: (on) => ({background: on > 0 ? 'rgba(255,255,255,.55)' : 'transparent'}),
};
const Background: StyleDef['Background'] = ({t, i, f}) => {
  const warm = i % 2 === 0;
  return (
    <AbsoluteFill style={{background: warm ? 'linear-gradient(160deg, #F1F1EF 0%, #DCDDDD 55%, #C9CBCD 100%)' : 'linear-gradient(160deg, #EEF1F3 0%, #D9DEE2 55%, #C4CAD0 100%)'}}>
      {[0, 1, 2].map((j) => <div key={j} style={{position: 'absolute', left: `${-30 + j * 40 + Math.sin(t * 0.25 + j) * 6}%`, top: '-20%', width: '26%', height: '140%',
        transform: 'rotate(18deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.55), rgba(255,255,255,0))', opacity: 0.6 - j * 0.15}} />)}
      <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 110%, rgba(20,24,28,.22), transparent 60%)'}} />
      <div style={{position: 'absolute', left: f.w * 0.1, top: f.h * 0.08, width: f.w * 0.5, height: f.w * 0.5, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${warm ? '255,178,126' : '61,237,195'},.28), transparent 70%)`, filter: 'blur(30px)'}} />
    </AbsoluteFill>
  );
};
const Scene: StyleDef['Scene'] = (p) => {
  const {t, b, zone: z} = p;
  const note = ({list: 'по шагам', stat: 'замер', flow: 'как связано', logos: 'стек', cta: 'пиши'} as Record<string, string>)[b.kind];
  const nx = z.x + z.w - 20, ny = z.y - 60;
  return (
    <>
      <SkinScene {...p} skin={skin} />
      {note ? (
        <>
          <div style={{position: 'absolute', right: p.f.w - nx, top: ny, fontFamily: 'Caveat', fontWeight: 700, fontSize: 66,
            color: '#FF7A2F', transform: 'rotate(-5deg)', opacity: k(t, b.at + 1.2, b.at + 1.5)}}>{note}</div>
          <Draw t={t} a={b.at + 1.4} b={b.at + 1.8} w={p.f.w} h={p.f.h} color="#FF7A2F" width={5}
            d={`M${nx - 40},${ny + 80} C${nx - 60},${ny + 120} ${nx - 110},${ny + 130} ${nx - 150},${ny + 128}`} />
        </>
      ) : null}
    </>
  );
};
export const GLASS: StyleDef = {
  id: 'glass', speaker: 'square', Background, Scene,
  zone: (f) => f.card,
  captions: (f) => ({...f.captions, light: true}),
  transition: () => blurThrough({color: '#E4E6E8'}) as never,
  sfx: {move: 'shimmer', pop: 'ui-glass', tick: 'ui-soft', count: 'counter'},
};
