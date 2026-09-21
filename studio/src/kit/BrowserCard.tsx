import {interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Img} from 'remotion';
import {Video} from '@remotion/media';
import {elevation} from '../ds';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Окно браузера на холсте с настоящей записью экрана. Камера внутри окна мягко подводится к нужной области
// (как в Screen Studio): crops — ключевые кадры по времени записи, область в пикселях исходника.
// Приватное (ключ, почта) закрывается плашкой того же цвета, что фон под ней, — без размытия, чтобы не ломать стекло.
export type Crop = {at: number; x: number; y: number; w: number};
export type Mask = {x: number; y: number; w: number; h: number; fill: string; label?: string; from?: number};
// src — видео (.mp4) или снимок страницы (.png/.jpg): у снимка «время записи» идёт от начала сцены, trim и rate сдвигают камеру.
export const BrowserCard: React.FC<{w: number; h: number; url: string; src: string; srcW: number; srcH: number;
  trim: number; rate: number; crops: Crop[]; masks?: Mask[]}> = ({w, h, url, src, srcW, srcH, trim, rate, crops, masks = []}) => {
  const still = /\.(png|jpe?g|webp)$/i.test(src);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const clip = trim + (frame / fps) * rate;
  const bar = 66, bodyH = h - bar;
  const ats = crops.map((c) => c.at);
  const cx = crops.length > 1 ? interpolate(clip, ats, crops.map((c) => c.x), clamp) : crops[0].x;
  const cy = crops.length > 1 ? interpolate(clip, ats, crops.map((c) => c.y), clamp) : crops[0].y;
  const cw = crops.length > 1 ? interpolate(clip, ats, crops.map((c) => c.w), clamp) : crops[0].w;
  const s = w / cw;
  return (
    <div style={{position: 'relative', width: w, height: h, borderRadius: 40, overflow: 'hidden', background: '#FFFFFF', boxShadow: elevation[3]}}>
      <div style={{position: 'relative', height: bar, display: 'flex', alignItems: 'center', gap: 14, padding: '0 26px',
        background: 'linear-gradient(180deg, #2E3237 0%, #212428 100%)', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.35)'}}>
        {['#FF6159', '#FFBD2E', '#28C941'].map((c) => <span key={c} style={{width: 20, height: 20, borderRadius: '50%', background: c, flex: 'none'}} />)}
        <div style={{marginLeft: 20, flex: 1, height: 42, borderRadius: 21, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center',
          padding: '0 24px', fontFamily: 'Manrope', fontWeight: 600, fontSize: 30, color: '#D9DCDF'}}>{url}</div>
      </div>
      <div style={{position: 'relative', width: w, height: bodyH, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: -cx * s, top: -cy * s, width: srcW * s, height: srcH * s}}>
          {still ? <Img src={staticFile(src)} style={{width: '100%', height: '100%'}} />
            : <Video src={staticFile(src)} trimBefore={Math.round(trim * fps)} playbackRate={rate} muted style={{width: '100%', height: '100%'}} />}
          {masks.filter((m) => clip >= (m.from ?? 0)).map((m, i) => (
            <div key={i} style={{position: 'absolute', left: m.x * s, top: m.y * s, width: m.w * s, height: m.h * s, borderRadius: 10 * s,
              background: m.fill, display: 'flex', alignItems: 'center', paddingLeft: 12 * s, fontFamily: 'JBM', fontSize: 15 * s, color: '#1C7A53'}}>{m.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

