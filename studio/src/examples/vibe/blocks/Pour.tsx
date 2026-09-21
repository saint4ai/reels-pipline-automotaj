import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile} from 'remotion';
import {GlassEnv} from '../../../kit/liquid/env';
import {LiquidPanel} from '../../../kit/liquid/LiquidPanel';
import {NightStage, type Spot} from '../../../kit/liquid/stage';
import {BrowserCard} from '../../../kit/BrowserCard';
import {ChatThread, DmHeader, PhoneMock} from '../../../kit/Phone';
import {Headline} from '../Headline';
import {Chip, clamp, easeIn, Glass, iv, Label, M, MI, O, out, TXT} from './common';

// Блок «Агент умеет практически всё — собрать твой продукт целиком: сайт, приложение, AI-менеджера по продажам, автоматизации».
// Пересборка 20.09.2026 по разбору QA (Александр: «не понимаю, что там говорится»): каждое существительное — узнаваемый продукт
// в полный рост ровно на своём слове. Стеклянный промпт печатает задачу и вспыхивает на Enter → проливается мятной струёй вниз →
// на слове налив поднимается снизу, и форма становится продуктом (сайт — настоящий скрин onai.academy, приложение, директ с ИИ,
// схема на настоящих логотипах) → после слова продукт уменьшается и встаёт на стеклянную полку. К концу фразы на полке четыре продукта.
export const POUR_DUR = 6.4;
const P = {site: 3.3, app: 3.85, ai: 4.45, flow: 5.1};
// полёт на полку начинается раньше следующего слова: к моменту слова путь свободен (правка QA 20.09)
const DOCK = {site: 3.63, app: 4.23, ai: 4.88, flow: 5.95};
const FILL = 0.3;
// сцена продуктов слева, полка — вертикальная стеклянная колонка справа (4 ячейки по 230 px)
const STAGE = {x: 90, w: 1040, cx: 610, cy: 930};
const SHELF = {x: 1150, y: 470, w: 200, h: 920};
const slot = (i: number) => ({x: SHELF.x + SHELF.w / 2, y: SHELF.y + SHELF.h / 8 + (i * SHELF.h) / 4});
const SPOTS: Spot[] = [{x: 260, y: -120, angle: 14, spread: 15, power: 0.9}, {x: 1180, y: -140, angle: -12, spread: 14, power: 0.8, color: '214,255,245'}];
const SITE = {w: 1040, h: 732};

// Продукт: наливается снизу (маска по уровню + светящаяся кромка), держится, потом по дуге вправо летит в свою ячейку.
const Product: React.FC<{t: number; at: number; dock: number; i: number; w: number; h: number; label: string; children: React.ReactNode}> = ({t, at, dock, i, w, h, label, children}) => {
  if (t < at - 0.05) return null;
  const fill = iv(t, at, at + FILL, 0, 1, out);
  const d = iv(t, dock, dock + 0.3, 0, 1, (x) => 1 - (1 - x) ** 3);
  if (d >= 1) return null; // сел в ячейку — дальше его показывает полка
  const s = slot(i);
  const target = Math.min(180 / w, 200 / h);
  // дуга в сторону полки: сначала вправо, потом к ячейке — не через центр сцены
  const x = STAGE.cx + (s.x - STAGE.cx) * Math.min(1, d * 1.35), y = STAGE.cy + (s.y - STAGE.cy) * d * d;
  const sc = 1 + (target - 1) * d;
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `scale(${sc})`, zIndex: 10}}>
      <div style={{position: 'absolute', inset: 0, clipPath: `inset(${(1 - fill) * 100}% -60px -60px -60px)`}}>{children}</div>
      {fill > 0 && fill < 1 && <div style={{position: 'absolute', left: -20, right: -20, top: h * (1 - fill) - 6, height: 12, borderRadius: 6,
        background: `linear-gradient(90deg, transparent, ${M}, #FFFFFF, ${M}, transparent)`, boxShadow: `0 0 30px ${M}`}} />}
      <div style={{position: 'absolute', left: 0, top: -100, opacity: fill * (1 - iv(t, dock, dock + 0.08))}}><Chip tone="mint" size={60}>{label}</Chip></div>
    </div>
  );
};

