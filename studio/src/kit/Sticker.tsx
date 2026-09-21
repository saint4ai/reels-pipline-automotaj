import {color, elevation} from '../ds';

// Карточка-наклейка вместо 3D-иконки: как календарь «Июль 2» в иллюминаторе референса.
// Цветная шапка с подписью и крупное значение. Рисуется вектором в палитре, поэтому резкая в 2K.
// 3dicons владелец отклонил 18.09.2026 («не то качество, не та палитра») — в кадр их не ставить.
export const Sticker: React.FC<{head: string; value: string; w: number; accent?: 'orange' | 'mint'}> = ({head, value, w, accent = 'orange'}) => {
  const band = accent === 'orange' ? `linear-gradient(180deg, #FF9C5E 0%, ${color.orange} 100%)` : `linear-gradient(180deg, #8FFBDD 0%, ${color.mint} 100%)`;
  const headInk = accent === 'orange' ? '#1A0E07' : color.mintInk;
  const r = w * 0.16;
  return (
    <div style={{width: w, borderRadius: r, overflow: 'hidden', background: 'linear-gradient(180deg, #FFFFFF 0%, #F1F2F0 100%)',
      boxShadow: `inset 0 -4px 0 rgba(0,0,0,.08), ${elevation[2]}`, fontFamily: 'Manrope', textAlign: 'center'}}>
      <div style={{background: band, color: headInk, fontWeight: 800, fontSize: w * 0.15, lineHeight: 1, padding: `${w * 0.08}px 0`,
        boxShadow: 'inset 0 2px 0 rgba(255,255,255,.45), inset 0 -2px 0 rgba(0,0,0,.12)'}}>{head}</div>
      <div style={{color: '#101214', fontWeight: 800, fontSize: w * 0.42, lineHeight: 1, letterSpacing: '-0.04em', padding: `${w * 0.1}px 0 ${w * 0.13}px`,
        textShadow: '0 2px 0 rgba(255,255,255,.9), 0 8px 18px rgba(0,0,0,.14)'}}>{value}</div>
    </div>
  );
};
