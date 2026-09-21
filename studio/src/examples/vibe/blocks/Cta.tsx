import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile} from 'remotion';
import {elevation} from '../../../ds';
import {Chip, clamp, easeIn, Glass, iv, Label, M, MI, O, out, spr, TXT, Zone} from './common';
import {Headline} from '../Headline';

// Финал ролика 22: «Напиши „гоу“ — пришлю программу, а мой ИИ-агент ответит на твои вопросы. Добро пожаловать на старт обучения по вайбкодингу».
// Паттерн «Масштабный шок»: кадр начинается внутри мятного мира, камера отъезжает — этот мир оказывается буквой «о» в слове «гоу»
// в поле комментария Instagram. Затем уведомление директа: программа и ответ ИИ-агента. Финал — стартовая черта и заголовок.
export const CTA_DUR = 7.6;
const FIELD = {x: 110, y: 560, w: 1220, h: 190};
const O_POS = {x: FIELD.x + 250, y: FIELD.y + FIELD.h / 2}; // центр буквы «о» в «гоу»

export const CtaScene: React.FC<{t: number}> = ({t}) => {
  // отъезд из буквы «о»: огромный масштаб вокруг её центра → 1
  const pull = interpolate(t, [0, 1.0], [26, 1], {...clamp, easing: out});
  const sent = t > 1.25;
  const toast = spr(t, 1.7, {damping: 14, stiffness: 140});
  const reply = iv(t, 2.6, 2.9);
  const typing = t > 2.2 && t < 2.6;
  const start = iv(t, 4.6, 5.2, 0, 1, out);
  const leave = iv(t, 4.5, 4.9, 0, 1, easeIn);
  return (
    <Zone kind="black">
      <AbsoluteFill style={{transformOrigin: `${O_POS.x}px ${O_POS.y}px`, transform: `scale(${pull}) translateY(${-leave * 300}px)`, opacity: 1 - leave}}>
        {/* поле комментария: Instagram, «гоу», кнопка отправки */}
        <div style={{position: 'absolute', left: FIELD.x, top: FIELD.y}}>
          <Glass w={FIELD.w} h={FIELD.h} r={95} pad="0 50px">
            <div style={{display: 'flex', alignItems: 'center', height: '100%', gap: 30}}>
              <Img src={staticFile('brand/instagram.svg')} style={{width: 84, height: 84, flex: 'none'}} />
              <span style={{fontFamily: 'Manrope', fontWeight: 800, fontSize: 110, color: TXT, letterSpacing: '-0.02em'}}>г<span style={{color: M, textShadow: `0 0 40px ${M}`}}>о</span>у</span>
              <span style={{marginLeft: 'auto', width: 120, height: 120, borderRadius: '50%', background: sent ? M : 'rgba(255,255,255,.15)', display: 'grid', placeItems: 'center',
                transform: `scale(${sent ? 1 + 0.2 * Math.max(0, 1 - (t - 1.25) * 4) : 1})`}}>
                <svg width={56} height={56} viewBox="0 0 24 24"><path d="M3 11.5 L21 3 L13.5 21 L11 13 Z" fill={sent ? MI : '#F2F3F5'} /></svg>
              </span>
            </div>
          </Glass>
        </div>
        {/* директ: программа + ответ агента */}
        <div style={{position: 'absolute', left: 110, top: 820, transform: `translateY(${(1 - toast) * -200}px)`, opacity: toast}}>
          <Glass w={1220} h={520} r={56} pad="40px 50px">
            <div style={{display: 'flex', alignItems: 'center', gap: 22, marginBottom: 30}}>
              <span style={{width: 84, height: 84, borderRadius: '50%', background: `radial-gradient(circle at 34% 30%, #E6FFF8, ${M} 45%, #0F6E5A)`, boxShadow: `0 0 26px ${M}`}} />
              <Label size={58}>ИИ-агент · директ</Label>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '22px 30px', borderRadius: 30, background: 'rgba(255,255,255,.1)', width: 'fit-content'}}>
              <span style={{width: 76, height: 90, borderRadius: 12, background: O, boxShadow: elevation[1]}} />
              <Label size={56}>Программа обучения</Label>
            </div>
            <div style={{marginTop: 26, padding: '24px 34px', borderRadius: 34, borderBottomLeftRadius: 10, background: M, width: 'fit-content', opacity: typing || reply > 0 ? 1 : 0}}>
              <span style={{fontFamily: 'Manrope', fontWeight: 700, fontSize: 54, color: MI}}>{typing ? '• • •' : 'Отвечу на любые вопросы'}</span>
            </div>
          </Glass>
        </div>
      </AbsoluteFill>
      {/* старт: стартовая черта светится, заголовок */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 820, height: 12, background: `linear-gradient(90deg, transparent, ${M}, #FFFFFF, ${M}, transparent)`, boxShadow: `0 0 50px ${M}`,
        transform: `scaleX(${start})`, opacity: start}} />
      <div style={{position: 'absolute', left: 70, top: 400, opacity: start}}>
        <Headline text="Добро пожаловать на старт" at={4.65} size={104} width={1300} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 900, display: 'flex', justifyContent: 'center', opacity: iv(t, 5.4, 5.8)}}>
        <Chip tone="mint" size={70}>обучение вайбкодингу</Chip>
      </div>
    </Zone>
  );
};
