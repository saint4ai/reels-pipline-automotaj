import {AbsoluteFill} from 'remotion';
import {textDepth} from '../../ds/tokens';
import {CapsuleLine} from '../../kit/liquid/CapsuleLine';
import {GlassEnv} from '../../kit/liquid/env';
import {GlassSurface, LiquidPanel} from '../../kit/liquid/LiquidPanel';
import {C, Chip, E, k, Mark, NUM, SANS} from '../montage/parts';
import {Theatre, TwoLights} from './stages';
import {B} from './timing';
import {EditorWindow} from './ui';
import {at} from './words';

// Ролик 22, сцены 1–3: цитата → видеоредактор («ты видишь результат») → «ты и коллега с агентом».
// Правило воздуха: один герой, ≤ 3 смысловых элемента, новый элемент не чаще раза в 1,2 с.
const full: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: 1440, height: 2560};

// ——— 1. Цитата на стеклянной плите → плита поворачивается → видеоредактор ———
const PLATE = {x: 140, y: 500, w: 1160, h: 820};
export const PREVIEW_C = {x: 720, y: 500 + 820 * 0.33}; // центр превью в редакторе — точка пролёта
export const Opening: React.FC<{t: number}> = ({t}) => {
  const flip = k(t, B.editor - 0.02, B.editor + 0.5, E.inOut); // 0…1 → 0…180°
  const ang = flip * 180;
  const back = ang > 90;
  const tint = k(t, B.editor, B.editor + 0.8, E.inOut);
  const ph = k(t, B.editor + 0.4, B.threat, (v) => v);
  const word = (i: number) => k(t, at(i) - 0.12, at(i) + 0.22);
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <Theatre t={t} tint={tint} />}>
        <div style={{...full, perspective: 2600, perspectiveOrigin: '720px 900px'}}>
          <div style={{...full, transformOrigin: `720px ${PLATE.y + PLATE.h / 2}px`, transform: `rotateY(${back ? ang - 180 : ang}deg)`}}>
            {!back ? (
              <LiquidPanel x={PLATE.x} y={PLATE.y} w={PLATE.w} h={PLATE.h} r={64} material="frosted" level={3} moon={0.4} sheen={k(t, 0.2, 1.2)}>
                <div style={{position: 'absolute', left: 70, top: 20, fontFamily: NUM, fontWeight: 900, fontSize: 260, lineHeight: 1, color: C.orange, textShadow: textDepth}}>«</div>
                <div style={{position: 'absolute', left: 80, top: 250, fontFamily: SANS, fontWeight: 800, fontSize: 128, lineHeight: 1.02, letterSpacing: '-0.035em', color: C.ink, textShadow: textDepth}}>
                  {[['Меня', 0], ['ИИ', 1]].map(([w, i]) => <span key={i as number} style={{opacity: word(i as number), marginRight: 30}}>{w}</span>)}
                  <br />
                  {[['не', 2], ['заменит', 3]].map(([w, i]) => <span key={i as number} style={{opacity: word(i as number), marginRight: 30}}>{w}</span>)}
                </div>
              </LiquidPanel>
            ) : (
              <div style={{position: 'absolute', left: PLATE.x, top: PLATE.y, width: PLATE.w, height: PLATE.h, borderRadius: 64, overflow: 'hidden',
                boxShadow: '0 60px 120px rgba(0,0,0,.6), 0 0 0 2px rgba(255,255,255,.08)'}}>
                <EditorWindow k={k(t, B.editor + 0.3, B.editor + 2)} ph={ph} src="r22/speaker.mp4" h={PLATE.h} />
                <GlassSurface radius={64} tone="dark" fill={0} />
              </div>
            )}
          </div>
        </div>
        {/* «у меня большой опыт» — вторая строка под плитой, капсула на «большой опыт» */}
        {!back && t > at(4) - 0.2 ? (
          <div style={{...full, opacity: k(t, at(4) - 0.15, at(4) + 0.2) * (1 - flip * 2)}}>
            <CapsuleLine t={t} words={['у', 'меня', 'большой', 'опыт']} stops={[{at: at(6), i: 2, j: 3}]}
              style={{family: SANS, weight: 800, size: 84, x: 720, y: PLATE.y + PLATE.h - 190, align: 'center', tracking: -0.02}} textShadow={textDepth}
              capsule={{material: 'solid', tone: 'mint', moon: 0.5}} />
          </div>
        ) : null}
        <Chip t={t} at={at(11) - 0.1} out={B.threat - 0.6} x={720} y={372} label="монтажёр — ИИ" icon="mark:claude" size={60} glass={{material: 'frosted', moon: 0.6}} />
      </GlassEnv>
    </AbsoluteFill>
  );
};

