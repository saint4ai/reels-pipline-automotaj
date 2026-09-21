import {AbsoluteFill, Easing, Img, interpolate, Sequence, spring, staticFile, useVideoConfig} from 'remotion';
import {color, elevation, Pill, type} from '../../ds';
import {BlurIn, Pop, RiseIn, Sticker, Toast, useFrame30} from '../../kit';
import {DashedPath} from '../../components/DashedPath';
import {BrowserCard, KeyPill, Server3D} from './parts';
import {useSceneTime} from './timing';

// Схема трёх шагов — режим «холст»: одна карта, камера едет между зонами по речи, пунктир рисуется по ходу,
// прошлый блок остаётся в кадре якорем. Координаты мира — пиксели композиции 1440×2560.
// Зоны: 1 Zernio (оранжевое свечение) → узел Claude → 2 OpenRouter (мятное) → 3 сервер (графит) → общий план.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const out = Easing.bezier(0.16, 1, 0.3, 1);
const VIEW = {x: 720, y: 805};

// Камера: секунда, центр кадра в мире, масштаб. Между точками — плавный переезд, на повторах — стоянка.
const CAM: [number, number, number, number][] = [
  [16.55, 720, 545, 1], [16.85, 720, 545, 1], [17.6, 720, 760, 1], [25.95, 720, 760, 1],
  [26.9, 720, 1500, 0.92], [27.65, 720, 1500, 0.92], [28.45, 1900, 1960, 1], [34.35, 1900, 1960, 1],
  [35.3, 1300, 2060, 0.72], [36.15, 1300, 2060, 0.72], [36.95, 720, 2550, 0.9], [40.1, 720, 2550, 0.9],
  [40.8, 720, 2250, 0.78], [41.85, 720, 2250, 0.78], [42.5, 720, 2380, 0.78], [43.75, 720, 2380, 0.78],
  [44.55, 720, 2820, 0.8], [48, 720, 2820, 0.8],
];
const cam = (t: number) => {
  const ts = CAM.map((k) => k[0]);
  const v = (i: number) => interpolate(t, ts, CAM.map((k) => k[i]), {...clamp, easing: inOut});
  return {x: v(1), y: v(2), z: v(3)};
};

// Окна записей экрана: почти во всю ширину кадра при масштабе 1, пропорции записи 1920×1040.
const WIN_W = 1360, WIN_H = 66 + Math.round((1360 * 1040) / 1920);
const WIN1 = {y: 440}, WIN2 = {y: 1590};
// Окно раскрывается из узла сверху вниз (пружина), потом гаснет, когда камера уходит к следующей зоне.
const Expand: React.FC<{at: number; fade: [number, number]; t: number; children: React.ReactNode}> = ({at, fade, t, children}) => {
  const f30 = useFrame30();
  const k = spring({frame: f30 - at, fps: 30, config: {damping: 18, stiffness: 140, mass: 0.9}});
  return (
    <div style={{position: 'relative', width: WIN_W, height: WIN_H, transformOrigin: '50% 0%', transform: `scale(${0.2 + 0.8 * k})`,
      opacity: Math.min(interpolate(k, [0, 0.2], [0, 1], clamp), 1 - interpolate(t, fade, [0, 1], clamp))}}>{children}</div>
  );
};
const HUB = {x: 720, y: 1900};
// Ключи летят кривой в обход узла и карточек и встают под узлом по обе стороны от пунктира к серверу.
// Пути проверены на пересечения: ключ Zernio обходит узел слева, ключ OpenRouter — под карточкой API Keys.
const KEY1 = {from: {x: 720, y: 1350}, c1: {x: 100, y: 1400}, c2: {x: 100, y: 2080}, dock: {x: 380, y: 2080}};
const KEY2 = {from: {x: 1900, y: 2500}, c1: {x: 1300, y: 2640}, c2: {x: 1080, y: 2500}, dock: {x: 1060, y: 2080}};
type Pt = {x: number; y: number};
const lerp = (a: Pt, b: Pt, k: number) => ({x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k});
const bez = (k: {from: Pt; c1: Pt; c2: Pt; dock: Pt}, u: number) => {
  const a = lerp(k.from, k.c1, u), b = lerp(k.c1, k.c2, u), c = lerp(k.c2, k.dock, u);
  return lerp(lerp(a, b, u), lerp(b, c, u), u);
};
const place = (p: {x: number; y: number}, children: React.ReactNode, extra?: React.CSSProperties) => (
  <div style={{position: 'absolute', left: p.x, top: p.y, width: 0, height: 0, ...extra}}>
    <div style={{position: 'absolute', left: 0, top: 0, transform: 'translate(-50%, -50%)'}}>{children}</div>
  </div>
);
const Node: React.FC<{n: string; label: string; icon?: string}> = ({n, label, icon}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 26, whiteSpace: 'nowrap'}}>
    <span style={{width: 100, height: 100, borderRadius: '50%', background: color.mint, color: color.mintInk, display: 'grid', placeItems: 'center',
      fontFamily: 'Manrope', fontWeight: 800, fontSize: 58, boxShadow: `inset 0 2px 0 rgba(255,255,255,.5), ${elevation[2]}`}}>{n}</span>
    <Pill label={label} icon={icon} material="frosted" size={type.label * 1.1} level={2} />
  </div>
);
const Circle: React.FC<{children: React.ReactNode; size?: number; bg?: string}> = ({children, size = 130, bg = '#FFFFFF'}) => (
  <span style={{width: size, height: size, borderRadius: '50%', background: bg, display: 'grid', placeItems: 'center', boxShadow: elevation[2]}}>{children}</span>
);

