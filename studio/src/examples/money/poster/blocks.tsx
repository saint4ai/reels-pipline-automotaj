import {AbsoluteFill, Easing, Img, interpolate, staticFile} from 'remotion';
import {Barcode, BrandMark, chamfer, ChamferBox, drawBarcode, GlassStage, Grain, mono, PC, plateText, poster, TECH, toStage, type PlateDraw} from '../../../kit/poster';
import {GlassBubble, GlassLens, GlassPlane, GlassPlug, GlassTag} from './objects';

// Сценовые блоки ролика 20 в стиле «техно-постер». Каждый блок — полный кадр 1440×2560 со своей заливкой;
// верхние 1440 px — 3D-сцена со стеклом (постер нарисован в текстуру), поверх — DOM: шапки, плашки, логотипы.
export const W = 1440, SH = 1440;
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const DIST = SH / 2 / Math.tan((9 * Math.PI) / 180);
const proj = (z: number) => DIST / (DIST - z);
export const at = (x: number, y: number): React.CSSProperties => ({position: 'absolute', left: x, top: y});
const appear = (t: number, a: number, d = 0.3) => interpolate(t, [a, a + d], [0, 1], {...cl, easing: out});

export const LogoDisc: React.FC<{src: string; size: number; bg?: string}> = ({src, size, bg = PC.ink}) => (
  <span style={{display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: '50%', background: bg, flex: 'none'}}>
    <Img src={staticFile(src)} style={{width: size * 0.56, height: size * 0.56, objectFit: 'contain'}} />
  </span>
);
export const ClaudeMark: React.FC<{size: number}> = ({size}) => <BrandMark src={staticFile('brand/claude.svg')} size={size} color="#D97757" />;

// Белая плашка сервиса со срезанными углами: настоящий логотип в квадрате, название, номер.
export const ServiceChip: React.FC<{logo: string; label: string; w: number; h?: number; code?: string; k?: number; dx?: number}> = ({logo, label, w, h = 118, code, k = 1, dx = -70}) => (
  <div style={{width: w, height: h, display: 'flex', alignItems: 'center', gap: 26, paddingRight: 26, boxSizing: 'border-box', clipPath: chamfer(w, h, [0, 26, 0, 26]),
    background: PC.white, opacity: k, transform: `translateX(${(1 - k) * dx}px)`}}>
    <span style={{display: 'grid', placeItems: 'center', width: h, height: h, background: '#FFFFFF', borderRight: `3px solid ${PC.ink}`, flex: 'none'}}>
      {logo === 'claude' ? <ClaudeMark size={h * 0.58} /> : <Img src={staticFile(logo)} style={{width: h * 0.6, height: h * 0.6, objectFit: 'contain'}} />}
    </span>
    <span style={{...poster(Math.round(h * 0.54), 800, -0.02), color: PC.ink, whiteSpace: 'nowrap'}}>{label}</span>
    {code ? <span style={{marginLeft: 'auto', ...mono(48, 600), color: PC.white, background: PC.ink, padding: '8px 14px'}}>{code}</span> : null}
  </div>
);

