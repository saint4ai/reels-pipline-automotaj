import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {color} from '../../ds';
import {COIN_PALETTE, coinVoxels, PixelBackdrop, PixelOrb, PixelPanel, PixelText, pixFont, PixText, PLUG_PALETTE, plugVoxels, stepPoly, uiFont, VoxelModel} from '../../kit/pixel';
import {SpeakerCard} from '../../components/SpeakerCard';
import {Captions, type Page} from '../../components/Captions';
import {WORDS} from './words';

// Проба стиля «воксельное стекло» на хуке ролика 20 (0–9,2 с): владелец хочет «между Minecraft и Pixel Gun,
// но не крупные пиксели, качественно, со стеклом». Пиксель — в форме (лесенки, кубики, пиксельный шрифт), не в разрешении.
const W = 1440;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
export const PIXEL_HOOK_END = 9.0;
const clip = (w: number, h: number, s: number, n: number) => `polygon(${stepPoly(w, h, s, n).map(([x, y]) => `${x}px ${y}px`).join(',')})`;

// Настоящий логотип в белой пиксельной плашке со ступенчатыми углами.
const PixelLogo: React.FC<{src: string; size: number}> = ({src, size}) => (
  <span style={{position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size, flex: 'none',
    clipPath: clip(size, size, size * 0.1, 2), background: 'linear-gradient(180deg, #FFFFFF 0%, #E9EBEE 100%)'}}>
    <Img src={staticFile(src)} style={{width: size * 0.62, height: size * 0.62, objectFit: 'contain'}} />
  </span>
);

// Гнездо: тёмная пластина лесенкой, две прорези; при подключении прорези и край горят мятным.
const PixelSocket: React.FC<{on: number}> = ({on}) => (
  <div style={{position: 'relative', width: 96, height: 150}}>
    <div style={{position: 'absolute', inset: 0, clipPath: clip(96, 150, 8, 2), background: `linear-gradient(180deg, #33383E, #1A1D21)`,
      boxShadow: `0 0 ${on * 50}px rgba(61,237,195,${on * 0.8})`}} />
    {[36, 90].map((y) => (
      <span key={y} style={{position: 'absolute', left: 36, top: y, width: 24, height: 24, background: on > 0.5 ? color.mint : '#07080A',
        boxShadow: on > 0.5 ? `0 0 18px ${color.mint}` : 'inset 0 3px 5px rgba(0,0,0,.9)'}} />
    ))}
  </div>
);

// Воксельный штекер въезжает справа: кончики штырей встают в гнездо (x, y — центр гнезда справа).
const VOX = 24;
const PixelPlug: React.FC<{t: number; at: number; x: number; y: number; logo: string}> = ({t, at, x, y, logo}) => {
  const k = interpolate(t, [at - 0.35, at], [0, 1], {...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1)});
  const on = interpolate(t, [at, at + 0.12], [0, 1], clamp);
  const bump = Math.sin(Math.PI * interpolate(t, [at, at + 0.18], [0, 1], clamp)) * 8;
  const vox = plugVoxels(14, 4);
  return (
    <>
      <div style={{position: 'absolute', left: x - 28 - 36 + (1 - k) * 900 + bump, top: y - 130, opacity: interpolate(k, [0, 0.1], [0, 1], clamp)}}>
        <VoxelModel voxels={vox} palette={PLUG_PALETTE} size={VOX} w={680} h={260} rx={0.18} ry={-0.28} pad={60} />
        <div style={{position: 'absolute', left: 168, top: 58}}><PixelLogo src={logo} size={92} /></div>
      </div>
      <div style={{position: 'absolute', left: x - 96, top: y - 75}}><PixelSocket on={on} /></div>
    </>
  );
};