export const SceneScheme: React.FC<{t0: number}> = ({t0}) => {
  const {A, t} = useSceneTime(t0);
  const {fps} = useVideoConfig();
  const c = cam(t);
  const seq = (sec: number) => Math.round((sec - t0) * fps);
  const draw = (a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: out});
  // Ключи: вылет дугой к узлу Claude, стоянка по бокам (чуть меньше), на «оба ключа» — въезжают в узел.
  const merge = interpolate(t, [40.7, 41.3], [0, 1], {...clamp, easing: inOut});
  const fly1 = interpolate(t, [26.45, 27.15], [0, 1], {...clamp, easing: inOut}), fly2 = interpolate(t, [34.7, 35.5], [0, 1], {...clamp, easing: inOut});
  const k1 = lerp(bez(KEY1, fly1), HUB, merge), k2 = lerp(bez(KEY2, fly2), HUB, merge);
  const keyStyle = (_fly: number) => ({transform: `scale(${1 - merge * 0.5})`, opacity: 1 - interpolate(t, [41.0, 41.3], [0, 1], clamp)});
  const hubPulse = 1 + 0.08 * Math.sin(Math.PI * interpolate(t, [41.0, 41.6], [0, 1], clamp));
  const serverOn = interpolate(t, [43.1, 43.3], [0, 1], clamp);
  const bot = lerp({x: 720, y: 2000}, {x: 720, y: 2520}, interpolate(t, [42.6, 43.2], [0, 1], {...clamp, easing: inOut}));
  return (
    <AbsoluteFill style={{background: '#0B0C0E'}}>
      {/* Сетка точек — дальний план, едет медленнее карты. */}
      <AbsoluteFill style={{transform: `translate(${VIEW.x - c.x * c.z * 0.55}px, ${VIEW.y - c.y * c.z * 0.55}px)`, width: 6000, height: 7000, left: -1500, top: -1500,
        backgroundImage: 'radial-gradient(rgba(255,255,255,.13) 2.4px, transparent 2.6px)', backgroundSize: '64px 64px'}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 3200, height: 3600, transformOrigin: '0 0',
        transform: `translate(${VIEW.x - c.x * c.z}px, ${VIEW.y - c.y * c.z}px) scale(${c.z})`}}>
        {/* Свет зон — часть мира: цвет меняется там, где лежит содержимое. */}
        <div style={{position: 'absolute', left: -700, top: -600, width: 2840, height: 2700, background: 'radial-gradient(closest-side, rgba(255,122,47,.34), rgba(255,122,47,.12) 55%, transparent)'}} />
        <div style={{position: 'absolute', left: 700, top: 800, width: 2400, height: 2400, background: 'radial-gradient(closest-side, rgba(61,237,195,.26), rgba(61,237,195,.08) 55%, transparent)'}} />
        <div style={{position: 'absolute', left: -600, top: 1900, width: 2640, height: 2000, background: 'radial-gradient(closest-side, rgba(150,160,172,.22), rgba(150,160,172,.06) 55%, transparent)'}} />

        {/* Пунктиры рисуются по ходу речи. */}
        <DashedPath id="d-ig" d="M 330 300 L 450 300" progress={draw(19.15, 19.5)} w={3200} h={3600} />
        <DashedPath id="d-bot" d="M 990 300 L 1110 300" progress={draw(19.62, 19.95)} w={3200} h={3600} />
        <DashedPath id="d-k1" d="M 720 1410 C 100 1450 100 2080 180 2080" progress={draw(26.2, 26.8)} w={3200} h={3600} />
        <DashedPath id="d-k2" d="M 1900 2500 C 1300 2640 1080 2500 1060 2145" progress={draw(34.45, 35.1)} w={3200} h={3600} />
        <DashedPath id="d-or" d="M 1050 1900 C 1350 1900 1420 1500 1545 1500" progress={draw(27.7, 28.3)} w={3200} h={3600} />
        <DashedPath id="d-srv" d="M 720 1990 L 720 2520" progress={draw(42.15, 42.8)} w={3200} h={3600} />

        {/* Зона 1 — Zernio: Instagram → Zernio → бот. Окно браузера раскрывается из узла почти на всю ширину кадра,
            записи идут целиком, как владелец кликал по шагам: подключение, затем API-ключ. */}
        {place({x: 720, y: 300}, <Pop at={A(16.6)} tilt={2}><Node n="1" label="Zernio" icon="brand/zernio.png" /></Pop>)}
        {place({x: 250, y: 300}, <Pop at={A(19.1)}><Circle><Img src={staticFile('brand/instagram.svg')} style={{width: 78, height: 78}} /></Circle></Pop>)}
        {place({x: 1190, y: 300}, <Pop at={A(19.6)}><Circle bg={color.mint}><span style={{fontFamily: 'Manrope', fontWeight: 800, fontSize: 44, color: color.mintInk}}>бот</span></Circle></Pop>)}
        {place({x: 720, y: 395}, <BlurIn text="бесплатно" at={A(17.95)} size={type.body * 1.15} weight={700} color={color.dim} />)}
        {place({x: 720, y: WIN1.y + WIN_H / 2}, (
          <Expand at={A(17.45)} fade={[27.4, 28.4]} t={t}>
            <div style={{position: 'absolute', inset: 0, opacity: 1 - interpolate(t, [22.65, 22.9], [0, 1], clamp)}}>
              <Sequence from={seq(17.7)} layout="none">
                <BrowserCard w={WIN_W} h={WIN_H} url="zernio.com · Connections" src="reels/direct/zernio-connect.mp4" srcW={1920} srcH={1040} trim={2.8} rate={2.35}
                  crops={[{at: 0, x: 0, y: 0, w: 1920}]} />
              </Sequence>
            </div>
            <div style={{position: 'absolute', inset: 0, opacity: interpolate(t, [22.65, 22.9], [0, 1], clamp)}}>
              <Sequence from={seq(22.7)} layout="none">
                <BrowserCard w={WIN_W} h={WIN_H} url="zernio.com · API Keys" src="reels/direct/zernio-key.mp4" srcW={1920} srcH={934} trim={1.6} rate={2.5}
                  crops={[{at: 0, x: 196, y: 0, w: 1724}]}
                  masks={[{x: 1080, y: 256, w: 700, h: 96, fill: '#F2F4F3', label: 'sk_•••••••••••••••••••', from: 8.6}]} />
              </Sequence>
            </div>
          </Expand>
        ))}

        {/* Узел Claude — центр схемы, к нему летят оба ключа. */}
        {place(HUB, <Pop at={A(26.7)} tilt={2}><div style={{transform: `scale(${hubPulse})`}}><Pill label="Claude Code" icon="brand/claude.svg" material="frosted" size={type.label * 1.25} level={3} /></div></Pop>)}
        {place(k1, <Pop at={A(25.35)}><div style={keyStyle(fly1)}><KeyPill label="Zernio" /></div></Pop>)}

        {/* Зона 2 — OpenRouter: настоящая запись владельца. Credits и оплата — под «пополняешь баланс»,
            создание ключа — под «в разделе API Keys». Почта, карта и ключ размыты в самом файле
            (videos/reels-19-direct-assistant/tools/blur_private.py), плашка ошибки оплаты справа внизу обрезана кадрированием. */}
        {place({x: 1900, y: 1500}, <Pop at={A(27.8)} tilt={2}><Node n="2" label="OpenRouter" icon="brand/openrouter.svg" /></Pop>)}
        {place({x: 1900, y: WIN2.y + WIN_H / 2}, (
          <Expand at={A(28.3)} fade={[34.4, 35.0]} t={t}>
            <div style={{position: 'absolute', inset: 0, opacity: 1 - interpolate(t, [32.0, 32.1], [0, 1], clamp)}}>
              <Sequence from={seq(28.5)} layout="none">
                <BrowserCard w={WIN_W} h={WIN_H} url="openrouter.ai · Credits" src="reels/direct/openrouter.mp4" srcW={1920} srcH={1040} trim={0} rate={1.65}
                  crops={[{at: 0, x: 0, y: 0, w: 1920}]} />
              </Sequence>
            </div>
            <div style={{position: 'absolute', inset: 0, opacity: interpolate(t, [32.0, 32.1], [0, 1], clamp)}}>
              <Sequence from={seq(32.0)} layout="none">
                <BrowserCard w={WIN_W} h={WIN_H} url="openrouter.ai · API Keys" src="reels/direct/openrouter.mp4" srcW={1920} srcH={1040} trim={5.9} rate={2.75}
                  crops={[{at: 0, x: 0, y: 0, w: 1740}]} />
              </Sequence>
            </div>
          </Expand>
        ))}
        {place(k2, <Pop at={A(33.95)}><div style={keyStyle(fly2)}><KeyPill label="OpenRouter" tone="mint" /></div></Pop>)}

        {/* Зона 3 — сервер за $2: 3D-стойка, бот едет по пунктиру из Claude, светодиоды загораются. */}
        {place({x: 720, y: 2420}, <Pop at={A(36.3)} tilt={2}><Node n="3" label="сервер" /></Pop>)}
        {place({x: 720, y: 2760}, <RiseIn at={A(36.5)} from={500}><Server3D w={560} h={400} on={serverOn} /></RiseIn>)}
        {place({x: 1180, y: 2700}, <Pop at={A(38.9)}><Sticker head="в месяц" value="$2" w={260} /></Pop>)}
        {t > 42.5 && t < 43.3 ? place(bot, <Circle size={110} bg={color.mint}><span style={{fontFamily: 'Manrope', fontWeight: 800, fontSize: 40, color: color.mintInk}}>бот</span></Circle>) : null}
        {place({x: 720, y: 3050}, <Pop at={A(43.25)}><Pill label="бот работает" tone="mint" size={type.label} /></Pop>)}

        {/* Итог под сервером: ассистент отвечает человеку, заявка падает в Telegram. */}
        {place({x: 720, y: 3200}, (
          <Pop at={A(44.65)} tilt={2}>
            <div style={{padding: '26px 40px', borderRadius: 48, borderBottomRightRadius: 14, background: `linear-gradient(180deg, #8FFBDD 0%, ${color.mint} 60%, #25C9A0 100%)`,
              fontFamily: 'Manrope', fontWeight: 700, fontSize: 58, color: color.mintInk, whiteSpace: 'nowrap', boxShadow: `inset 0 2px 0 rgba(255,255,255,.45), ${elevation[2]}`}}>Расскажу и запишу вас на курс</div>
          </Pop>
        ))}
        {place({x: 720, y: 3400}, <div style={{width: 960, transform: 'scale(1.15)'}}><Toast at={A(45.7)} icon="brand/telegram.svg" title="Новая заявка" body="горячий клиент · обучение" w={960} /></div>)}
      </div>
    </AbsoluteFill>
  );
};