// ---------- A · серый плакат ----------
export const BlockA: React.FC<{t: number}> = ({t}) => {
  const punch = 1 + 0.045 * Math.sin(Math.PI * interpolate(t, [0.83, 1.15], [0, 1], cl));
  const plate: PlateDraw = (ctx, w, h) => {
    ctx.fillStyle = PC.grey; ctx.fillRect(0, 0, w, h);
    plateText(ctx, 'ТЫ ПЛАТИШЬ', 64, 532, 150);
    ctx.save(); ctx.translate(40, 1072); ctx.scale(punch, punch); plateText(ctx, '$20', 0, 0, 640, {track: -0.06}); ctx.restore();
    plateText(ctx, 'ЗА ПРОСТОЙ ЧАТ', 64, 1256, 142);
  };
  const tabs = ['ЧАТ', 'РЕКЛАМА', 'INSTAGRAM', 'CRM'];
  const TAB_W = [250, 340, 410, 264];
  const [bx, by] = toStage(W, SH, 1060, 880);
  return (
    <AbsoluteFill style={{background: PC.grey}}>
      <div style={at(0, 0)}><GlassStage w={W} h={SH} plate={plate}><GlassBubble t={t} x={bx} y={by} at={0.3} /></GlassStage></div>
      <div style={{...at(64, 190), width: 1312, height: 4, background: PC.ink}} />
      <div style={{...at(64, 212), width: 1312, height: 140, display: 'flex', alignItems: 'center', gap: 26}}>
        <span style={{display: 'grid', placeItems: 'center', width: 112, height: 112, borderRadius: '50%', background: PC.ink, flex: 'none'}}><ClaudeMark size={66} /></span>
        <div>
          <div style={{...poster(62, 800, -0.02), lineHeight: 1.05, color: PC.ink}}>Claude Pro</div>
          <div style={{...mono(48), color: PC.ink, marginTop: 6}}>подписка</div>
        </div>
        <div style={{marginLeft: 'auto', width: 3, height: 140, background: PC.ink}} />
        <div style={{...poster(124), color: PC.ink, marginLeft: 20}}>ЧАТ/01</div>
      </div>
      <div style={{...at(64, 370), width: 1312, height: 2, background: PC.ink}} />
      <div style={{...at(64, 1300), display: 'flex', gap: 16}}>
        {tabs.map((l, i) => {
          const k = appear(t, 2.7 + i * 0.08, 0.2);
          const on = i === 0;
          return (
            <ChamferBox key={l} w={TAB_W[i]} h={88} cut={[0, 20, 0, 20]} fill={on ? PC.ink : 'none'} stroke={PC.ink} style={{opacity: k, transform: `translateY(${(1 - k) * 24}px)`}}>
              {on ? <span style={{width: 18, height: 18, background: PC.mint}} /> : null}
              <span style={{...mono(48, 600), color: on ? PC.white : PC.ink}}>{l}</span>
            </ChamferBox>
          );
        })}
      </div>
      <div style={{...at(0, 1420), width: W, height: 2560 - 1420, background: PC.mint}} />
      <Grain />
    </AbsoluteFill>
  );
};

// ---------- B · оранжевый «ПОДКЛЮЧИ» ----------
const CHIPS_B = [{logo: 'brand/meta.svg', label: 'РЕКЛАМА', at: 4.91}, {logo: 'brand/instagram.svg', label: 'ИНСТАГРАМ', at: 5.55}, {logo: 'brand/amocrm.png', label: 'CRM', at: 6.26}];
export const BlockB: React.FC<{t: number}> = ({t}) => {
  const on = interpolate(t, [4.28, 4.4], [0, 1], cl);
  const plate: PlateDraw = (ctx, w) => {
    ctx.fillStyle = PC.orange; ctx.fillRect(0, 0, w, SH);
    plateText(ctx, 'ПОДКЛЮЧИ', 60, 420, 204, {family: TECH, weight: 800, track: -0.01});
    ctx.fillStyle = PC.ink; ctx.fillRect(64, 466, 1312, 4);
    drawBarcode(ctx, 0, 560, w, 340, 11, 5);
    ctx.fillRect(64, 944, 1312, 2);
  };
  const [px, py] = toStage(W, SH, 640, 730);
  return (
    <AbsoluteFill style={{background: PC.orange}}>
      <div style={at(0, 0)}><GlassStage w={W} h={SH} plate={plate}><GlassPlug t={t} x={px} y={py} at={4.3} /></GlassStage></div>
      <div style={{...at(64, 196), ...mono(48), color: PC.ink}}>CLAUDE / ПОДКЛЮЧЕНИЕ_</div>
      <div style={{...at(90, 606), width: 260, height: 250, clipPath: chamfer(260, 250, [0, 36, 0, 36]), background: PC.ink, display: 'grid', placeItems: 'center'}}>
        <ClaudeMark size={130} />
      </div>
      <div style={{...at(90, 870), width: 260, height: 8, background: PC.mint, transform: `scaleX(${on})`, transformOrigin: 'left'}} />
      {CHIPS_B.map((c, i) => (
        <div key={c.label} style={at(64, 990 + i * 136)}><ServiceChip logo={c.logo} label={c.label} w={700} code={`0${i + 1}`} k={appear(t, c.at - 0.05)} /></div>
      ))}
      <div style={{...at(0, 1420), width: W, height: 4, background: PC.ink}} />
      <Grain />
    </AbsoluteFill>
  );
};