// Панель чата: шапка с логотипом, скучный ответ, поле ввода с блочной кареткой; dash — превращение в пиксельную диаграмму с утечками.
const Chat: React.FC<{t: number}> = ({t}) => {
  const logo = interpolate(t, [0.55, 0.85], [0, 1], {...clamp, easing: out});
  const reply = interpolate(t, [2.8, 3.1], [0, 1], {...clamp, easing: out});
  const dash = interpolate(t, [7.0, 7.8], [0, 1], {...clamp, easing: inOut});
  const caret = Math.floor(t * 2.4) % 2 === 0;
  const bars = [{label: 'реклама', n: 9}, {label: 'заявки', n: 6}, {label: 'продажи', n: 3}];
  return (
    <PixelPanel w={800} h={680} step={12} n={3}>
      <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '34px 42px', borderBottom: '4px solid rgba(255,255,255,.08)'}}>
        <span style={{transform: `scale(${logo})`, display: 'inline-flex'}}><PixelLogo src="brand/claude.svg" size={88} /></span>
        <span style={{...pixFont(60), color: color.text}}><PixText>Claude</PixText></span>
        <span style={{marginLeft: 'auto', ...uiFont(54), color: '#9AA0A7'}}>простой чат</span>
      </div>
      <div style={{position: 'absolute', left: 42, top: 190, opacity: (1 - dash) * reply, transform: `translateY(${(1 - reply) * 20}px)`}}>
        <div style={{padding: '0 30px', clipPath: clip(716, 110, 8, 2), width: 716, height: 110, boxSizing: 'border-box', background: 'rgba(255,255,255,.12)',
          display: 'flex', alignItems: 'center', ...uiFont(58), color: color.text, whiteSpace: 'nowrap'}}>Привет! Чем могу помочь?</div>
      </div>
      <div style={{position: 'absolute', left: 42, bottom: 40, width: 716, height: 104, clipPath: clip(716, 104, 8, 2), background: 'rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'center', padding: '0 34px', boxSizing: 'border-box', ...uiFont(56, 500), color: '#9AA0A7', opacity: 1 - dash}}>
        спросите что-нибудь<span style={{marginLeft: 10, width: 26, height: 52, background: color.mint, opacity: caret ? 1 : 0}} />
      </div>
      <div style={{position: 'absolute', left: 60, right: 60, top: 190, bottom: 50, opacity: dash, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between'}}>
        {bars.map((b, i) => {
          const shown = Math.round(b.n * interpolate(dash, [0.2 + i * 0.12, 0.7 + i * 0.12], [0, 1], clamp));
          return (
            <div key={b.label} style={{position: 'relative', width: 190, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
              {i < 2 ? (
                <span style={{position: 'absolute', right: -70, bottom: 110 + b.n * 18, ...pixFont(56), color: color.orange,
                  opacity: interpolate(dash, [0.75, 0.95], [0, 1], clamp), textShadow: '4px 4px 0 #3A1A0A'}}><PixText>−$</PixText></span>
              ) : null}
              {Array.from({length: shown}).map((_, j) => (
                <span key={j} style={{width: 150, height: 30, background: j === shown - 1 ? '#8FFBDD' : color.mint, boxShadow: 'inset 0 -5px 0 rgba(0,0,0,.18)'}} />
              ))}
              <span style={{...uiFont(54), color: color.text, marginTop: 10}}>{b.label}</span>
            </div>
          );
        })}
        {/* Утечки: пиксельные капли падают между ступенями. */}
        {[0, 1].map((i) => {
          const fall = ((t - 7.5 - i * 0.3) % 1.2 + 1.2) % 1.2;
          return t > 7.5 ? <span key={i} style={{position: 'absolute', left: 230 + i * 250, top: 180 + fall * 260, width: 20, height: 20, background: '#FF6A4A',
            opacity: 1 - fall / 1.2, boxShadow: '0 0 12px rgba(255,106,74,.8)'}} /> : null;
        })}
      </div>
    </PixelPanel>
  );
};

const PAGES: Page[] = [
  {from: 0, to: 3.57, lines: 2}, {from: 3.57, to: 7.0, lines: 2}, {from: 7.0, to: 9.0, lines: 1},
];

export const PixelHook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const hook1 = 1 - interpolate(t, [3.55, 3.85], [0, 1], clamp);
  const hook2 = interpolate(t, [6.95, 7.3], [0, 1], {...clamp, easing: out});
  // Средний заголовок по речи «хотя его можно подключить к рекламе, инстаграм и CRM»: собирается по словам вместе со штекерами.
  const mid = interpolate(t, [3.9, 4.2], [0, 1], {...clamp, easing: out}) * (1 - interpolate(t, [6.75, 6.95], [0, 1], clamp));
  const midAd = interpolate(t, [4.9, 5.15], [0, 1], {...clamp, easing: out});
  const midCrm = interpolate(t, [6.25, 6.5], [0, 1], {...clamp, easing: out});
  const coin = interpolate(t, [0.8, 1.2], [0, 1], {...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1)});
  const coinOut = 1 - interpolate(t, [4.2, 4.5], [0, 1], clamp);
  const warm = interpolate(t, [3.6, 4.6], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <PixelBackdrop glow={warm > 0.5 ? [color.orange, color.orange] : [color.orange, color.mint]} codeOpacity={0.12 + warm * 0.06} />
      <div style={{position: 'absolute', left: 0, top: 150, width: W, textAlign: 'center', opacity: hook1}}>
        <div><PixelText size={112}>Ты платишь $20</PixelText></div>
        <div style={{marginTop: 22}}><PixelText size={112} face="#FF9C5E" side="#6E2A0C">за простой чат</PixelText></div>
      </div>
      <div style={{position: 'absolute', left: 0, top: 150, width: W, textAlign: 'center', opacity: mid, transform: `translateY(${(1 - mid) * 30}px)`}}>
        <div><PixelText size={108}>подключи его</PixelText></div>
        <div style={{marginTop: 22}}>
          <span style={{display: 'inline-block', opacity: midAd, transform: `translateY(${(1 - midAd) * 24}px)`}}><PixelText size={108} face="#FF9C5E" side="#6E2A0C">к рекламе</PixelText></span>
          <span style={{display: 'inline-block', marginLeft: 22, opacity: midCrm, transform: `translateY(${(1 - midCrm) * 24}px)`}}><PixelText size={108} face="#8FFBDD" side="#0E5C4A">и CRM</PixelText></span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, top: 150, width: W, textAlign: 'center', opacity: hook2, transform: `translateY(${(1 - hook2) * 30}px)`}}>
        <div><PixelText size={108}>покажет, где ты</PixelText></div>
        <div style={{marginTop: 22}}><PixelText size={108} face="#FF9C5E" side="#6E2A0C">теряешь деньги</PixelText></div>
      </div>
      {/* Пиксельные диски за стеклом окна: оранжевый у верхнего правого угла, мятный у нижнего левого. */}
      <div style={{position: 'absolute', left: 860 - 170, top: 610 - 170 + Math.sin(t * 1.1) * 10}}><PixelOrb r={170} from="#FFB27F" to={color.orange} opacity={0.9} /></div>
      <div style={{position: 'absolute', left: 150 - 200, top: 1190 - 200 + Math.sin(t * 0.9 + 1) * 10}}><PixelOrb r={200} from="#8FFBDD" to="#1DBF97" opacity={0.85} /></div>
      <div style={{position: 'absolute', left: 110, top: 520}}><Chat t={t} /></div>
      <div style={{position: 'absolute', left: 1050, top: 540, opacity: coinOut, transform: `scale(${coin})`}}>
        <VoxelModel voxels={coinVoxels()} palette={COIN_PALETTE} size={22} w={360} h={360} rx={0.12} ry={Math.sin(t * 1.4) * 0.5} pad={40} />
        <div style={{textAlign: 'center', marginTop: -10}}><PixelText size={66} face="#FFE3C8" side="#6E2A0C">$20/мес</PixelText></div>
      </div>
      <PixelPlug t={t} at={4.95} x={1006} y={750} logo="brand/meta.svg" />
      <PixelPlug t={t} at={5.6} x={1006} y={920} logo="brand/instagram.svg" />
      <PixelPlug t={t} at={6.3} x={1006} y={1090} logo="brand/amocrm.png" />
      <SpeakerCard src="reels/money/speaker.mp4" headY={860} plan={[]} />
      <Captions words={WORDS} pages={PAGES} width={1120} />
      {[[0.55, 'rubber', 0.25], [0.85, 'counter', 0.25], [2.8, 'typing', 0.25], [4.95, 'zoom', 0.4], [5.6, 'zoom', 0.4], [6.3, 'zoom', 0.4], [7.0, 'flash', 0.3]].map(([s, f, v], i) => (
        <Sequence key={i} from={Math.round((s as number) * fps)}><Audio src={staticFile(`sfx/${f}.wav`)} volume={v as number} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
