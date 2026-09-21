import {useMemo} from 'react';
import {Easing, Img, interpolate, spring, staticFile} from 'remotion';
import {useFrame30} from './motion';
import {color, elevation, glassFill, GlassLayers, textDepth, useFit} from '../ds';
import {ObjectStage, ring, slab} from './three';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);

// Телефон — настоящий 3D-корпус (three.js): титановый ободок, глянцевое чёрное стекло по краю экрана, боковые кнопки.
// Экран — HTML под корпусом: чат, профиль и любые блоки ниже работают как обычный DOM. Плоская CSS-рамка отклонена
// вместе с иллюминатором 18.09.2026. float — покачивание корпуса от кадра в градусах, чтобы блики на ободке жили.
const Body: React.FC<{w: number; h: number; tiltX: number; tiltY: number}> = ({w, h, tiltX, tiltY}) => {
  // Ширина кольца должна быть больше двух фасок, иначе контур с отверстием выворачивается и закрывает экран.
  const r = w * 0.16, m = w * 0.022, b = w * 0.042;
  const band = useMemo(() => ring(w, h, r, w - m * 2, h - m * 2, r - m, 26, 6), [w, h, r, m]);
  const glassEdge = useMemo(() => ring(w - m * 2 + 6, h - m * 2 + 6, r - m + 3, w - b * 2, h - b * 2, r - b, 4, 2), [w, h, r, m, b]);
  const [act, vol, pwr] = useMemo(() => [slab(10, h * 0.035, 5, 12, 3), slab(10, h * 0.06, 5, 12, 3), slab(10, h * 0.1, 5, 12, 3)], [h]);
  const metal = <meshPhysicalMaterial color="#6A7078" metalness={0.9} roughness={0.26} clearcoat={0.3} />;
  return (
    <group rotation={[tiltX, tiltY, 0]}>
      <mesh geometry={band}>{metal}</mesh>
      <mesh geometry={glassEdge} position={[0, 0, 30]}>
        <meshPhysicalMaterial color="#050607" roughness={0.06} clearcoat={1} clearcoatRoughness={0.04} />
      </mesh>
      {/* Кнопки: слева действие и громкость, справа питание. Выступают за корпус на несколько пикселей. */}
      <mesh geometry={act} position={[-w / 2 - 1, h / 2 - h * 0.17, 8]}>{metal}</mesh>
      <mesh geometry={vol} position={[-w / 2 - 1, h / 2 - h * 0.24, 8]}>{metal}</mesh>
      <mesh geometry={vol} position={[-w / 2 - 1, h / 2 - h * 0.31, 8]}>{metal}</mesh>
      <mesh geometry={pwr} position={[w / 2 + 1, h / 2 - h * 0.27, 8]}>{metal}</mesh>
    </group>
  );
};

export const PhoneMock: React.FC<{w: number; h: number; children: React.ReactNode; screen?: string; float?: number}> =
  ({w, h, children, screen = '#0E0F11', float = 1.2}) => {
    const frame = useFrame30();
    const r = w * 0.16, b = w * 0.042, rad = Math.PI / 180;
    const tiltX = Math.sin(frame / 43) * float * rad, tiltY = Math.cos(frame / 51) * float * rad;
    return (
      <div style={{position: 'relative', width: w, height: h}}>
        <div style={{position: 'absolute', inset: 8, borderRadius: r, boxShadow: '0 30px 60px rgba(0,0,0,.45), 0 90px 160px rgba(0,0,0,.35)'}} />
        {/* Экран на 6 px шире отверстия: край прячется под стеклянной кромкой и при покачивании не даёт щели. */}
        <div style={{position: 'absolute', left: b - 6, top: b - 6, width: w - b * 2 + 12, height: h - b * 2 + 12, borderRadius: r - b + 6,
          overflow: 'hidden', background: screen}}>
          {children}
          <div style={{position: 'absolute', left: '50%', top: w * 0.036, width: w * 0.3, height: w * 0.085, marginLeft: -w * 0.15,
            borderRadius: 999, background: '#000', boxShadow: 'inset 0 1px 2px rgba(255,255,255,.12)'}} />
          <div style={{position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(125deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,.03) 30%, rgba(255,255,255,0) 45%)'}} />
        </div>
        <ObjectStage w={w} h={h} env={0.7}>
          <Body w={w} h={h} tiltX={tiltX} tiltY={tiltY} />
        </ObjectStage>
      </div>
    );
  };

// Шапка директа: аватар, имя, статус. Отступ сверху под островок.
export const DmHeader: React.FC<{name: string; status: string; avatar?: string; w: number}> = ({name, status, avatar, w}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: w * 0.03, padding: `${w * 0.15}px ${w * 0.05}px ${w * 0.035}px`,
    borderBottom: '2px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)'}}>
    <div style={{width: w * 0.11, height: w * 0.11, borderRadius: '50%', flex: 'none', overflow: 'hidden',
      background: `linear-gradient(135deg, ${color.orange}, ${color.mint})`, display: 'grid', placeItems: 'center'}}>
      {avatar ? <Img src={staticFile(avatar)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : null}
    </div>
    <div style={{fontFamily: 'Manrope', lineHeight: 1.15}}>
      <div style={{fontSize: w * 0.062, fontWeight: 800, color: color.text}}>{name}</div>
      <div style={{fontSize: w * 0.05, fontWeight: 500, color: color.dim}}>{status}</div>
    </div>
  </div>
);

