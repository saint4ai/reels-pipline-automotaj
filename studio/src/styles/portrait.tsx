import {AbsoluteFill} from 'remotion';
import {whip} from '../kit/presentations';
import type {StyleDef} from './engine';
import {SkinScene, type Skin} from './skinned';

// ПОРТРЕТ-КВАДРАТ — квадрат спикера переезжает по нижнему коридору на каждой смене блока (центр → право → лево),
// графика над ним; сцены чередуются тёмное стекло / светлое стекло, схемы собираются в стеклянных карточках.
const DARK: Skin = {
  ink: '#F2F1EE', sub: '#9DA2A8', accent: '#3DEDC3', accent2: '#FF7A2F', tile: '#F4F5F2',
  panel: (r) => ({borderRadius: r, background: 'rgba(26,30,36,.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,.16), 0 26px 60px rgba(0,0,0,.5)'}),
  row: (on) => ({background: on > 0 ? 'rgba(61,237,195,.1)' : 'transparent'}),
};
const LIGHT: Skin = {
  ink: '#15181B', sub: '#6A7078', accent: '#FF7A2F', accent2: '#12A57F', tile: '#FFFFFF',
  panel: (r) => ({borderRadius: r, background: 'rgba(255,255,255,.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    boxShadow: 'inset 0 1.5px 0 #fff, 0 22px 50px rgba(20,24,28,.12)'}),
  row: (on) => ({background: on > 0 ? 'rgba(18,165,127,.08)' : 'transparent'}),
};
const Background: StyleDef['Background'] = ({i, f}) => i % 2
  ? <AbsoluteFill style={{background: 'linear-gradient(170deg, #F6F7F8, #E3E6EA)'}}>
      <div style={{position: 'absolute', right: -f.w * 0.2, top: f.h * 0.1, width: f.w * 0.7, height: f.w * 0.7, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,178,126,.35), transparent 70%)'}} />
    </AbsoluteFill>
  : <AbsoluteFill style={{background: 'radial-gradient(110% 80% at 30% 20%, #1E2329 0%, #0D0F12 70%)'}}>
      <div style={{position: 'absolute', left: -f.w * 0.2, top: f.h * 0.3, width: f.w * 0.8, height: f.w * 0.8, borderRadius: '50%', background: 'radial-gradient(circle, rgba(61,237,195,.16), transparent 70%)'}} />
    </AbsoluteFill>;
export const PORTRAIT: StyleDef = {
  id: 'portrait', speaker: 'roam', Background,
  Scene: (p) => <SkinScene {...p} skin={p.i % 2 ? LIGHT : DARK} />,
  zone: (f) => f.card,
  captions: (f) => f.captions,
  transition: (i) => whip({dir: i % 2 ? 'left' : 'right'}) as never,
  sfx: {move: 'whoosh-sharp', pop: 'ui-pop', tick: 'tick-soft', count: 'counter'},
};
