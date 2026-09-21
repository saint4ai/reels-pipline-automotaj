import {AbsoluteFill} from 'remotion';
import {bloom} from '../kit/presentations';
import type {StyleDef} from './engine';
import {speech} from './speaker';
import {SkinScene, type Skin} from './skinned';

// PULSE — звук ведёт монтаж. Круг-рассказчик пульсирует в такт речи, на каждом смысловом блоке выпрыгивает крупный
// 3D-предмет, световые пятна фона дышат с голосом. Мало текста, крупные предметы, тёплый светлый фон.
const MINT_DARK = '#12A57F';
const Background: StyleDef['Background'] = ({t, i, f, project}) => {
  const e = speech(t, project) * 0.5;
  const tints = [['255,178,126', '61,237,195'], ['255,214,170', '255,122,47'], ['61,237,195', '255,200,160']][i % 3];
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #FBF6F0 0%, #F4EDE4 100%)'}}>
      <div style={{position: 'absolute', left: f.w * 0.35, top: f.h * 0.28, width: f.w * (0.7 + 0.08 * e), height: f.w * (0.7 + 0.08 * e), borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${tints[0]},.55), rgba(${tints[0]},0) 70%)`, filter: 'blur(30px)'}} />
      <div style={{position: 'absolute', left: -f.w * 0.2, top: f.h * 0.02, width: f.w * 0.6, height: f.w * 0.6, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${tints[1]},.35), rgba(${tints[1]},0) 70%)`, filter: 'blur(30px)'}} />
    </AbsoluteFill>
  );
};
export const PULSE: StyleDef = {
  id: 'pulse', speaker: 'circle', Background,
  Scene: (p) => {
    const skin: Skin = {
      ink: '#15181B', sub: '#7A7F86', accent: MINT_DARK, accent2: '#FF7A2F', objects: true, tile: '#FFFFFF',
      pulse: (t) => speech(t, p.project),
      panel: (r) => ({borderRadius: r, background: 'rgba(255,255,255,.78)', boxShadow: '0 18px 40px rgba(120,70,30,.12), inset 0 1.5px 0 #fff'}),
      row: (on) => ({background: on > 0 ? 'rgba(18,165,127,.08)' : 'transparent'}),
    };
    return <SkinScene {...p} skin={skin} />;
  },
  zone: (f) => f.card,
  captions: (f) => ({...f.captions, light: true, cx: f.id === 'reels' ? 640 : f.captions.cx}),
  transition: (_, f) => bloom({color: '#FFD2AE', x: f.w * 0.7, y: f.h * 0.72}) as never,
  sfx: {move: 'pop-warm', pop: 'pop-warm', tick: 'ui-pop', count: 'counter'},
};