// ---------- C · чёрный «ПОКАЖЕТ, ГДЕ ТЫ ТЕРЯЕШЬ ДЕНЬГИ» ----------
const funnel = (ctx: CanvasRenderingContext2D, grow: number) => {
  const rows: [string, number][] = [['РЕКЛАМА', 930], ['ЗАЯВКИ', 560], ['ПРОДАЖИ', 200]];
  rows.forEach(([l, bw], i) => {
    const y = 700 + i * 190, g = Math.min(1, Math.max(0, grow * 1.6 - i * 0.3));
    plateText(ctx, l, 64, y + 72, 48, {family: 'Martian Mono', weight: 500, color: PC.white, track: 0});
    ctx.fillStyle = PC.white; ctx.fillRect(420, y, bw * g, 110);
  });
  const lost = Math.min(1, Math.max(0, grow * 2 - 1));
  ctx.globalAlpha = lost;
  ctx.strokeStyle = PC.orange; ctx.lineWidth = 6; ctx.setLineDash([18, 12]);
  ctx.strokeRect(628, 1083, 352, 104);
  ctx.setLineDash([]);
  plateText(ctx, '−$', 804, 1166, 84, {family: TECH, weight: 800, color: PC.orange, track: 0, align: 'center'});
  ctx.globalAlpha = 1;
};
export const BlockC: React.FC<{t: number}> = ({t}) => {
  const grow = interpolate(t, [7.25, 7.95], [0, 1], {...cl, easing: out});
  const lk = interpolate(t, [7.45, 8.05], [0, 1], {...cl, easing: out});
  const lx = 1330 + (806 - 1330) * lk, ly = 1420 + (1136 - 1420) * lk;
  const plate: PlateDraw = (ctx, w, h) => {
    ctx.fillStyle = PC.ink; ctx.fillRect(0, 0, w, h);
    funnel(ctx, grow);
    ctx.save(); ctx.beginPath(); ctx.arc(lx, ly, 176, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#121416'; ctx.fillRect(lx - 180, ly - 180, 360, 360);
    ctx.translate(lx, ly); ctx.scale(1.5, 1.5); ctx.translate(-lx, -ly); funnel(ctx, grow);
    ctx.restore();
  };
  const s = proj(220);
  return (
    <AbsoluteFill style={{background: PC.ink}}>
      <div style={at(0, 0)}><GlassStage w={W} h={SH} plate={plate} shadow={0.35}><GlassLens t={t} x={(lx - W / 2) / s} y={(SH / 2 - ly) / s} /></GlassStage></div>
      <div style={{...at(64, 190), width: 1312, height: 440, clipPath: chamfer(1312, 440, [0, 70, 0, 70]), background: PC.mint, padding: '46px 54px', boxSizing: 'border-box'}}>
        <div style={{...poster(112), color: PC.mintInk}}>ПОКАЖЕТ, ГДЕ ТЫ</div>
        <div style={{...poster(112), color: PC.mintInk, marginTop: 10}}>ТЕРЯЕШЬ ДЕНЬГИ_</div>
        <div style={{position: 'absolute', left: 54, bottom: 40, ...mono(48, 600), color: PC.mintInk}}>ОТЧЁТ/01</div>
        <div style={{position: 'absolute', right: 110, bottom: 42}}><Barcode w={330} h={52} seed={5} color={PC.mintInk} /></div>
      </div>
      <Grain dark opacity={0.08} />
    </AbsoluteFill>
  );
};

// ---------- D · белый «СКИНЬ» ----------
export const BlockD: React.FC<{t: number}> = ({t}) => {
  const plate: PlateDraw = (ctx, w, h) => {
    ctx.fillStyle = PC.white; ctx.fillRect(0, 0, w, h);
    plateText(ctx, 'СКИНЬ', 720, 760, 372, {align: 'center', track: -0.05});
    plateText(ctx, 'ТОМУ, У КОГО', 720, 960, 128, {align: 'center'});
    plateText(ctx, 'CLAUDE — ПРОСТО ЧАТ', 720, 1090, 112, {align: 'center'});
  };
  return (
    <AbsoluteFill style={{background: PC.white}}>
      <div style={at(0, 0)}><GlassStage w={W} h={SH} plate={plate}><GlassPlane t={t} from={toStage(W, SH, -300, 1300)} to={toStage(W, SH, 990, 400)} at={9.05} /></GlassStage></div>
      <div style={{...at(64, 190), width: 1312, height: 4, background: PC.ink}} />
      <div style={{...at(64, 214), width: 1312, display: 'flex', alignItems: 'center'}}>
        <span style={{...mono(48, 600), color: PC.ink}}>ПЕРЕШЛИ ДРУГУ →</span>
        <span style={{marginLeft: 'auto'}}><LogoDisc src="brand/instagram.svg" size={84} bg="#FFFFFF" /></span>
      </div>
      <div style={{...at(64, 1250), width: 1312, display: 'flex', justifyContent: 'center'}}><Barcode w={520} h={70} seed={23} /></div>
      <Grain />
    </AbsoluteFill>
  );
};

// ---------- E · мятный «4 ГОДА» → «$0» и четыре коннектора ----------
const CHIPS_E = [
  {logo: 'brand/pipeboard.png', label: 'PIPEBOARD'}, {logo: 'brand/zernio.png', label: 'ZERNIO'},
  {logo: 'brand/github.svg', label: 'MCP ДЛЯ CRM'}, {logo: 'brand/metabase.svg', label: 'METABASE'},
];
export const BlockE: React.FC<{t: number}> = ({t}) => {
  const yrs = appear(t, 12.25, 0.35), impl = appear(t, 12.7, 0.35), zero = appear(t, 14.1, 0.35);
  const plate: PlateDraw = (ctx, w, h) => {
    ctx.fillStyle = PC.mint; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = yrs; plateText(ctx, '4 ГОДА', 56, 560 + (1 - yrs) * 60, 330, {color: PC.mintInk});
    ctx.globalAlpha = impl; plateText(ctx, 'ВНЕДРЯЮ ИИ В БИЗНЕС', 64, 690 + (1 - impl) * 40, 96, {color: PC.mintInk});
    ctx.globalAlpha = zero; plateText(ctx, '$0', 40, 1250 + (1 - zero) * 60, 480, {family: TECH, weight: 800, color: PC.mintInk, track: -0.02});
    ctx.globalAlpha = 1;
    ctx.fillStyle = PC.mintInk; ctx.fillRect(64, 740, 1312, 3);
  };
  const [gx, gy] = toStage(W, SH, 380, 1040);
  const label = appear(t, 13.74);
  return (
    <AbsoluteFill style={{background: PC.mint}}>
      <div style={at(0, 0)}><GlassStage w={W} h={SH} plate={plate}><GlassTag t={t} x={gx} y={gy} at={14.14} /></GlassStage></div>
      <div style={{...at(64, 190), width: 1312, height: 4, background: PC.mintInk}} />
      <div style={{...at(64, 212), width: 1312, display: 'flex', ...mono(48, 600), color: PC.mintInk}}>
        <span>ONAI / ВНЕДРЕНИЕ ИИ</span><span style={{marginLeft: 'auto'}}>2022—2026</span>
      </div>
      <div style={{...at(760, 794), ...poster(80), color: PC.mintInk, opacity: label, transform: `translateY(${(1 - label) * 30}px)`}}>4 КОННЕКТОРА</div>
      {CHIPS_E.map((c, i) => (
        <div key={c.label} style={at(760, 910 + i * 128)}><ServiceChip logo={c.logo} label={c.label} w={616} h={110} k={appear(t, 14.8 + i * 0.18)} dx={80} /></div>
      ))}
      <Grain />
    </AbsoluteFill>
  );
};

// ---------- Призыв · чёрный «НАПИШИ «ДЕНЬГИ»» ----------
const DM_LOGOS = ['brand/pipeboard.png', 'brand/zernio.png', 'brand/github.svg', 'brand/metabase.svg'];
export const BlockCta: React.FC<{t: number}> = ({t}) => {
  const head = appear(t, 63.45, 0.35);
  const plate: PlateDraw = (ctx, w, h) => {
    ctx.fillStyle = PC.ink; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = head;
    plateText(ctx, 'НАПИШИ', 56, 500 + (1 - head) * 50, 210, {color: PC.white});
    plateText(ctx, '«ДЕНЬГИ»', 46, 770 + (1 - head) * 50, 186, {family: TECH, weight: 800, color: PC.mint, track: -0.01});
    ctx.globalAlpha = 1;
  };
  const input = appear(t, 63.9, 0.4);
  const typed = 'деньги'.slice(0, Math.round(interpolate(t, [64.85, 65.35], [0, 6], cl)));
  const dm = appear(t, 65.47, 0.4), how = appear(t, 67.5, 0.35);
  // Пузырь-комментарий справа от «НАПИШИ», выше кодового слова: слово «ДЕНЬГИ» не закрывается стеклом.
  const [bx, by] = toStage(W, SH, 1175, 390);
  return (
    <AbsoluteFill style={{background: PC.ink}}>
      <div style={at(0, 0)}><GlassStage w={W} h={SH} plate={plate} shadow={0.3}><group position={[bx, by, 0]} scale={0.56}><GlassBubble t={t} x={0} y={0} at={63.7} tint="#A8F5E0" /></group></GlassStage></div>
      <div style={{...at(64, 190), width: 1312, height: 4, background: PC.white}} />
      <div style={{...at(64, 212), width: 1312, display: 'flex', alignItems: 'center', ...mono(48, 600), color: PC.white}}>
        <span>КОДОВОЕ СЛОВО</span><span style={{marginLeft: 'auto'}}><LogoDisc src="brand/instagram.svg" size={72} bg="#FFFFFF" /></span>
      </div>
      <div style={{...at(64, 880), opacity: input, transform: `translateY(${(1 - input) * 60}px)`}}>
        <div style={{...mono(48, 600), color: PC.white, marginBottom: 12}}>КОММЕНТАРИЙ</div>
        <div style={{width: 1312, height: 130, display: 'flex', alignItems: 'center', gap: 28, padding: '0 36px', boxSizing: 'border-box', clipPath: chamfer(1312, 130, [0, 30, 0, 30]), background: PC.white}}>
          <Img src={staticFile('brand/instagram.svg')} style={{width: 70, height: 70}} />
          <span style={{...poster(76, 800, -0.02), color: PC.ink}}>{typed}</span>
          <span style={{width: 6, height: 76, background: PC.ink, opacity: t < 65.5 && Math.floor(t * 2.4) % 2 === 0 ? 1 : 0}} />
        </div>
      </div>
      <div style={{...at(64, 1100), opacity: dm, transform: `translateY(${(1 - dm) * 70}px)`}}>
        <ChamferBox w={1312} h={350} cut={[0, 40, 0, 40]} fill={PC.ink} stroke={PC.mint} sw={5}>
          <div style={{width: 1312, padding: '0 44px', boxSizing: 'border-box'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18, ...mono(48, 600), color: PC.mint}}>DIRECT_<span style={{marginLeft: 'auto', color: PC.white}}>СЕЙЧАС</span></div>
            <div style={{display: 'flex', alignItems: 'center', gap: 24, marginTop: 22}}>
              <span style={{...poster(66, 800, -0.02), color: PC.white, whiteSpace: 'nowrap'}}>4 КОННЕКТОРА + ИНСТРУКЦИЯ</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 24}}>
              {DM_LOGOS.map((l, i) => {
                const k = appear(t, 65.75 + i * 0.16, 0.25);
                return <span key={l} style={{display: 'grid', placeItems: 'center', width: 92, height: 92, background: '#FFFFFF', clipPath: chamfer(92, 92, [0, 16, 0, 16]), opacity: k, transform: `scale(${0.6 + 0.4 * k})`}}><Img src={staticFile(l)} style={{width: 58, height: 58, objectFit: 'contain'}} /></span>;
              })}
              <span style={{marginLeft: 18, ...mono(48, 600), color: PC.white, opacity: how}}>ОТДАЙ ССЫЛКИ CLAUDE —<br />ОН САМ УСТАНОВИТ</span>
            </div>
          </div>
        </ChamferBox>
      </div>
      <Grain dark opacity={0.08} />
    </AbsoluteFill>
  );
};
