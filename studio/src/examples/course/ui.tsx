import {Img, staticFile} from 'remotion';
import {Video} from '@remotion/media';
import {countTo, Mark} from '../montage/parts';

// Интерфейсы ролика 22 — «по-взрослому»: единая сетка 8 px, типографика Manrope/Inter Tight, мягкие поверхности,
// графики вектором. Содержимое — из описания продуктов (onai.academy, речь), без выдуманных результатов.
// k — прогресс появления 0…1 (для лёгкой анимации содержимого внутри экрана).

export const UI = {
  bg: '#0C1015', panel: '#141A21', panel2: '#1A2129', line: 'rgba(255,255,255,.07)', text: '#E9EDF2', sub: '#8B95A3',
  mint: '#3DEDC3', mintInk: '#05231D', orange: '#FF7A2F', white: '#FFFFFF',
};
const F = 'Manrope', N = 'Inter Tight';
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// ——— Рамки устройств ———
export const Laptop: React.FC<{w: number; children: React.ReactNode}> = ({w, children}) => {
  const h = w * 0.625, bez = w * 0.018;
  return (
    <div style={{position: 'relative', width: w * 1.16, height: h + bez * 2 + w * 0.05}}>
      <div style={{position: 'absolute', left: w * 0.08, top: 0, width: w + bez * 2, height: h + bez * 2, borderRadius: w * 0.03,
        background: 'linear-gradient(160deg, #3A3F46 0%, #1B1E22 60%)', boxShadow: '0 40px 90px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.25)'}}>
        <div style={{position: 'absolute', left: bez, top: bez, width: w, height: h, borderRadius: w * 0.014, overflow: 'hidden', background: UI.bg}}>{children}</div>
        <div style={{position: 'absolute', left: '50%', top: bez * 0.3, width: w * 0.12, height: bez * 0.5, marginLeft: -w * 0.06, borderRadius: 6, background: '#0A0B0D'}} />
      </div>
      <div style={{position: 'absolute', left: 0, top: h + bez * 2 - 2, width: w * 1.16 + bez * 2, height: w * 0.035, borderRadius: `0 0 ${w * 0.04}px ${w * 0.04}px`,
        background: 'linear-gradient(180deg, #C9CDD2 0%, #8E939A 55%, #5B5F65 100%)', boxShadow: '0 30px 40px rgba(0,0,0,.45)'}}>
        <div style={{position: 'absolute', left: '50%', top: 0, width: w * 0.16, height: w * 0.012, marginLeft: -w * 0.08, borderRadius: '0 0 10px 10px', background: '#7C8187'}} />
      </div>
    </div>
  );
};

export const PhoneFrame: React.FC<{w: number; light?: boolean; children: React.ReactNode}> = ({w, light, children}) => {
  const h = w * 2.06, bez = w * 0.032, r = w * 0.16;
  return (
    <div style={{position: 'relative', width: w, height: h, borderRadius: r, padding: bez, boxSizing: 'border-box',
      background: 'linear-gradient(145deg, #4A4F57 0%, #16181C 40%, #2B2F35 100%)',
      boxShadow: '0 50px 100px rgba(0,0,0,.55), inset 0 2px 0 rgba(255,255,255,.3), inset 0 -2px 0 rgba(0,0,0,.5)'}}>
      <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: r - bez, overflow: 'hidden', background: light ? '#F5F6F4' : UI.bg}}>
        {children}
        <div style={{position: 'absolute', left: '50%', top: w * 0.03, width: w * 0.3, height: w * 0.075, marginLeft: -w * 0.15, borderRadius: 40, background: '#050505'}} />
      </div>
    </div>
  );
};

