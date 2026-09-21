import {AbsoluteFill} from 'remotion';
import {stripCut, whip} from '../kit/presentations';
import type {StyleDef} from './engine';
import {SkinScene, type Skin} from './skinned';

// ПОДКАСТ — кадр подкаста снизу (в YouTube — слева), сверху доска: белый лист с тонкой рамкой, заголовок с маркером,
// термины отмечаются маркером-выделителем, числа оранжевые с рукописной пометкой; шов между доской и кадром — тонкая линия.
const skin: Skin = {
  ink: '#15181B', sub: '#6A7078', accent: '#FF7A2F', accent2: '#3DEDC3', marker: true, head: 92, tile: '#FFFFFF',
  panel: (r) => ({borderRadius: Math.min(r, 18), background: '#FFFFFF', boxShadow: 'inset 0 0 0 2px #15181B, 6px 6px 0 #15181B'}),
  row: (on) => ({background: on > 0 ? 'linear-gradient(90deg, rgba(61,237,195,.55), rgba(61,237,195,.2))' : 'transparent'}),
};
const Background: StyleDef['Background'] = ({i, f}) => {
  const board = f.h > f.w ? {x: 40, y: 110, w: f.w - 80, h: 1120} : {x: 1330, y: 70, w: 1190, h: 1300};
  const tint = ['#FFE4D2', '#E3F7F1', '#FFF1DE'][i % 3];
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${tint}, #F3EFEA)`}}>
      <div style={{position: 'absolute', left: board.x, top: board.y, width: board.w, height: board.h, borderRadius: 24, background: '#FFFFFF',
        boxShadow: 'inset 0 0 0 3px #15181B, 10px 10px 0 rgba(21,24,27,.9)'}} />
      <div style={{position: 'absolute', left: board.x + 36, top: board.y + 26, fontFamily: 'JBM', fontWeight: 700, fontSize: 28, color: '#8A8F95', letterSpacing: '.06em'}}>
        ● {String(i + 1).padStart(2, '0')} / ПОДКАСТ
      </div>
    </AbsoluteFill>
  );
};
export const PODCAST: StyleDef = {
  id: 'podcast', speaker: 'podcast', Background,
  Scene: (p) => <SkinScene {...p} skin={skin} />,
  zone: (f) => f.h > f.w ? {x: 90, y: 230, w: 1260, h: 960} : {x: 1390, y: 190, w: 1070, h: 1110},
  captions: (f) => f.h > f.w ? {cx: 720, cy: 1380, maxW: 1100, size: 53.3} : {cx: 650, cy: 1300, maxW: 1100, size: 54},
  transition: (i) => (i % 2 ? stripCut({strips: 6}) : whip({dir: 'up'})) as never,
  sfx: {move: 'ui-slide', pop: 'ui-pop', tick: 'ui-tap', count: 'counter'},
  Overlay: ({f}) => f.h > f.w
    ? <div style={{position: 'absolute', left: 0, top: f.h / 2 - 3, width: f.w, height: 6, background: '#15181B'}} />
    : <div style={{position: 'absolute', left: 1297, top: 0, width: 6, height: f.h, background: '#15181B'}} />,
};
