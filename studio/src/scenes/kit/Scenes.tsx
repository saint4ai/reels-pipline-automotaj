import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {color, DepthText, elevation, glassFill, GlassLayers, Pill, textDepth, type} from '../../ds';
import {Backdrop, BlurIn, ChatThread, Cursor, DmHeader, ink, PhoneMock, Pop, Porthole, portholeWindow, RiseIn, Sticker, Toast, Toggle, toggleKnob} from '../../kit';
import {DashedPath} from '../../components/DashedPath';
import {W} from '../../theme';

// Демо библиотеки на теме ролика «ИИ-ассистент в директе». Графика живёт в полосе y 140…1470:
// ниже субтитры (две строки 1498…1648) и карточка спикера (верх 1701).
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const out = Easing.bezier(0.16, 1, 0.3, 1);
const at = (x: number, y: number, w?: number): React.CSSProperties => ({position: 'absolute', left: x, top: y, width: w});

// 1 · Хук на чёрном: заголовок уезжает вверх, снизу поднимается иллюминатор, в окне закатное небо следующей сцены.
export const PORTHOLE = {x: 440, y: 400, w: 560, h: 780};
export const PORTHOLE_WINDOW = portholeWindow(PORTHOLE.x, PORTHOLE.y, PORTHOLE.w, PORTHOLE.h);
export const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const lift = interpolate(frame, [3, 15], [560, 0], {...clamp, easing: inOut});
  return (
    <AbsoluteFill>
      <Backdrop kind="black" />
      <div style={{...at(0, 220 + lift, W)}}><BlurIn text="Пока я записываю ролик," at={2} size={type.label * 1.35} color={ink.black} /></div>
      <RiseIn at={11} from={900} style={at(PORTHOLE.x, PORTHOLE.y)}>
        <Porthole w={PORTHOLE.w} h={PORTHOLE.h}>
          <Backdrop kind="sky" />
          <Pop at={18} style={{position: 'absolute', left: 73, top: 150, width: 260}}>
            <Sticker head="в месяц" value="$7" w={260} />
          </Pop>
        </Porthole>
      </RiseIn>
      <div style={at(0, 1250, W)}><BlurIn text="мой директ работает сам" at={30} size={type.label} weight={600} color="#C9CDD1" /></div>
    </AbsoluteFill>
  );
};

// 2 · Небо: макет телефона с директом, сообщения приходят, ассистент печатает и отвечает, голосовое тоже.
export const SceneDirect: React.FC = () => {
  const phoneW = 760;
  return (
    <AbsoluteFill>
      <Backdrop kind="sky" />
      <div style={at(0, 170, W)}><BlurIn text="Отвечает ассистент" at={10} size={type.label * 1.4} weight={800} color={ink.sky} /></div>
      {/* Телефон выезжает из-за линии над субтитрами и обрезается мягкой маской, под карточку не заходит. */}
      <div style={{...at(0, 0, W), height: 1470, overflow: 'hidden', WebkitMaskImage: 'linear-gradient(180deg, #000 88%, transparent 100%)'}}>
        <RiseIn at={14} from={1100} style={at((W - phoneW) / 2, 360)}>
          <PhoneMock w={phoneW} h={1560}>
            <DmHeader name="Марат" status="в сети" w={phoneW} />
            <ChatThread w={phoneW - 42} h={700} msgs={[
              {from: 'in', at: 30, text: 'Сколько стоит обучение?'},
              {from: 'out', at: 56, typing: 14, text: 'Расскажу! А какой у вас опыт с ИИ?'},
              {from: 'in', at: 78, voice: '0:07'},
              {from: 'out', at: 104, typing: 12, text: 'Понял вас. Оставить заявку на разбор?'},
            ]} />
          </PhoneMock>
        </RiseIn>
      </div>
    </AbsoluteFill>
  );
};

