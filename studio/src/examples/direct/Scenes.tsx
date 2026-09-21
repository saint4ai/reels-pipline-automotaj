import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import {color, DepthText, elevation, glassFill, GlassLayers, Pill, textDepth, type} from '../../ds';
import {Backdrop, BlurIn, ChatThread, Cursor, DmHeader, ink, PhoneMock, Pop, Porthole, portholeWindow, RiseIn, Sticker, Toast, Toggle, toggleKnob} from '../../kit';
import {LeadCard} from './parts';
import {useSceneTime} from './timing';

// Сцены вне схемы. Координаты — композиция 1440×2560, графика в полосе y 140…1470 (ниже субтитры и карточка спикера).
// Время — секунды ролика по пословной расшифровке; A(сек) переводит его в единицы библиотеки kit.
const W = 1440;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const at = (x: number, y: number, w?: number): React.CSSProperties => ({position: 'absolute', left: x, top: y, width: w});
const center = (y: number): React.CSSProperties => ({position: 'absolute', left: 0, top: y, width: W, display: 'flex', justifyContent: 'center'});
type S = {t0: number};

// 0 · Хук на чёрном: «ИИ-ассистент в директ», пилюля Claude Code, снизу 3D-иллюминатор, в окне «$7 в месяц».
export const PORTHOLE = {x: 470, y: 560, w: 500, h: 700};
export const PORTHOLE_WINDOW = portholeWindow(PORTHOLE.x, PORTHOLE.y, PORTHOLE.w, PORTHOLE.h);
export const SceneHook: React.FC<S> = ({t0}) => {
  const {A} = useSceneTime(t0);
  return (
    <AbsoluteFill>
      <Backdrop kind="black" />
      <div style={at(0, 200, W)}><BlurIn text="ИИ-ассистент в директ" at={A(-0.45)} size={type.label * 1.5} weight={800} color={ink.black} /></div>
      <div style={center(360)}><Pop at={A(0.5)} tilt={3}><Pill label="Claude Code" icon="brand/claude.svg" material="frosted" size={type.label} level={3} /></Pop></div>
      <RiseIn at={A(2.2)} from={900} style={at(PORTHOLE.x, PORTHOLE.y)}>
        <Porthole w={PORTHOLE.w} h={PORTHOLE.h}>
          <Backdrop kind="sky" />
          <Pop at={A(3.15)} style={{position: 'absolute', left: 60, top: 150, width: 240}}><Sticker head="в месяц" value="$7" w={240} /></Pop>
        </Porthole>
      </RiseIn>
    </AbsoluteFill>
  );
};

