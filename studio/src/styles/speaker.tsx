import {Easing, Img, interpolate, staticFile} from 'remotion';
import {Video} from '@remotion/media';
import type {Box, Format} from '../formats';
import type {BlockData} from '../template/blocks';
import type {ProjectData} from '../template/demo';
import {Speaker} from '../template/Speaker';

// Раскладки спикера для стилей. card — карточка Screen Studio по формату (три размера по плану); square — компактный
// квадрат; roam — квадрат переезжает по смене блока в свободный угол; circle — круг-рассказчик, пульсирует в такт речи;
// half — спикер на всю нижнюю половину рилса (в YouTube — правая половина); podcast — кадр подкаста снизу (в YouTube — слева).
export type SpeakerMode = 'card' | 'square' | 'roam' | 'circle' | 'half' | 'podcast';

const R = (x: number, y: number, w: number, h: number): Box => ({x, y, w, h});
const reels = (f: Format) => f.id === 'reels';
export const ROAM = {
  // квадрат ездит по нижнему коридору: центр → право → лево; графика над ним не перекрывается
  reels: [R(470, 1840, 500, 500), R(960, 1880, 420, 420), R(60, 1880, 420, 420)],
  youtube: [R(1880, 760, 560, 560), R(1880, 110, 560, 560), R(1960, 840, 480, 480)],
};
export const speakerBox = (mode: SpeakerMode, f: Format, i = 0): Box => {
  switch (mode) {
    case 'square': return reels(f) ? R(470, 1860, 500, 500) : R(1900, 780, 540, 540);
    case 'roam': { const list = reels(f) ? ROAM.reels : ROAM.youtube; return list[i % list.length]; }
    case 'circle': return reels(f) ? R(1010, 1690, 350, 350) : R(2050, 880, 380, 380);
    case 'half': return reels(f) ? R(0, 1280, 1440, 1280) : R(1280, 0, 1280, 1440);
    case 'podcast': return reels(f) ? R(0, 1280, 1440, 1280) : R(0, 0, 1300, 1440);
    default: return f.speaker.base;
  }
};

const ease = Easing.bezier(0.65, 0, 0.35, 1);
const mix = (a: Box, b: Box, p: number): Box => ({x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, w: a.w + (b.w - a.w) * p, h: a.h + (b.h - a.h) * p});

// Запись любой пропорции вписывается «по заполнению», центр головы — на 45% высоты окна; без записи — студийная заглушка.
export const VideoBox: React.FC<{box: Box; radius: number; project: ProjectData; shadow?: boolean; ring?: string}> = ({box, radius, project, shadow = true, ring}) => {
  const v = project.speaker;
  const shell: React.CSSProperties = {position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: radius, overflow: 'hidden',
    boxShadow: [ring ? `0 0 0 ${Math.max(6, box.w * 0.025)}px ${ring}` : '', shadow ? 'inset 0 0 0 2px rgba(255,255,255,.14), 0 32px 64px rgba(0,0,0,.5)' : ''].filter(Boolean).join(', ') || undefined};
  if (!v) {
    return (
      <div style={{...shell, background: 'radial-gradient(90% 70% at 50% 30%, #2A3036 0%, #14171A 70%)'}}>
        <Img src={staticFile('objects/mic.webp')} style={{position: 'absolute', left: box.w / 2 - Math.min(box.w, box.h) * 0.3, top: box.h / 2 - Math.min(box.w, box.h) * 0.34,
          width: Math.min(box.w, box.h) * 0.6, height: Math.min(box.w, box.h) * 0.6, objectFit: 'contain'}} />
      </div>
    );
  }
  const s = Math.max(box.w / v.w, box.h / v.h), vw = v.w * s, vh = v.h * s;
  const top = Math.min(0, Math.max(box.h - vh, box.h * 0.45 - (v.headY ?? v.h * 0.47) * s));
  return <div style={shell}><Video src={staticFile(v.src)} muted={v.muted} style={{position: 'absolute', left: (box.w - vw) / 2, top, width: vw, height: vh}} /></div>;
};

// Громкость речи по словам расшифровки: 1 — слово звучит, 0 — пауза; мягкие фронты 0,12 с.
export const speech = (t: number, project: ProjectData) => project.words.reduce((m, w) => {
  const d = t < w.start ? w.start - t : t > w.end ? t - w.end : 0;
  return Math.max(m, Math.max(0, 1 - d / 0.12));
}, 0);

export const SpeakerLayer: React.FC<{mode: SpeakerMode; t: number; f: Format; i: number; blocks: BlockData[]; project: ProjectData}> = ({mode, t, f, i, blocks, project}) => {
  if (mode === 'card') return <Speaker t={t} plan={project.plan} video={project.speaker} />;
  if (mode === 'roam') {
    const prev = speakerBox('roam', f, Math.max(0, i - 1)), now = speakerBox('roam', f, i);
    const p = interpolate(t, [blocks[i].at, blocks[i].at + 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
    return <VideoBox box={i === 0 ? now : mix(prev, now, p)} radius={48} project={project} />;
  }
  if (mode === 'circle') {
    const b = speakerBox('circle', f), e = speech(t, project) * (0.5 + 0.5 * Math.abs(Math.sin(t * 9)));
    const s = 1 + 0.05 * e, box = {x: b.x - (b.w * (s - 1)) / 2, y: b.y - (b.h * (s - 1)) / 2, w: b.w * s, h: b.h * s};
    return <VideoBox box={box} radius={box.w / 2} project={project} ring={`rgba(255,122,47,${0.75 + 0.25 * e})`} />;
  }
  if (mode === 'half' || mode === 'podcast') return <VideoBox box={speakerBox(mode, f)} radius={0} project={project} shadow={false} />;
  return <VideoBox box={speakerBox('square', f)} radius={56} project={project} />;
};