// 3 · Цифра на графите: одна крупная величина с глубиной и подпись.
export const ScenePrice: React.FC = () => (
  <AbsoluteFill>
    <Backdrop kind="graphite" />
    <div style={{...at(0, 480, W), display: 'flex', justifyContent: 'center'}}>
      <RiseIn at={6} from={260}><DepthText size={type.figure * 1.2} tone="mint">≈1 ¢</DepthText></RiseIn>
    </div>
    <div style={at(0, 900, W)}><BlurIn text="за один ответ клиенту" at={14} size={type.label * 1.2} weight={700} color={ink.graphite} /></div>
  </AbsoluteFill>
);

// 4 · Мятное свечение: герой сцены — настоящий логотип инструмента. Текст сверху, где фон тёмный.
const CLAUDE_NODE = {x: W / 2, y: 820};
export const SceneBuilder: React.FC = () => (
  <AbsoluteFill>
    <Backdrop kind="mint" />
    <div style={{...at(0, 240, W), display: 'flex', justifyContent: 'center'}}>
      <RiseIn at={8} from={200}><DepthText size={type.headline * 0.8}>0 строк кода</DepthText></RiseIn>
    </div>
    <div style={{...at(0, CLAUDE_NODE.y - 70, W), display: 'flex', justifyContent: 'center'}}>
      <Pop at={16} tilt={3}><Pill label="собрал Claude Code" icon="brand/claude.svg" material="frosted" size={type.label * 1.15} level={3} /></Pop>
    </div>
  </AbsoluteFill>
);