// Кольцо активности — и на экране телефона, и крупной карточкой рядом.
const Rings: React.FC<{k: number; s: number}> = ({k, s}) => (
  <svg width={s} height={s} viewBox="0 0 300 300">
    {[[130, O, 0.8], [98, M, 0.62], [66, '#F2F3F5', 0.9]].map(([r, c, v], i) => (
      <g key={i}>
        <circle cx={150} cy={150} r={r as number} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={24} />
        <circle cx={150} cy={150} r={r as number} fill="none" stroke={c as string} strokeWidth={24} strokeLinecap="round" strokeDasharray={`${2 * Math.PI * (r as number) * (v as number) * k} 9999`} transform="rotate(-90 150 150)" />
      </g>
    ))}
  </svg>
);
const Plate: React.FC<{s: number}> = ({s}) => (
  <svg width={s} height={s} viewBox="0 0 40 40"><circle cx={20} cy={20} r={17} fill="#F2F3F5" /><circle cx={14} cy={16} r={5} fill={O} /><circle cx={25} cy={15} r={4} fill={M} /><path d="M12 26 h16" stroke="#2A2D32" strokeWidth={3} strokeLinecap="round" /></svg>
);
const TrainerScreen: React.FC<{k: number}> = ({k}) => (
  <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#15171A,#0B0C0E)', padding: '130px 28px 30px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
    <Label size={48} weight={800}>Тренер · ИИ</Label>
    <Rings k={k} s={340} />
    <div style={{display: 'flex', alignItems: 'center', gap: 18}}><Plate s={100} /><Chip tone="mint" size={46}>питание</Chip></div>
  </div>
);

// Телефон с наклоном и параллаксом + крупная деталь интерфейса стеклянной карточкой 1:1 справа от него.
const PHONE = {w: 460, h: 920};
const PhoneHero: React.FC<{t: number; at: number; detail: React.ReactNode; children: React.ReactNode}> = ({t, at, detail, children}) => {
  const tilt = 10 + Math.sin((t - at) * 1.3) * 2;
  const card = iv(t, at + 0.12, at + 0.42, 0, 1, out);
  return (
    <div style={{position: 'relative', width: 1040, height: 920, perspective: 1600}}>
      <div style={{position: 'absolute', left: 20, top: 0, transform: `rotateY(${tilt}deg) translateY(${Math.sin((t - at) * 1.6) * 8}px)`}}>
        <PhoneMock w={PHONE.w} h={PHONE.h}>{children}</PhoneMock>
      </div>
      <div style={{position: 'absolute', left: 540, top: 220, opacity: card, transform: `translateX(${(1 - card) * -80}px) translateY(${Math.sin((t - at) * 1.6 + 1) * -10}px)`}}>
        <Glass w={480} h={480} r={64} style={{boxShadow: `0 40px 80px rgba(0,0,0,.5), 0 0 60px ${M}33`}}>{detail}</Glass>
      </div>
    </div>
  );
};

// Схема автоматизации на настоящих логотипах: Instagram → Claude → Telegram и amoCRM, по связям бежит поток.
const NODES = [{id: 'instagram', x: 140, y: 340, src: 'brand/instagram.svg'}, {id: 'claude', x: 520, y: 340, src: 'brand/claude.svg'},
  {id: 'telegram', x: 900, y: 160, src: 'brand/telegram.svg'}, {id: 'amocrm', x: 900, y: 520, src: 'brand/amocrm.png'}];
const EDGES: [number, number][] = [[0, 1], [1, 2], [1, 3]];
const FlowScheme: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', inset: 0}}>
    <svg width={1040} height={680} style={{position: 'absolute', inset: 0}}>
      {EDGES.map(([a, b], i) => {
        const A = NODES[a], B = NODES[b];
        return <path key={i} d={`M ${A.x} ${A.y} C ${(A.x + B.x) / 2} ${A.y}, ${(A.x + B.x) / 2} ${B.y}, ${B.x} ${B.y}`} fill="none" stroke={M} strokeWidth={7} strokeDasharray="18 16" strokeDashoffset={-t * 120} opacity={0.85} />;
      })}
    </svg>
    {EDGES.map(([a, b], i) => Array.from({length: 3}, (_, k) => {
      const A = NODES[a], B = NODES[b], u = ((t * 0.9 + k / 3 + i * 0.2) % 1);
      const mx = (A.x + B.x) / 2, bx = (1 - u) ** 3 * A.x + 3 * (1 - u) ** 2 * u * mx + 3 * (1 - u) * u * u * mx + u ** 3 * B.x;
      const by = (1 - u) ** 3 * A.y + 3 * (1 - u) ** 2 * u * A.y + 3 * (1 - u) * u * u * B.y + u ** 3 * B.y;
      return <span key={`${i}-${k}`} style={{position: 'absolute', left: bx - 13, top: by - 13, width: 26, height: 26, borderRadius: '50%', background: '#FFFFFF', boxShadow: `0 0 22px ${M}`}} />;
    }))}
    {NODES.map((n) => (
      <div key={n.id} style={{position: 'absolute', left: n.x - 120, top: n.y - 120}}>
        <Glass w={240} h={240} r={64}><div style={{display: 'grid', placeItems: 'center', width: '100%', height: '100%'}}><Img src={staticFile(n.src)} style={{width: 132, height: 132, objectFit: 'contain'}} /></div></Glass>
      </div>
    ))}
  </div>
);

