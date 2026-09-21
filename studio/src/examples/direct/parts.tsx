import {useMemo} from 'react';
import {Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {color, elevation, glassFill, GlassLayers, textDepth} from '../../ds';
import {ObjectStage, slab} from '../../kit/three';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export {BrowserCard, type Crop, type Mask} from '../../kit/BrowserCard';

// Ключ API — стеклянная пилюля со значком ключа. Летит по пунктиру к узлу Claude.
export const KeyPill: React.FC<{label: string; tone?: 'orange' | 'mint'}> = ({label, tone = 'orange'}) => {
  const accent = tone === 'orange' ? color.orange : color.mint;
  return (
    <div style={{position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 20, padding: '22px 40px 22px 26px', borderRadius: 999,
      ...glassFill('frosted'), boxShadow: `${elevation[2]}, 0 0 0 3px ${accent}66`, whiteSpace: 'nowrap'}}>
      <GlassLayers radius={999} />
      <span style={{position: 'relative', width: 76, height: 76, borderRadius: '50%', background: accent, display: 'grid', placeItems: 'center', flex: 'none',
        boxShadow: 'inset 0 2px 0 rgba(255,255,255,.5), 0 6px 14px rgba(0,0,0,.35)'}}>
        <svg width={44} height={44} viewBox="0 0 24 24"><circle cx="8" cy="12" r="4.2" fill="none" stroke="#101214" strokeWidth="2.6" />
          <path d="M12 12 H21 M18 12 V15.5 M21 12 V14.5" stroke="#101214" strokeWidth="2.6" strokeLinecap="round" /></svg>
      </span>
      <span style={{position: 'relative', fontFamily: 'Manrope', fontWeight: 800, fontSize: 60, color: color.text, textShadow: textDepth}}>{label}</span>
    </div>
  );
};

// 3D-сервер: три юнита тёмного металла, решётка и светодиоды. on — светодиоды загораются мятным (бот запущен).
const Rack: React.FC<{w: number; h: number; on: number; tilt: number}> = ({w, h, on, tilt}) => {
  const unit = (h - 32) / 3;
  const [body, vent, led] = useMemo(() => [slab(w, unit, 22, 30, 8), slab(w * 0.5, 8, 4, 4, 2), slab(22, 22, 11, 4, 3)], [w, unit]);
  const ledColor = on > 0.5 ? '#3DEDC3' : '#FF7A2F';
  return (
    <group rotation={[0.12 + tilt * 0.3, -0.35 + tilt, 0]}>
      {[0, 1, 2].map((i) => {
        const y = h / 2 - unit / 2 - i * (unit + 16);
        return (
          <group key={i} position={[0, y, 0]}>
            <mesh geometry={body}><meshPhysicalMaterial color="#2C3035" metalness={0.8} roughness={0.32} clearcoat={0.4} /></mesh>
            {[-12, 0, 12].map((dy) => (
              <mesh key={dy} geometry={vent} position={[-w * 0.12, dy, 40]}><meshStandardMaterial color="#15171A" roughness={0.6} /></mesh>
            ))}
            {[0, 1].map((k) => (
              <mesh key={k} geometry={led} position={[w * 0.28 + k * 44, 0, 40]}>
                <meshStandardMaterial color={ledColor} emissive={ledColor} emissiveIntensity={0.4 + on * 1.6} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};
export const Server3D: React.FC<{w: number; h: number; on: number}> = ({w, h, on}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tilt = Math.sin((frame / fps) * 0.9) * 0.05;
  return (
    <div style={{position: 'relative', width: w, height: h}}>
      <div style={{position: 'absolute', left: w * 0.1, right: w * 0.1, bottom: -10, height: 60, borderRadius: '50%', background: 'rgba(0,0,0,.45)', filter: 'blur(24px)'}} />
      <ObjectStage w={w} h={h} pad={120} env={0.8}><Rack w={w * 0.82} h={h * 0.82} on={on} tilt={tilt} /></ObjectStage>
    </div>
  );
};

// Стеклянная карточка интерфейса (макет OpenRouter): заголовок раздела с логотипом и произвольное содержимое.
export const UiCard: React.FC<{w: number; title: string; icon: string; children: React.ReactNode}> = ({w, title, icon, children}) => (
  <div style={{position: 'relative', width: w, boxSizing: 'border-box', padding: '40px 48px 48px', borderRadius: 56, ...glassFill('frosted', '20,24,26'), boxShadow: elevation[3]}}>
    <GlassLayers radius={56} />
    <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 22, marginBottom: 30}}>
      <span style={{width: 80, height: 80, borderRadius: 22, background: '#FFFFFF', display: 'grid', placeItems: 'center', flex: 'none'}}>
        <Img src={staticFile(icon)} style={{width: 54, height: 54}} />
      </span>
      <span style={{fontFamily: 'Manrope', fontWeight: 800, fontSize: 64, color: color.text, textShadow: textDepth}}>{title}</span>
    </div>
    <div style={{position: 'relative'}}>{children}</div>
  </div>
);

// Кнопка интерфейса: press 0…1 — нажатие курсором.
export const UiButton: React.FC<{label: string; press: number}> = ({label, press}) => (
  <div style={{display: 'inline-block', padding: '22px 44px', borderRadius: 999, fontFamily: 'Manrope', fontWeight: 800, fontSize: 52, color: color.mintInk,
    background: `linear-gradient(180deg, #A8FFE9 0%, ${color.mint} 60%, #1DBF97 100%)`, boxShadow: `inset 0 2px 0 rgba(255,255,255,.5), ${elevation[1]}`,
    transform: `scale(${1 - press * 0.06})`}}>{label}</div>
);

// Заявка из бота в Telegram — вектором по настоящему сообщению от 18.09.2026 (скриншот 430 px не тянется до 4K).
// Ник и ссылки не выводятся, пока владелец не подтвердит, что это тестовый аккаунт.
export const LeadCard: React.FC<{w: number}> = ({w}) => {
  const row = (k: string, v: string) => (
    <div style={{display: 'flex', gap: 16, fontSize: 46, lineHeight: 1.45}}><span style={{color: '#6B7178', fontWeight: 600}}>{k}</span><span style={{color: '#101214', fontWeight: 700}}>{v}</span></div>
  );
  return (
    <div style={{width: w, boxSizing: 'border-box', padding: '36px 46px 40px', borderRadius: 48, background: 'linear-gradient(180deg, #FFFFFF 0%, #F3F4F2 100%)',
      boxShadow: `inset 0 -4px 0 rgba(0,0,0,.06), ${elevation[3]}`, fontFamily: 'Manrope'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 20, marginBottom: 22}}>
        <Img src={staticFile('brand/telegram.svg')} style={{width: 72, height: 72}} />
        <div style={{fontWeight: 800, fontSize: 54, color: '#101214', letterSpacing: '-0.01em'}}>Новая заявка · Instagram</div>
      </div>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, padding: '8px 24px', borderRadius: 999, background: '#FFE3D2', marginBottom: 14,
        fontSize: 44, fontWeight: 800, color: '#B4460F'}}><span style={{width: 18, height: 18, borderRadius: '50%', background: color.orange}} />горячий</div>
      {row('Имя:', 'Алексей')}
      {row('Страна:', 'Казахстан')}
      {row('Интерес:', 'обучение вайбкодингу')}
      {row('Кто:', 'предприниматель')}
    </div>
  );
};