export const BrowserWindow: React.FC<{w: number; h: number; url: string; children: React.ReactNode}> = ({w, h, url, children}) => (
  <div style={{position: 'relative', width: w, height: h, borderRadius: 26, overflow: 'hidden', background: '#101318',
    boxShadow: '0 50px 110px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.14), 0 0 0 1px rgba(255,255,255,.08)'}}>
    <div style={{height: 64, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px', background: '#1A1E24', borderBottom: `1px solid ${UI.line}`}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />)}
      <div style={{marginLeft: 22, flex: 1, height: 36, borderRadius: 12, background: '#0E1115', display: 'flex', alignItems: 'center', padding: '0 18px',
        fontFamily: F, fontWeight: 600, fontSize: 22, color: UI.sub}}>{url}</div>
    </div>
    <div style={{position: 'absolute', left: 0, top: 64, right: 0, bottom: 0}}>{children}</div>
  </div>
);

// ——— Мелкие детали интерфейса ———
const Chip: React.FC<{c?: string; bg?: string; children: React.ReactNode}> = ({c = UI.text, bg = 'rgba(255,255,255,.06)', children}) => (
  <span style={{display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: bg, color: c, fontFamily: F, fontWeight: 700, fontSize: 20, whiteSpace: 'nowrap'}}>{children}</span>
);
const Dot: React.FC<{c: string}> = ({c}) => <span style={{width: 10, height: 10, borderRadius: 5, background: c, boxShadow: `0 0 10px ${c}`}} />;

// Плавная линия графика: точки 0…1 → путь SVG, заливка градиентом.
const smooth = (pts: number[], w: number, h: number) => {
  const xy = pts.map((v, i) => [(i / (pts.length - 1)) * w, h - v * h]);
  let d = `M${xy[0][0]},${xy[0][1]}`;
  for (let i = 1; i < xy.length; i++) {
    const [x0, y0] = xy[i - 1], [x1, y1] = xy[i], cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
};
export const AreaChart: React.FC<{w: number; h: number; pts: number[]; c: string; k?: number; id: string}> = ({w, h, pts, c, k = 1, id}) => {
  const d = smooth(pts, w, h);
  return (
    <svg width={w} height={h} style={{display: 'block', overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c} stopOpacity={0.35} /><stop offset="1" stopColor={c} stopOpacity={0} /></linearGradient>
        <clipPath id={`${id}c`}><rect x={0} y={-10} width={w * clamp01(k)} height={h + 20} /></clipPath>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={0} x2={w} y1={h * g} y2={h * g} stroke="rgba(255,255,255,.06)" strokeWidth={2} />)}
      <g clipPath={`url(#${id}c)`}>
        <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#${id}g)`} />
        <path d={d} fill="none" stroke={c} strokeWidth={5} strokeLinecap="round" />
      </g>
    </svg>
  );
};

// ——— 1. Система для экспедиторов: перевозки, движение денег и бюджет в одном окне; валюта по курсу Нацбанка ———
const ROUTES = [
  {r: 'Алматы → Астана', s: 'в пути', c: UI.mint, p: 0.62},
  {r: 'Шымкент → Алматы', s: 'доставлено', c: '#7CE38B', p: 1},
  {r: 'Павлодар → Караганда', s: 'погрузка', c: UI.orange, p: 0.18},
  {r: 'Астана → Костанай', s: 'в пути', c: UI.mint, p: 0.44},
];
export const ForwarderDashboard: React.FC<{k: number}> = ({k}) => (
  <div style={{position: 'absolute', inset: 0, display: 'flex', background: UI.bg, fontFamily: F}}>
    <div style={{width: '17%', background: '#0F141A', borderRight: `1px solid ${UI.line}`, padding: '26px 18px', display: 'flex', flexDirection: 'column', gap: 12}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18}}>
        <div style={{width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${UI.mint}, #1DBF97)`}} />
        <span style={{fontWeight: 800, fontSize: 22, color: UI.text}}>Логистика</span>
      </div>
      {['Перевозки', 'Движение денег', 'Бюджет', 'Отчёты'].map((n, i) => (
        <div key={n} style={{padding: '12px 14px', borderRadius: 12, fontWeight: 700, fontSize: 19, color: i === 0 ? UI.mintInk : UI.sub, background: i === 0 ? UI.mint : 'transparent'}}>{n}</div>
      ))}
    </div>
    <div style={{flex: 1, padding: '26px 30px', display: 'flex', flexDirection: 'column', gap: 18}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <span style={{fontWeight: 800, fontSize: 32, color: UI.text}}>Перевозки, деньги и бюджет — в одном окне</span>
        <Chip c={UI.mint} bg="rgba(61,237,195,.1)"><Dot c={UI.mint} /> курс Нацбанка</Chip>
      </div>
      <div style={{display: 'flex', gap: 16}}>
        {[['Движение денег', UI.mint, [0.3, 0.42, 0.38, 0.55, 0.5, 0.66, 0.72]], ['Бюджет рейсов', UI.orange, [0.6, 0.52, 0.58, 0.46, 0.5, 0.42, 0.44]]].map(([t, c, pts], i) => (
          <div key={i} style={{flex: 1, background: UI.panel, borderRadius: 18, padding: '18px 20px', border: `1px solid ${UI.line}`}}>
            <div style={{fontWeight: 700, fontSize: 20, color: UI.sub, marginBottom: 10}}>{t as string}</div>
            <AreaChart id={`fw${i}`} w={330} h={110} pts={pts as number[]} c={c as string} k={k * 1.4 - i * 0.2} />
          </div>
        ))}
      </div>
      <div style={{flex: 1, background: UI.panel, borderRadius: 18, border: `1px solid ${UI.line}`, padding: '12px 20px'}}>
        {ROUTES.map((r, i) => {
          const v = clamp01(k * 2 - 0.3 - i * 0.12);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, height: 62, borderBottom: i < 3 ? `1px solid ${UI.line}` : 'none', opacity: 0.25 + 0.75 * v}}>
              <span style={{width: 250, fontWeight: 700, fontSize: 21, color: UI.text}}>{r.r}</span>
              <div style={{flex: 1, height: 10, borderRadius: 5, background: 'rgba(255,255,255,.07)'}}>
                <div style={{width: `${r.p * 100 * v}%`, height: '100%', borderRadius: 5, background: r.c}} />
              </div>
              <Chip c={r.c} bg={`${r.c}1f`}>{r.s}</Chip>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// Лист Excel, который уходит на «вместо Excel-таблиц».
export const ExcelSheet: React.FC = () => (
  <div style={{position: 'relative', width: 520, height: 360, borderRadius: 18, overflow: 'hidden', background: '#FFFFFF', boxShadow: '0 30px 70px rgba(0,0,0,.5)', fontFamily: F}}>
    <div style={{height: 54, background: '#217346', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px'}}>
      <Mark name="excel" size={32} color="#FFFFFF" />
      <span style={{fontWeight: 800, fontSize: 22, color: '#FFFFFF'}}>перевозки.xlsx</span>
    </div>
    <div style={{display: 'grid', gridTemplateColumns: '40px repeat(5, 1fr)'}}>
      {Array.from({length: 42}, (_, i) => (
        <div key={i} style={{height: 42, borderRight: '1px solid #E2E5E8', borderBottom: '1px solid #E2E5E8', background: i % 6 === 0 || i < 6 ? '#F2F4F5' : '#FFFFFF'}} />
      ))}
    </div>
  </div>
);

// ——— 2. Трекер питания и активности с ИИ: скан еды по фото, калории и БЖУ, сон и активность, ИИ-ассистент ———
const Ring: React.FC<{r: number; w: number; p: number; c: string}> = ({r, w, p, c}) => {
  const L = 2 * Math.PI * r;
  return (
    <g>
      <circle r={r} fill="none" stroke={`${c}2a`} strokeWidth={w} />
      <circle r={r} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={`${L * p} ${L}`} transform="rotate(-90)" />
    </g>
  );
};
export const FitnessApp: React.FC<{k: number; food: number; act: number}> = ({k, food, act}) => (
  <div style={{position: 'absolute', inset: 0, background: '#F4F5F2', fontFamily: F, padding: '96px 30px 30px'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <span style={{fontWeight: 800, fontSize: 40, color: '#101214'}}>Сегодня</span>
      <span style={{width: 56, height: 56, borderRadius: 28, background: 'linear-gradient(135deg, #FFB27E, #FF7A2F)'}} />
    </div>
    {/* скан еды по фото */}
    <div style={{marginTop: 22, borderRadius: 28, overflow: 'hidden', background: '#FFFFFF', boxShadow: `0 ${10 + food * 16}px ${30 + food * 30}px rgba(255,122,47,${0.08 + food * 0.25})`,
      outline: food > 0 ? `${food * 4}px solid rgba(255,122,47,.7)` : 'none'}}>
      <div style={{position: 'relative', height: 230, overflow: 'hidden'}}>
        <Img src={staticFile('r22/food.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        <div style={{position: 'absolute', left: 18, top: 18}}><Chip c="#FFFFFF" bg="rgba(0,0,0,.45)">скан по фото</Chip></div>
        {/* рамка распознавания */}
        <div style={{position: 'absolute', left: '22%', top: '14%', width: '56%', height: '72%', borderRadius: 26, border: '4px solid rgba(255,255,255,.9)', opacity: 0.4 + 0.6 * food}} />
      </div>
      <div style={{padding: '18px 22px'}}>
        <div style={{fontWeight: 800, fontSize: 28, color: '#101214'}}>Калории и БЖУ</div>
        {[['Белки', '#3DEDC3', 0.72], ['Жиры', '#FFB27E', 0.46], ['Углеводы', '#FF7A2F', 0.58]].map(([n, c, p], i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 12}}>
            <span style={{width: 150, fontWeight: 700, fontSize: 22, color: '#5A6069'}}>{n as string}</span>
            <div style={{flex: 1, height: 14, borderRadius: 7, background: '#ECEEEA'}}><div style={{width: `${(p as number) * 100 * clamp01(k * 1.5)}%`, height: '100%', borderRadius: 7, background: c as string}} /></div>
          </div>
        ))}
      </div>
    </div>
    {/* сон и активность */}
    <div style={{marginTop: 20, display: 'flex', gap: 18, alignItems: 'center', borderRadius: 28, background: '#FFFFFF', padding: 20,
      boxShadow: `0 ${10 + act * 16}px ${30 + act * 30}px rgba(61,237,195,${0.08 + act * 0.3})`, outline: act > 0 ? `${act * 4}px solid rgba(61,237,195,.8)` : 'none'}}>
      <svg width={170} height={170} viewBox="-85 -85 170 170">
        <Ring r={70} w={16} p={0.78 * clamp01(k * 1.3)} c="#FF7A2F" />
        <Ring r={48} w={16} p={0.62 * clamp01(k * 1.3 - 0.1)} c="#3DEDC3" />
        <Ring r={26} w={16} p={0.86 * clamp01(k * 1.3 - 0.2)} c="#101214" />
      </svg>
      <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
        {[['Активность', '#FF7A2F'], ['Шаги', '#3DEDC3'], ['Сон', '#101214']].map(([n, c]) => (
          <div key={n} style={{display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 24, color: '#101214'}}><Dot c={c} />{n}</div>
        ))}
      </div>
    </div>
    {/* ИИ-ассистент */}
    <div style={{marginTop: 20, display: 'flex', gap: 14, alignItems: 'flex-start'}}>
      <div style={{width: 58, height: 58, borderRadius: 29, background: 'linear-gradient(135deg, #3DEDC3, #0F6E5A)', flex: 'none', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 22, color: '#05231D'}}>AI</div>
      <div style={{padding: '16px 20px', borderRadius: '8px 26px 26px 26px', background: '#101214', color: '#F2F3F5', fontWeight: 700, fontSize: 24, lineHeight: 1.3, opacity: clamp01(k * 2 - 0.8)}}>
        Добавь белка на ужин — до цели немного
      </div>
    </div>
  </div>
);

// ——— 3. Сквозная аналитика: расходы на рекламу → заявки из CRM → выручка → окупаемость; AI-таргетолог ———
const FUNNEL = [
  {t: 'Расходы на рекламу', c: UI.orange, pts: [0.4, 0.46, 0.44, 0.52, 0.5, 0.55]},
  {t: 'Заявки из CRM', c: '#FFB27E', pts: [0.3, 0.35, 0.44, 0.42, 0.55, 0.6]},
  {t: 'Выручка', c: UI.mint, pts: [0.28, 0.34, 0.4, 0.5, 0.58, 0.7]},
  {t: 'Окупаемость', c: '#7CE38B', pts: [0.2, 0.3, 0.36, 0.48, 0.6, 0.74]},
];
export const SalesAnalytics: React.FC<{k: number; ai: number; t?: number}> = ({k, ai, t = 0}) => {
  const cnt = (to: number, suffix = '') => `${countTo(t, 24.9, 26.2, to)}${suffix}`;
  const KPI = [['Расход на рекламу', cnt(1240000, ' ₸'), UI.orange, [0.4, 0.46, 0.44, 0.52, 0.5, 0.55]],
    ['Заявки из CRM', cnt(312), '#FFB27E', [0.3, 0.35, 0.44, 0.42, 0.55, 0.6]],
    ['CPL', cnt(3970, ' ₸'), UI.mint, [0.6, 0.55, 0.5, 0.46, 0.42, 0.38]],
    ['Качество лидов', cnt(68, ' %'), '#7CE38B', [0.3, 0.4, 0.45, 0.52, 0.6, 0.68]]] as const;
  const SRC = [['meta', 'Meta Ads', '540 000 ₸', '148', '3 650 ₸', 0.86, UI.mint],
    ['tiktok', 'TikTok Ads', '410 000 ₸', '106', '3 870 ₸', 0.64, '#FFB27E'],
    ['googleads', 'Google Ads', '290 000 ₸', '58', '5 000 ₸', 0.38, UI.orange]] as const;
  return (
    <div style={{position: 'absolute', inset: 0, background: UI.bg, fontFamily: F, padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 14}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <span style={{fontWeight: 800, fontSize: 30, color: UI.text}}>Сквозная аналитика продаж и рекламы</span>
        <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
          <Mark name="meta" size={30} color="#0866FF" /><Mark name="tiktok" size={28} color="#FFFFFF" /><Mark name="googleads" size={30} color="#FBBC04" />
        </div>
      </div>
      {/* четыре метрики с числами и мини-графиком */}
      <div style={{display: 'flex', gap: 12}}>
        {KPI.map(([t, v, c, pts], i) => (
          <div key={i} style={{flex: 1, background: UI.panel, borderRadius: 16, padding: '12px 14px', border: `1px solid ${UI.line}`, opacity: 0.3 + 0.7 * clamp01(k * 2 - i * 0.2)}}>
            <div style={{fontWeight: 700, fontSize: 17, color: UI.sub, whiteSpace: 'nowrap'}}>{t as string}</div>
            <div style={{fontWeight: 800, fontSize: 26, color: c as string, margin: '4px 0 6px'}}>{v as string}</div>
            <AreaChart id={`kp${i}`} w={195} h={62} pts={pts as unknown as number[]} c={c as string} k={k * 1.6 - i * 0.15} />
          </div>
        ))}
      </div>
      {/* источники: расход, заявки, CPL, доля окупаемости */}
      <div style={{background: UI.panel, borderRadius: 18, border: `1px solid ${UI.line}`, padding: '14px 18px'}}>
        <div style={{display: 'flex', fontWeight: 700, fontSize: 16, color: UI.sub, paddingBottom: 8, borderBottom: `1px solid ${UI.line}`}}>
          <span style={{width: 210}}>Источник</span><span style={{width: 150}}>Расход</span><span style={{width: 110}}>Заявки</span><span style={{width: 120}}>CPL</span><span style={{flex: 1}}>Окупаемость</span>
        </div>
        {SRC.map(([logo, name, spend, leads, cpl, romi, c], i) => {
          const v = clamp01(k * 2 - 0.4 - i * 0.18);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', height: 58, opacity: 0.25 + 0.75 * v, fontWeight: 700, fontSize: 20, color: UI.text,
              borderRadius: 12, boxShadow: logo === 'tiktok' && ai > 0.2 ? `inset 0 0 0 2px rgba(61,237,195,${0.3 + 0.5 * ai})` : 'none',
              background: logo === 'tiktok' && ai > 0.2 ? `rgba(61,237,195,${0.05 + 0.07 * ai})` : 'transparent'}}>
              <span style={{width: 210, display: 'flex', alignItems: 'center', gap: 10}}>
                <Mark name={logo as string} size={24} color={logo === 'meta' ? '#0866FF' : logo === 'tiktok' ? '#FFFFFF' : '#FBBC04'} />{name as string}
              </span>
              <span style={{width: 150, color: UI.sub}}>{spend as string}</span>
              <span style={{width: 110}}>{leads as string}</span>
              <span style={{width: 120}}>{cpl as string}</span>
              <span style={{flex: 1, display: 'flex', alignItems: 'center', gap: 10}}>
                <span style={{flex: 1, height: 10, borderRadius: 5, background: 'rgba(255,255,255,.07)'}}>
                  <span style={{display: 'block', width: `${(romi as number) * 100 * v}%`, height: '100%', borderRadius: 5, background: c as string}} />
                </span>
              </span>
            </div>
          );
        })}
      </div>
      {/* панель AI-таргетолога выезжает на «с AI-таргетологом» */}
      <div style={{flex: 1, display: 'flex', gap: 14}}>
        <div style={{flex: 1.15, background: UI.panel, borderRadius: 18, border: `1px solid ${UI.line}`, padding: '14px 16px'}}>
          <div style={{fontWeight: 700, fontSize: 18, color: UI.sub, marginBottom: 10}}>Путь клиента</div>
          {['Реклама', 'Заявка', 'Продажа'].map((s2, i) => (
            <div key={s2} style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: i ? 10 : 0}}>
              <div style={{height: 40, width: `${92 - i * 22}%`, borderRadius: 10, background: `linear-gradient(90deg, ${[UI.orange, '#FFB27E', UI.mint][i]}, ${[UI.orange, '#FFB27E', UI.mint][i]}55)`,
                display: 'flex', alignItems: 'center', padding: '0 14px', fontWeight: 800, fontSize: 18, color: '#0C1015'}}>{s2}</div>
            </div>
          ))}
        </div>
        <div style={{flex: 1, borderRadius: 18, padding: '14px 16px', background: 'linear-gradient(160deg, rgba(61,237,195,.16), rgba(61,237,195,.04))',
          border: '1px solid rgba(61,237,195,.35)', transform: `translateX(${(1 - ai) * 60}px)`, opacity: ai, boxShadow: ai > 0.5 ? '0 0 40px rgba(61,237,195,.25)' : 'none'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}><Dot c={UI.mint} /><span style={{fontWeight: 800, fontSize: 20, color: UI.mint}}>AI-таргетолог</span></div>
          <div style={{marginTop: 10, fontWeight: 700, fontSize: 19, lineHeight: 1.35, color: UI.text}}>CPL в TikTok Ads вырос на 12 % — переношу бюджет в Meta Ads</div>
          <div style={{marginTop: 12, display: 'inline-flex', padding: '8px 16px', borderRadius: 10, background: UI.mint, color: UI.mintInk, fontWeight: 800, fontSize: 18}}>Применить</div>
        </div>
      </div>
    </div>
  );
};

// ——— Видеоредактор: «я заменил монтажёра на ИИ — ты видишь результат» ———
// Превью — в пикселях: у холста видео проценты от родителя с aspect-ratio не срабатывают (кадр рисуется в натуральную величину).
export const EditorWindow: React.FC<{k: number; ph: number; src: string; h: number}> = ({k, ph, src, h}) => {
  const vh = Math.round(h * 0.66 * 0.88), vw = Math.round((vh * 9) / 16);
  return (
  <div style={{position: 'absolute', inset: 0, background: '#0E1116', fontFamily: F, display: 'flex', flexDirection: 'column'}}>
    <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0C10'}}>
      <div style={{position: 'relative', width: vw, height: vh, borderRadius: 18, overflow: 'hidden', boxShadow: '0 0 0 2px rgba(255,255,255,.08)'}}>
        <Video src={staticFile(src)} muted style={{position: 'absolute', left: 0, top: 0, width: vw, height: vh}} />
      </div>
    </div>
    <div style={{height: '34%', borderTop: `1px solid ${UI.line}`, padding: '16px 22px', position: 'relative'}}>
      {[['Видео', UI.mint, [0.02, 0.3, 0.33, 0.7, 0.72, 0.98]], ['Графика', UI.orange, [0.1, 0.24, 0.4, 0.55, 0.64, 0.86]], ['Субтитры', '#E9EDF2', [0.04, 0.2, 0.22, 0.44, 0.46, 0.7, 0.72, 0.95]], ['Звук', '#7CE38B', [0.0, 1.0]]].map(([n, c, cuts], i) => (
        <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14, height: '22%'}}>
          <span style={{width: 130, fontWeight: 700, fontSize: 19, color: UI.sub}}>{n as string}</span>
          <div style={{position: 'relative', flex: 1, height: '62%'}}>
            {(cuts as number[]).reduce<[number, number][]>((a, v, j, arr) => (j % 2 === 0 && arr[j + 1] !== undefined ? [...a, [v, arr[j + 1]]] : a), []).map(([a, b], j) => (
              <div key={j} style={{position: 'absolute', left: `${a * 100}%`, width: `${(b - a) * 100 * clamp01(k * 1.6 - a)}%`, top: 0, bottom: 0, borderRadius: 8, background: `${c}`, opacity: 0.85}} />
            ))}
          </div>
        </div>
      ))}
      <div style={{position: 'absolute', left: `calc(152px + ${ph} * (100% - 174px))`, top: 8, bottom: 8, width: 4, borderRadius: 2, background: UI.mint, boxShadow: '0 0 14px rgba(61,237,195,.8)'}} />
    </div>
  </div>
);
};