// Бледные силуэты будущих продуктов в ячейках полки; загораются, когда продукт сел.
const Silhouette: React.FC<{i: number; lit: number}> = ({i, lit}) => {
  const c = lit > 0.5 ? M : 'rgba(255,255,255,.35)';
  return (
    <svg width={150} height={150} viewBox="0 0 40 40" style={{opacity: 0.55 + lit * 0.45}}>
      {i === 0 && <><rect x={3} y={8} width={34} height={24} rx={3} fill="none" stroke={c} strokeWidth={2} /><path d="M3 13 H37" stroke={c} strokeWidth={2} /></>}
      {(i === 1 || i === 2) && <><rect x={12} y={3} width={16} height={34} rx={4} fill="none" stroke={c} strokeWidth={2} />{i === 2 && <path d="M15 22 h10 M15 27 h7" stroke={c} strokeWidth={2} />}{i === 1 && <circle cx={20} cy={18} r={5} fill="none" stroke={c} strokeWidth={2} />}</>}
      {i === 3 && <><circle cx={8} cy={20} r={4} fill="none" stroke={c} strokeWidth={2} /><circle cx={20} cy={20} r={4} fill="none" stroke={c} strokeWidth={2} /><circle cx={32} cy={11} r={4} fill="none" stroke={c} strokeWidth={2} /><circle cx={32} cy={29} r={4} fill="none" stroke={c} strokeWidth={2} /><path d="M12 20 H16 M24 18 L28 13 M24 22 L28 27" stroke={c} strokeWidth={2} /></>}
    </svg>
  );
};