// 1 · Закатное небо: ManyChat $25 зачёркивается, рядом наш $7.
export const SceneCompare: React.FC<S> = ({t0}) => {
  const {A, t} = useSceneTime(t0);
  const strike = interpolate(t, [5.6, 5.85], [0, 1], {...clamp, easing: out});
  const logo = (src: string) => (
    <span style={{width: 120, height: 120, borderRadius: '50%', background: '#FFFFFF', display: 'grid', placeItems: 'center', boxShadow: elevation[2]}}>
      <Img src={staticFile(src)} style={{width: 74, height: 74}} />
    </span>
  );
  return (
    <AbsoluteFill>
      <Backdrop kind="sky" />
      <div style={at(0, 220, W)}><BlurIn text="вместо ManyChat" at={A(4.55)} size={type.label * 1.45} weight={800} color={ink.sky} /></div>
      <div style={{...at(140, 520), width: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34,
        transform: `rotate(${-3 * strike}deg)`, opacity: 1 - strike * 0.35}}>
        <Pop at={A(4.62)}>{logo('brand/manychat.svg')}</Pop>
        <Pop at={A(4.74)} style={{position: 'relative'}}>
          <Sticker head="ManyChat" value="$25" w={420} />
          <div style={{position: 'absolute', left: 30, right: 30, top: '64%', height: 16, borderRadius: 8, background: color.orange,
            transform: `scaleX(${strike}) rotate(-8deg)`, transformOrigin: 'left center', boxShadow: '0 4px 10px rgba(0,0,0,.25)'}} />
        </Pop>
      </div>
      <div style={{...at(820, 520), width: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
        <Pop at={A(5.65)}>{logo('brand/claude.svg')}</Pop>
        <Pop at={A(5.75)}><Sticker head="Claude Code" value="$7" w={420} accent="mint" /></Pop>
      </div>
    </AbsoluteFill>
  );
};

// 2 · Графит: 3D-телефон. Сначала директ — ассистент продаёт, на «по кодовому слову» экран сменяется настоящей записью.
export const ScenePhone: React.FC<S> = ({t0}) => {
  const {A, t} = useSceneTime(t0);
  const {fps} = useVideoConfig();
  const phoneW = 620, phoneH = 1300;
  const swap = interpolate(t, [7.8, 8.1], [0, 1], {...clamp, easing: out});
  return (
    <AbsoluteFill>
      <Backdrop kind="graphite" />
      <div style={{...at(0, 0, W), height: 1400, overflow: 'hidden', WebkitMaskImage: 'linear-gradient(180deg, #000 88%, transparent 100%)'}}>
        <RiseIn at={A(6.3)} from={1100} style={at((W - phoneW) / 2, 170)}>
          <PhoneMock w={phoneW} h={phoneH}>
            <div style={{position: 'absolute', inset: 0, opacity: 1 - swap, transform: `translateY(${-swap * 80}px)`}}>
              <DmHeader name="Марат" status="в сети" w={phoneW} />
              <ChatThread w={phoneW - 40} h={760} size={40} msgs={[
                {from: 'in', at: A(6.55), text: 'Сколько стоит обучение?'},
                {from: 'out', at: A(7.35), typing: 10, text: 'Расскажу и запишу вас. Оставить заявку?'},
              ]} />
            </div>
            <div style={{position: 'absolute', inset: 0, opacity: swap, transform: `translateY(${(1 - swap) * 120}px)`}}>
              <Sequence from={Math.round((7.8 - t0) * fps)} layout="none">
                <Video src={staticFile('reels/direct/bot-comments.mp4')} playbackRate={1.28} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              </Sequence>
            </div>
          </PhoneMock>
        </RiseIn>
      </div>
    </AbsoluteFill>
  );
};

// 3 · Мятное свечение: «до $1 500» — счётчик на «полутора тысяч», под ним настоящая заявка из бота.
export const SceneMoney: React.FC<S> = ({t0}) => {
  const {A, t} = useSceneTime(t0);
  const n = Math.round(interpolate(t, [12.2, 13.3], [0, 1500], {...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1)}));
  const num = n >= 1000 ? `${Math.floor(n / 1000)} ${String(n % 1000).padStart(3, '0')}` : String(n);
  return (
    <AbsoluteFill>
      <Backdrop kind="mint" />
      <div style={center(170)}><RiseIn at={A(12.2)} from={200}><DepthText size={type.headline * 0.95}>{`до $${num}`}</DepthText></RiseIn></div>
      <div style={at(0, 430, W)}><BlurIn text="каждый месяц" at={A(13.8)} size={type.label * 1.25} weight={700} color={ink.mint} /></div>
      <RiseIn at={A(11.15)} from={700} style={at(220, 620)}><LeadCard w={1000} /></RiseIn>
    </AbsoluteFill>
  );
};

// 4 · Белый: «3 лёгких шага» — три пилюли с логотипами. Первая становится узлом схемы (сжатие в узел).
export const STEP1_SCREEN = {x: W / 2, y: 560};
export const SceneSteps: React.FC<S> = ({t0}) => {
  const {A} = useSceneTime(t0);
  const steps = [
    {n: '1', label: 'Zernio', icon: 'brand/zernio.png'},
    {n: '2', label: 'OpenRouter', icon: 'brand/openrouter.svg'},
    {n: '3', label: 'сервер · $2', icon: undefined},
  ];
  return (
    <AbsoluteFill>
      <Backdrop kind="white" />
      <div style={at(0, 230, W)}><BlurIn text="3 лёгких шага" at={A(14.7)} size={type.label * 1.7} weight={800} color={ink.white} /></div>
      {steps.map((s, i) => (
        <div key={s.n} style={{...center(STEP1_SCREEN.y - 70 + i * 250), alignItems: 'center', gap: 34}}>
          <Pop at={A(15.69 + i * 0.22)} tilt={3}>
            <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
              <span style={{width: 112, height: 112, borderRadius: '50%', background: '#101214', color: color.mint, display: 'grid', placeItems: 'center',
                fontFamily: 'Manrope', fontWeight: 800, fontSize: 64, boxShadow: elevation[2]}}>{s.n}</span>
              <Pill label={s.label} icon={s.icon} material="solid" size={type.label * 1.05} level={2} />
            </div>
          </Pop>
        </div>
      ))}
    </AbsoluteFill>
  );
};

// 6 · Чёрный: «Напиши „агент“» — комментарий поднимается снизу, сверху падает директ, две карточки: промпт и инструкция.
export const SceneCta: React.FC<S> = ({t0}) => {
  const {A, t} = useSceneTime(t0);
  const typed = 'агент'.slice(0, Math.round(interpolate(t, [48.6, 49.0], [0, 5], clamp)));
  const doc = (title: string, sub: string, when: number) => (
    <RiseIn at={A(when)} from={500}>
      <div style={{position: 'relative', width: 470, boxSizing: 'border-box', padding: '40px 40px 44px', borderRadius: 52, ...glassFill('frosted'), boxShadow: elevation[2]}}>
        <GlassLayers radius={52} />
        <div style={{position: 'relative', display: 'grid', gap: 14, marginBottom: 26}}>
          {[1, 0.8, 0.9, 0.6].map((k, i) => <span key={i} style={{height: 14, width: `${k * 100}%`, borderRadius: 7, background: i ? 'rgba(255,255,255,.28)' : color.mint}} />)}
        </div>
        <div style={{position: 'relative', fontFamily: 'Manrope', fontWeight: 800, fontSize: 62, color: color.text, textShadow: textDepth}}>{title}</div>
        <div style={{position: 'relative', fontFamily: 'Manrope', fontWeight: 600, fontSize: 44, color: color.dim}}>{sub}</div>
      </div>
    </RiseIn>
  );
  return (
    <AbsoluteFill>
      <Backdrop kind="black" />
      <div style={{...at(170, 150), width: W - 340}}><Toast at={A(49.25)} icon="brand/instagram.svg" title="Директ" body="промпт и инструкция уже у тебя" w={W - 340} /></div>
      <div style={at(0, 400, W)}><BlurIn text="Напиши «агент»" at={A(47.4)} size={type.label * 1.75} weight={800} color={ink.black} /></div>
      <RiseIn at={A(47.75)} from={400} style={{...at(250, 620), width: W - 500}}>
        <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 30, padding: '34px 44px', borderRadius: 60, ...glassFill('clear'), boxShadow: elevation[2]}}>
          <GlassLayers radius={60} />
          <span style={{position: 'relative', width: 104, height: 104, borderRadius: '50%', background: '#FFFFFF', display: 'grid', placeItems: 'center', flex: 'none'}}>
            <Img src={staticFile('brand/instagram.svg')} style={{width: 66, height: 66}} />
          </span>
          <div style={{position: 'relative', fontFamily: 'Manrope', color: color.text, textShadow: textDepth, lineHeight: 1.2}}>
            <div style={{fontSize: type.body, fontWeight: 600, color: color.dim}}>комментарий</div>
            <div style={{fontSize: type.label * 1.15, fontWeight: 800, minHeight: type.label * 1.38}}>{typed}<span style={{opacity: t < 49.3 ? 1 : 0, color: color.mint}}>|</span></div>
          </div>
        </div>
      </RiseIn>
      <div style={{...at(0, 930, W), display: 'flex', justifyContent: 'center', gap: 40}}>
        {doc('Промпт', 'для Claude Code', 49.5)}
        {doc('Инструкция', 'по шагам', 49.85)}
      </div>
    </AbsoluteFill>
  );
};