// 5 · Схема работы — режим «холст»: чёрная карта, узлы с логотипами, пунктир рисуется, камера едет вниз.
// Прошлый узел остаётся в кадре якорем, фон-сетка движется медленнее узлов (параллакс 0,55).
const NODES = [
  {label: 'Instagram', icon: 'brand/instagram.svg', note: 'директ и комментарии'},
  {label: 'Zernio', icon: 'brand/zernio.png', note: 'официальный API Meta'},
  {label: 'Cloudflare', icon: 'brand/cloudflare.svg', note: 'сервер, бесплатно'},
  {label: 'DeepSeek', icon: 'brand/deepseek.svg', note: 'мозги через OpenRouter'},
  {label: 'Telegram', icon: 'brand/telegram.svg', note: 'заявки мне'},
];
const STEP = 370, TOP = 230;
// Точка, в которую сжимается прошлая сцена (shrinkTo): первый узел схемы появляется ровно там.
export const SCHEME_FIRST = {x: W / 2, y: TOP + 50};
export const SceneScheme: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = interpolate(frame, [56, 118], [0, 420], {...clamp, easing: inOut});
  return (
    <AbsoluteFill>
      <Backdrop kind="black" />
      <AbsoluteFill style={{transform: `translateY(${-cam * 0.55}px)`, opacity: 0.5, height: 4200,
        backgroundImage: 'radial-gradient(rgba(255,255,255,.16) 2.4px, transparent 2.6px)', backgroundSize: '64px 64px'}} />
      {/* Без размытия на слое узлов: фильтр предка выключил бы размытие стекла у пилюль. */}
      <AbsoluteFill style={{transform: `translateY(${-cam}px)`}}>
        {NODES.slice(0, -1).map((_, i) => {
          const y0 = TOP + i * STEP + 120, y1 = TOP + (i + 1) * STEP - 10;
          const p = interpolate(frame, [2 + i * 24 + 8, 2 + i * 24 + 22], [0, 1], {...clamp, easing: out});
          return <DashedPath key={i} id={`kit-dash-${i}`} d={`M ${W / 2} ${y0} L ${W / 2} ${y1}`} progress={p} w={W} h={4000} />;
        })}
        {NODES.map((n, i) => {
          const k = interpolate(frame, [2 + i * 24, 2 + i * 24 + 12], [0, 1], {...clamp, easing: out});
          return (
            <div key={n.label} style={{...at(0, TOP + i * STEP, W), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
              opacity: k, transform: `translateY(${(1 - k) * 60}px) scale(${0.94 + k * 0.06})`, filter: `blur(${(1 - k) * 10}px)`}}>
              <Pill label={n.label} icon={n.icon} material="frosted" size={type.label} level={2} tone={i === NODES.length - 1 ? 'mint' : 'default'} />
              <span style={{fontFamily: 'Manrope', fontWeight: 600, fontSize: type.body, color: color.dim, textShadow: textDepth}}>{n.note}</span>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 6 · Белая сцена с тоглом: курсор подъезжает дугой, жмёт, ручка едет, подписи меняют вес.
export const TOGGLE_ROW = {y: 760, size: 148};
export const SceneToggle: React.FC = () => {
  const frame = useCurrentFrame();
  const on = interpolate(frame, [52, 62], [0, 1], {...clamp, easing: out});
  const press = interpolate(frame, [46, 50, 54], [0, 1, 0], clamp);
  const cy = TOGGLE_ROW.y + TOGGLE_ROW.size / 2;
  const off = W / 2 + toggleKnob(0, TOGGLE_ROW.size).dx, onX = W / 2 + toggleKnob(1, TOGGLE_ROW.size).dx;
  return (
    <AbsoluteFill>
      <Backdrop kind="white" />
      <div style={at(0, 440, W)}><BlurIn text="Кто отвечает в директе" at={6} size={type.label * 1.3} weight={800} color={ink.white} /></div>
      <div style={{...at(0, TOGGLE_ROW.y, W), filter: `blur(${interpolate(frame, [8, 18], [12, 0], clamp)}px)`, opacity: interpolate(frame, [8, 18], [0, 1], clamp)}}>
        <Toggle on={on} press={press} left="я сам" right="ассистент" size={TOGGLE_ROW.size} width={W} />
      </div>
      <div style={at(0, 1060, W)}><BlurIn text="а я записываю рилсы" at={70} size={type.label} weight={600} color="#4A4F55" /></div>
      <Cursor clicks={[48]} moves={[
        {from: [1180, 1380], to: [off + 10, cy + 12], start: 20, end: 46, bend: 0.22},
        {from: [off + 10, cy + 12], to: [onX + 10, cy + 12], start: 52, end: 62, bend: 0},
      ]} />
    </AbsoluteFill>
  );
};

// 7 · Призыв на чёрном: комментарий «агент» поднимается снизу, сверху падает уведомление директа.
export const SceneCta: React.FC = () => (
  <AbsoluteFill>
    <Backdrop kind="black" />
    <div style={{...at(170, 140), width: W - 340}}>
      <Toast at={46} icon="brand/instagram.svg" title="Директ" body="инструкция уже у тебя" w={W - 340} />
    </div>
    <div style={at(0, 460, W)}><BlurIn text="Напиши «агент»" at={6} size={type.label * 1.7} weight={800} color={ink.black} /></div>
    <RiseIn at={18} from={500} style={{...at(220, 760), width: W - 440}}>
      <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 30, padding: '34px 44px', borderRadius: 60,
        ...glassFill('clear'), boxShadow: elevation[2]}}>
        <GlassLayers radius={60} />
        <div style={{position: 'relative', width: 104, height: 104, borderRadius: '50%', flex: 'none', background: '#FFFFFF', display: 'grid', placeItems: 'center'}}>
          <Img src={staticFile('brand/instagram.svg')} style={{width: 66, height: 66}} />
        </div>
        <div style={{position: 'relative', fontFamily: 'Manrope', color: color.text, textShadow: textDepth, lineHeight: 1.2}}>
          <div style={{fontSize: type.body, fontWeight: 600, color: color.dim}}>комментарий</div>
          <div style={{fontSize: type.label * 1.15, fontWeight: 800}}>агент</div>
        </div>
      </div>
    </RiseIn>
  </AbsoluteFill>
);
