import {Easing, Img, interpolate, staticFile} from 'remotion';
import {Video} from '@remotion/media';
import type {Box, SpeakerState} from '../formats';
import {useFormat} from './canvas';

// Карточка спикера Screen Studio: скруглённая, с внутренним контуром и тенью третьего уровня.
// Размер меняется по плану (секунда → base / compact / wide), переход 0,6 с, масштаб равномерный — лицо не искажается.
// Запись любой пропорции (телефон 9:16 или камера 16:9) вписывается «по заполнению», центр головы — на 45% высоты карточки.
export type SpeakerPlan = {at: number; to: SpeakerState}[];
export type SpeakerSrc = {src: string; w: number; h: number; headY?: number; muted?: boolean};

const ease = Easing.bezier(0.65, 0, 0.35, 1);
const mix = (a: Box, b: Box, p: number): Box => ({x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, w: a.w + (b.w - a.w) * p, h: a.h + (b.h - a.h) * p});

export const Speaker: React.FC<{t: number; plan?: SpeakerPlan; start?: SpeakerState; video?: SpeakerSrc}> = ({t, plan = [], start = 'base', video}) => {
  const f = useFormat();
  let box = f.speaker[start];
  for (const step of plan) box = mix(box, f.speaker[step.to], interpolate(t, [step.at, step.at + 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease}));
  const shell: React.CSSProperties = {position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: f.speaker.radius, overflow: 'hidden',
    boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.14), 0 4px 8px rgba(0,0,0,.4), 0 32px 64px rgba(0,0,0,.52), 0 80px 150px rgba(0,0,0,.36)'};
  if (!video) {
    // Демо без записи: студийный фон и микрофон — место, куда встанет запись владельца.
    return (
      <div style={{...shell, background: 'radial-gradient(90% 70% at 50% 30%, #2A3036 0%, #14171A 70%)'}}>
        <Img src={staticFile('objects/mic.webp')} style={{position: 'absolute', left: box.w * 0.2, top: box.h * 0.12, width: box.w * 0.6, height: box.w * 0.6, objectFit: 'contain'}} />
      </div>
    );
  }
  const s = Math.max(box.w / video.w, box.h / video.h);
  const vw = video.w * s, vh = video.h * s;
  const head = (video.headY ?? video.h * 0.47) * s;
  const top = Math.min(0, Math.max(box.h - vh, box.h * 0.45 - head));
  return (
    <div style={shell}>
      <Video src={staticFile(video.src)} muted={video.muted} style={{position: 'absolute', left: (box.w - vw) / 2, top, width: vw, height: vh}} />
    </div>
  );
};