// 7 · Белый: тогл «вручную → автомат», курсор жмёт на «автоматизацию».
export const SceneToggle: React.FC<S> = ({t0}) => {
  const {A, t} = useSceneTime(t0);
  const on = interpolate(t, [53.85, 54.2], [0, 1], {...clamp, easing: out});
  const press = interpolate(t, [53.62, 53.76, 53.9], [0, 1, 0], clamp);
  const rowY = 760, size = 150, cy = rowY + size / 2;
  const offX = W / 2 + toggleKnob(0, size).dx, onX = W / 2 + toggleKnob(1, size).dx;
  return (
    <AbsoluteFill>
      <Backdrop kind="white" />
      <div style={at(0, 420, W)}><BlurIn text="Claude соберёт сам" at={A(51.12)} size={type.label * 1.45} weight={800} color={ink.white} /></div>
      <div style={{...at(0, rowY, W), filter: `blur(${interpolate(t, [51.18, 51.5], [12, 0], clamp)}px)`, opacity: interpolate(t, [51.18, 51.5], [0, 1], clamp)}}>
        <Toggle on={on} press={press} left="вручную" right="автомат" size={size} width={W} />
      </div>
      <Cursor clicks={[A(53.7)]} moves={[
        {from: [1180, 1380], to: [offX + 10, cy + 12], start: A(52.4), end: A(53.55), bend: 0.22},
        {from: [offX + 10, cy + 12], to: [onX + 10, cy + 12], start: A(53.85), end: A(54.2), bend: 0},
      ]} />
    </AbsoluteFill>
  );
};