// Миниатюра севшего продукта (≥ 180 px): упрощённая копия героя.
const Thumb: React.FC<{i: number; t: number}> = ({i, t}) => {
  if (i === 0) return <div style={{width: 180, height: 127, borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,.5)'}}><Img src={staticFile('reels/vibe/site-hero.png')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'left top'}} /></div>;
  if (i === 1) return <div style={{width: 180, height: 180, borderRadius: 40, background: '#101214', display: 'grid', placeItems: 'center', boxShadow: '0 8px 20px rgba(0,0,0,.5)'}}><Rings k={1} s={150} /></div>;
  if (i === 2) return <div style={{width: 180, height: 180, borderRadius: 40, background: '#101214', display: 'grid', placeItems: 'center', boxShadow: '0 8px 20px rgba(0,0,0,.5)'}}>
    <div style={{padding: '12px 16px', borderRadius: 24, background: M, fontFamily: 'Manrope', fontWeight: 800, fontSize: 30, color: MI, lineHeight: 1.15, width: 130}}>ИИ отвечает</div></div>;
  return <div style={{width: 180, height: 180, borderRadius: 40, background: '#101214', display: 'grid', placeItems: 'center', boxShadow: '0 8px 20px rgba(0,0,0,.5)'}}>
    <div style={{display: 'flex', gap: 10}}>{['instagram', 'claude', 'telegram'].map((n) => <Img key={n} src={staticFile(`brand/${n}.svg`)} style={{width: 44, height: 44}} />)}</div></div>;
};

export const PourScene: React.FC<{t: number}> = ({t}) => {
  const PROMPT = 'Собери мой продукт целиком';
  const typed = Math.round(interpolate(t, [0.2, 1.3], [0, PROMPT.length], clamp));
  const enter = interpolate(t, [1.35, 1.45, 1.9], [0, 1, 0.35], clamp);
  const up = iv(t, 1.9, 2.5);
  const pillY = 580 + (190 - 580) * up;
  // форма — силуэт будущего сайта в полный размер: стеклянный контур окна браузера, жидкость наливает именно его
  const moldVis = iv(t, 0.4, 0.9) * (1 - iv(t, P.site + 0.2, P.site + 0.35));
  const level = interpolate(t, [2.5, 3.3], [0, 1], clamp);
  const shelf = iv(t, DOCK.site - 0.05, DOCK.site + 0.2);
  const streamOn = iv(t, 2.35, 2.55) * (1 - iv(t, 6.0, 6.3));
  const moldTop = STAGE.cy - SITE.h / 2, moldLeft = STAGE.cx - SITE.w / 2;
  const streamTop = pillY + 150, streamBot = Math.max(streamTop, moldTop + SITE.h * (1 - level) + 20);
  const bg = () => <NightStage t={t} spots={SPOTS} dust={70} floor={1460} />;
  const sat = (i: number) => iv(t, [DOCK.site, DOCK.app, DOCK.ai, DOCK.flow][i] + 0.26, [DOCK.site, DOCK.app, DOCK.ai, DOCK.flow][i] + 0.34);
  const wave = (x: number) => Math.sin(x / 90 + t * 5) * 10 + Math.sin(x / 40 - t * 7) * 4;
  return (
    <AbsoluteFill>
      <GlassEnv bg={bg}>
        {/* полка: стекло, появляется с первым продуктом; в ячейках силуэты, которые загораются */}
        <LiquidPanel x={SHELF.x} y={SHELF.y} w={SHELF.w} h={SHELF.h} r={56} material="frosted" tone="dark" opacity={shelf} moon={0.5} name="shelf">
          <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
            {[0, 1, 2, 3].map((i) => <div key={i} style={{flex: 1, display: 'grid', placeItems: 'center', borderBottom: i < 3 ? '2px solid rgba(255,255,255,.08)' : undefined}}>
              {sat(i) > 0 ? <div style={{transform: `scale(${0.8 + 0.2 * sat(i)})`}}><Thumb i={i} t={t} /></div> : <Silhouette i={i} lit={0} />}
            </div>)}
          </div>
        </LiquidPanel>
        <LiquidPanel x={90} y={pillY} w={1260} h={150} r="pill" material="frosted" tone={enter > 0.5 ? 'mint' : 'dark'} moon={0.5} name="prompt"
          style={{boxShadow: `0 0 ${enter * 120}px ${M}, 0 30px 60px rgba(0,0,0,.5)`, zIndex: 20}}>
          <div style={{display: 'flex', alignItems: 'center', height: '100%', padding: '0 34px 0 48px', gap: 24}}>
            <Img src={staticFile('brand/claude.svg')} style={{width: 64, height: 64, flex: 'none'}} />
            <span style={{fontFamily: 'Manrope', fontWeight: 700, fontSize: 60, color: enter > 0.5 ? MI : TXT, whiteSpace: 'nowrap'}}>
              {PROMPT.slice(0, typed)}{typed < PROMPT.length && <span style={{opacity: Math.floor(t * 3) % 2 ? 1 : 0}}>|</span>}
            </span>
            <span style={{marginLeft: 'auto', width: 84, height: 84, borderRadius: '50%', background: enter > 0.1 ? MI : 'rgba(255,255,255,.18)', display: 'grid', placeItems: 'center', flex: 'none'}}>
              <svg width={44} height={44} viewBox="0 0 24 24"><path d="M12 19 V5 M5 12 L12 5 L19 12" fill="none" stroke={enter > 0.1 ? M : '#F2F3F5'} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </div>
        </LiquidPanel>
      </GlassEnv>
      {/* форма-силуэт окна браузера: пустое стекло с контуром, жидкость поднимается внутри */}
      {moldVis > 0 && (
        <div style={{position: 'absolute', left: moldLeft, top: moldTop, width: SITE.w, height: SITE.h, opacity: moldVis}}>
          <Glass w={SITE.w} h={SITE.h} r={40} style={{boxShadow: `0 30px 70px rgba(0,0,0,.5), inset 0 0 0 3px ${M}66`}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 66, borderBottom: `3px solid ${M}55`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 26px'}}>
              {[0, 1, 2].map((i) => <span key={i} style={{width: 20, height: 20, borderRadius: '50%', border: `3px solid ${M}88`}} />)}
              <span style={{marginLeft: 20, flex: 1, height: 36, borderRadius: 18, border: `3px solid ${M}55`}} />
            </div>
            <svg width={SITE.w} height={SITE.h} style={{position: 'absolute', inset: 0, borderRadius: 40}}>
              <defs><linearGradient id="pourLiq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B6FFEC" /><stop offset="0.3" stopColor={M} /><stop offset="1" stopColor="#0F6E5A" /></linearGradient>
                <clipPath id="pourClip"><rect x={0} y={0} width={SITE.w} height={SITE.h} rx={40} /></clipPath></defs>
              <g clipPath="url(#pourClip)">
                <path d={`M 0 ${SITE.h} ${Array.from({length: 27}, (_, k) => { const x = k * 40; return `L ${x} ${SITE.h * (1 - level) + wave(x)}`; }).join(' ')} L ${SITE.w} ${SITE.h} Z`} fill="url(#pourLiq)" opacity={0.92} />
              </g>
            </svg>
          </Glass>
        </div>
      )}
      {/* мятная струя из промпта в форму */}
      <div style={{position: 'absolute', left: STAGE.cx - 22, top: streamTop, width: 44, height: Math.max(0, streamBot - streamTop), borderRadius: 22, opacity: streamOn * (1 - iv(t, P.site, P.site + 0.25)),
        background: `repeating-linear-gradient(180deg, ${M} 0 60px, #B6FFEC 60px 80px, ${M} 80px 140px)`, backgroundPosition: `0 ${t * 900}px`, boxShadow: `0 0 40px ${M}`, zIndex: 3}} />
      <div style={{position: 'absolute', left: 70, top: 300, opacity: 1 - up}}><Headline text="Агент умеет практически всё" at={-0.3} size={112} width={1300} /></div>
      <Product t={t} at={P.site} dock={DOCK.site} i={0} w={SITE.w} h={SITE.h} label="сайт">
        <BrowserCard w={SITE.w} h={SITE.h} url="onai.academy" src="reels/vibe/site-hero.png" srcW={2560} srcH={1640} trim={0} rate={1} crops={[{at: 0, x: 0, y: 0, w: 2560}]} />
      </Product>
      <Product t={t} at={P.app} dock={DOCK.app} i={1} w={1040} h={920} label="приложение">
        <PhoneHero t={t} at={P.app} detail={<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16}}>
          <Rings k={iv(t, P.app + 0.15, P.app + 0.6, 0, 1, out)} s={300} /><Chip tone="mint" size={52}>ИИ · питание</Chip></div>}>
          <TrainerScreen k={iv(t, P.app + 0.1, P.app + 0.5, 0, 1, out)} />
        </PhoneHero>
      </Product>
      <Product t={t} at={P.ai} dock={DOCK.ai} i={2} w={1040} h={920} label="ИИ-менеджер">
        <PhoneHero t={t} at={P.ai} detail={<div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '0 44px', gap: 26}}>
          <div style={{alignSelf: 'flex-start', padding: '20px 28px', borderRadius: 34, borderBottomLeftRadius: 10, background: 'rgba(255,255,255,.14)', fontFamily: 'Manrope', fontWeight: 600, fontSize: 46, color: TXT}}>Сколько стоит?</div>
          <div style={{alignSelf: 'flex-end', padding: '22px 30px', borderRadius: 34, borderBottomRightRadius: 10, background: M, fontFamily: 'Manrope', fontWeight: 800, fontSize: 50, color: MI, lineHeight: 1.15}}>Расскажу!<br />Пришлю программу</div>
        </div>}>
          <DmHeader name="ИИ-менеджер" status="онлайн" w={428} />
          <ChatThread w={428} h={700} size={42} msgs={[
            {from: 'in', at: 0, text: 'Сколько стоит обучение?'},
            {from: 'out', at: Math.round((P.ai + 0.3) * 30), typing: 6, text: 'Расскажу! Пришлю программу'},
          ]} />
        </PhoneHero>
      </Product>
      <Product t={t} at={P.flow} dock={DOCK.flow} i={3} w={1040} h={680} label="автоматизации">
        <FlowScheme t={t} />
      </Product>
    </AbsoluteFill>
  );
};
