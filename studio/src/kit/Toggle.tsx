import {interpolate, interpolateColors} from 'remotion';
import {color, elevation} from '../ds';

// Тогл «вручную → автомат» из референса. У автора это Switch из HeroUI, по нему кликает нарисованный курсор.
// В Remotion CSS-переходы HeroUI не рендерятся, поэтому геометрия как у Switch, а движение считается от кадра:
// on — положение ручки 0…1, press — нажатие до щелчка (ручка приплющивается, дорожка подсвечивается).
// Подписи меняют вес плавно: у Manrope переменная жирность, 500 ↔ 800.
// С width строка — сетка 1fr auto 1fr: дорожка ровно по центру, курсор знает, куда ехать (toggleKnob).
const geom = (size: number) => ({tw: size * 1.76, pad: size * 0.08, knob: size * 0.84});
// Центр ручки относительно центра дорожки: куда подводить курсор.
export const toggleKnob = (on: number, size = 148) => {
  const {tw, pad, knob} = geom(size);
  return {dx: -tw / 2 + pad + knob / 2 + (tw - pad * 2 - knob) * on, dy: 0};
};

export const Toggle: React.FC<{on: number; press?: number; left: string; right: string; theme?: 'light' | 'dark'; size?: number; width?: number}> =
  ({on, press = 0, left, right, theme = 'light', size = 148, width}) => {
    const {tw, pad, knob} = geom(size);
    // Ручка вытягивается в середине хода, как у iOS, и приплющивается под пальцем.
    const stretch = Math.sin(Math.PI * on) * 0.22 + press * 0.12;
    const kw = knob * (1 + stretch);
    const kx = pad + (tw - pad * 2 - kw) * on;
    const offTrack = theme === 'light' ? '#E3E5E2' : '#3A3E44';
    const track = interpolateColors(on, [0, 1], [offTrack, color.mint]);
    const hover = theme === 'light' ? 'rgba(61,237,195,.28)' : 'rgba(61,237,195,.22)';
    const strong = theme === 'light' ? '#101214' : '#F2F3F5';
    const weak = theme === 'light' ? '#8A8F95' : '#8E949B';
    const label = (active: number): React.CSSProperties => ({fontFamily: 'Manrope', fontSize: size * 0.43, lineHeight: 1,
      fontWeight: Math.round(interpolate(active, [0, 1], [500, 800])), color: interpolateColors(active, [0, 1], [weak, strong]), whiteSpace: 'nowrap'});
    return (
      <div style={width ? {width, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', columnGap: size * 0.3}
        : {display: 'flex', alignItems: 'center', gap: size * 0.3}}>
        <span style={{...label(1 - on), textAlign: 'right'}}>{left}</span>
        <div style={{position: 'relative', width: tw, height: size, borderRadius: size, background: track, flex: 'none',
          boxShadow: `inset 0 ${size * 0.05}px ${size * 0.12}px rgba(0,0,0,${theme === 'light' ? 0.16 : 0.45}), 0 0 0 ${press * size * 0.08}px ${hover}`}}>
          <div style={{position: 'absolute', left: kx, top: pad, width: kw, height: knob, borderRadius: knob,
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F1F2F1 100%)',
            boxShadow: `inset 0 -3px 0 rgba(0,0,0,.08), ${elevation[1]}`, transform: `scale(${1 - press * 0.04})`}} />
        </div>
        <span style={label(on)}>{right}</span>
      </div>
    );
  };