// ——— 3. «Тебя может заменить коллега… делегирует ИИ-агенту… эффективнее и быстрее» (два света) ———
const L_CARD = {x: 90, y: 540, w: 600, h: 680};
const R_CARD = {x: 750, y: 540, w: 600, h: 680};
const Bar: React.FC<{p: number; c: string; label: string}> = ({p, c, label}) => (
  <div style={{marginTop: 26}}>
    <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 59, color: C.dim, marginBottom: 12}}>{label}</div>
    <div style={{height: 28, borderRadius: 14, background: 'rgba(255,255,255,.1)'}}>
      <div style={{width: `${p * 100}%`, height: '100%', borderRadius: 14, background: c, boxShadow: `0 0 18px ${c}88`}} />
    </div>
  </div>
);
export const Threat: React.FC<{t: number}> = ({t}) => {
  const youIn = k(t, at(19) - 0.1, at(19) + 0.5, E.pop), colIn = k(t, at(22) - 0.1, at(22) + 0.5, E.pop);
  const lessExp = k(t, at(24), at(25) + 0.3, E.inOut);
  const agent = k(t, at(28) - 0.2, at(28) + 0.45, E.inOut);
  const tasks = k(t, at(29), at(29) + 0.4), move = k(t, at(36) + 0.1, at(36) + 0.8, E.inOut);
  const race = k(t, at(40), at(44) + 0.2, (v) => v);
  const fast = k(t, at(41), at(42) + 0.4, E.out);
  const card = (b: typeof L_CARD, a: number, tone: 'orange' | 'mint', title: string, children: React.ReactNode) => (
    <div style={{...full, opacity: Math.min(1, a * 1.5), transformOrigin: `${b.x + b.w / 2}px ${b.y + b.h / 2}px`, transform: `scale(${0.85 + 0.15 * a}) translateY(${(1 - a) * 60}px)`}}>
      <LiquidPanel x={b.x} y={b.y} w={b.w} h={b.h} r={56} material="frosted" level={3} moon={0.5}
        style={{boxShadow: `0 0 0 3px ${tone === 'mint' ? 'rgba(61,237,195,.55)' : 'rgba(255,122,47,.55)'}, 0 40px 90px rgba(0,0,0,.5)`}}>
        <div style={{position: 'absolute', left: 52, top: 44, right: 52}}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 104, letterSpacing: '-0.03em', color: C.ink, textShadow: textDepth}}>{title}</div>
          {children}
        </div>
      </LiquidPanel>
    </div>
  );
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <TwoLights t={t} />}>
        {card(L_CARD, youIn, 'orange', 'Ты', (
          <>
            <Bar p={0.92} c={C.orange} label="опыт" />
            <Bar p={0.18 + 0.25 * race} c={C.orange} label="задачи" />
            {tasks > 0 ? <div style={{marginTop: 30, fontFamily: SANS, fontWeight: 700, fontSize: 52, color: C.ink, opacity: tasks * (1 - 0.65 * move)}}>делаешь руками</div> : null}
          </>
        ))}
        {card(R_CARD, colIn, 'mint', 'Коллега', (
          <>
            <Bar p={0.92 - 0.6 * lessExp} c={C.mint} label="опыт" />
            <Bar p={0.18 + 0.82 * fast} c={C.mint} label="задачи" />
            {move > 0 ? <div style={{marginTop: 30, fontFamily: SANS, fontWeight: 700, fontSize: 52, color: C.mint, opacity: move, transform: `translateY(${(1 - move) * 14}px)`}}>делает агент</div> : null}
          </>
        ))}
        {/* ИИ-агент пристёгивается к коллеге */}
        {agent > 0 ? (
          <div style={{position: 'absolute', left: R_CARD.x + R_CARD.w - 150 + (1 - agent) * 300, top: R_CARD.y - 70 - (1 - agent) * 260, width: 190, height: 190, borderRadius: '50%',
            opacity: Math.min(1, agent * 2), display: 'grid', placeItems: 'center',
            background: 'radial-gradient(circle at 35% 30%, rgba(214,255,245,.95), rgba(61,237,195,.9) 45%, rgba(15,110,90,.95) 100%)',
            boxShadow: '0 0 0 4px rgba(255,255,255,.5), 0 0 60px rgba(61,237,195,.7), 0 30px 60px rgba(0,0,0,.45)'}}>
            <Mark name="claude" size={110} color="#FFFFFF" />
          </div>
        ) : null}
        <Chip t={t} at={at(44) - 0.1} x={R_CARD.x + R_CARD.w / 2} y={R_CARD.y + R_CARD.h + 40} label="быстрее" size={64} glass={{material: 'solid', tone: 'mint'}} />
      </GlassEnv>
    </AbsoluteFill>
  );
};