export type Msg = {from: 'in' | 'out'; at: number; text?: string; voice?: string; typing?: number};

const Dots: React.FC<{frame: number; size: number}> = ({frame, size}) => (
  <div style={{display: 'flex', gap: size * 0.3, padding: `${size * 0.2}px 0`}}>
    {[0, 1, 2].map((i) => (
      <span key={i} style={{width: size * 0.36, height: size * 0.36, borderRadius: '50%', background: 'currentColor',
        opacity: 0.35 + 0.65 * Math.max(0, Math.sin((frame / 5) - i * 0.9))}} />
    ))}
  </div>
);

const Voice: React.FC<{len: string; size: number}> = ({len, size}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: size * 0.4}}>
    <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 10 10"><path d="M2 1 L9 5 L2 9 Z" fill="currentColor" /></svg>
    <div style={{display: 'flex', alignItems: 'center', gap: size * 0.1, height: size}}>
      {[0.4, 0.8, 0.55, 1, 0.7, 0.35, 0.9, 0.6, 0.45, 0.75, 0.5, 0.3].map((v, i) => (
        <span key={i} style={{width: size * 0.12, height: size * v, borderRadius: 99, background: 'currentColor'}} />
      ))}
    </div>
    <span style={{fontVariantNumeric: 'tabular-nums'}}>{len}</span>
  </div>
);

const Bubble: React.FC<{m: Msg; frame: number; size: number; maxW: number}> = ({m, frame, size, maxW}) => {
  const ref = useFit(`bubble:${m.text ?? m.voice ?? 'typing'}`);
  const mine = m.from === 'out';
  const typing = m.typing && frame < m.at;
  return (
    <div ref={ref as never} style={{maxWidth: maxW, alignSelf: mine ? 'flex-end' : 'flex-start', boxSizing: 'border-box',
      padding: `${size * 0.5}px ${size * 0.62}px`, borderRadius: size * 0.95,
      [mine ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: size * 0.25,
      background: mine ? `linear-gradient(180deg, #8FFBDD 0%, ${color.mint} 60%, #25C9A0 100%)` : 'linear-gradient(180deg, #34383E 0%, #2A2D32 100%)',
      color: mine ? color.mintInk : color.text, fontFamily: 'Manrope', fontWeight: 600, fontSize: size, lineHeight: 1.3,
      boxShadow: `inset 0 2px 0 rgba(255,255,255,${mine ? 0.45 : 0.12}), ${elevation[1]}`}}>
      {typing ? <Dots frame={frame} size={size} /> : m.voice ? <Voice len={m.voice} size={size} /> : m.text}
    </div>
  );
};

// Лента сообщений с автопрокруткой: новое сообщение раскрывает свою высоту снизу, старые уезжают вверх сами.
// Высота раскрывается через grid-template-rows 0fr → 1fr: без замеров DOM, поэтому кадр детерминирован.
export const ChatThread: React.FC<{msgs: Msg[]; w: number; h: number; size?: number}> = ({msgs, w, h, size = 44}) => {
  const frame = useFrame30();
  return (
    <div style={{width: w, height: h, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      padding: `0 ${size * 0.6}px ${size * 0.6}px`, boxSizing: 'border-box'}}>
      {msgs.map((m, i) => {
        const shown = m.at - (m.typing ?? 0);
        if (frame < shown) return null;
        const k = interpolate(frame, [shown, shown + 8], [0, 1], {...clamp, easing: out});
        return (
          <div key={i} style={{display: 'grid', gridTemplateRows: `${k}fr`}}>
            <div style={{minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingTop: size * 0.4,
              opacity: k, filter: `blur(${(1 - k) * 8}px)`}}>
              <Bubble m={m} frame={frame} size={size} maxW={w * 0.78} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Уведомление сверху: стекло с настоящим значком сервиса. В ролике это «заявка пришла в телеграм».
export const Toast: React.FC<{at: number; icon: string; title: string; body: string; w: number}> = ({at, icon, title, body, w}) => {
  const frame = useFrame30();
  const ref = useFit(`toast:${title}`);
  const k = spring({frame: frame - at, fps: 30, config: {damping: 16, stiffness: 150}});
  const size = 46;
  return (
    <div ref={ref as never} style={{position: 'relative', width: w, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 28,
      padding: '30px 36px', borderRadius: 56, ...glassFill('frosted'), boxShadow: elevation[2],
      transform: `translateY(${(1 - k) * -220}px)`, opacity: interpolate(k, [0, 0.3], [0, 1], clamp)}}>
      <GlassLayers radius={56} />
      <div style={{position: 'relative', width: 112, height: 112, borderRadius: 30, background: '#FFFFFF', display: 'grid', placeItems: 'center', flex: 'none',
        boxShadow: 'inset 0 2px 0 rgba(255,255,255,.6), 0 6px 14px rgba(0,0,0,.35)'}}>
        <Img src={staticFile(icon)} style={{width: 76, height: 76, objectFit: 'contain'}} />
      </div>
      <div style={{position: 'relative', fontFamily: 'Manrope', color: color.text, textShadow: textDepth, lineHeight: 1.2, minWidth: 0}}>
        <div style={{fontWeight: 800, fontSize: size * 1.28}}>{title}</div>
        <div style={{fontWeight: 500, fontSize: size, color: '#D5D9DC'}}>{body}</div>
      </div>
    </div>
  );
};
