import {Chip} from '@heroui/react';
import {Img, staticFile} from 'remotion';
import {color, elevation, glassFill, Material, textDepth, type} from './tokens';
import {GlassLayers} from './Glass';
import {useFit} from './useFit';

type Tone = 'default' | 'danger' | 'ok' | 'mint';
const tint: Record<Tone, string> = {default: '24,27,34', danger: '120,26,34', ok: '22,86,48', mint: '61,237,195'};
const fg: Record<Tone, string> = {default: color.text, danger: '#FFD0D2', ok: '#C9FFD6', mint: color.mintInk};

// Пилюля на Chip из HeroUI. По умолчанию стекло; сплошная — только в ключевой момент (мятная — всегда сплошная).
export const Pill: React.FC<{label: string; icon?: string; iconBg?: string; tone?: Tone; material?: Material; size?: number; level?: 1 | 2 | 3; ringOverride?: string}> =
  ({label, icon, iconBg = '#FFFFFF', tone = 'default', material, size = type.label, level = 2, ringOverride}) => {
    const ref = useFit(`pill:${label}`);
    const m: Material = tone === 'mint' ? 'solid' : material ?? 'clear';
    const accent = tone === 'mint';
    return (
      <Chip ref={ref as never} size="lg" style={{...glassFill(m, tint[tone]),
        ...(accent ? {background: `linear-gradient(180deg, #A8FFE9 0%, ${color.mint} 55%, #1DBF97 100%)`} : {}),
        position: 'relative', border: 'none', outline: ringOverride ? `3px solid ${ringOverride}` : 'none', outlineOffset: 4,
        color: fg[tone], borderRadius: 999, fontFamily: 'Manrope', fontWeight: 700, fontSize: size, lineHeight: 1.15,
        padding: `${Math.round(size * 0.36)}px ${Math.round(size * 0.8)}px`, gap: Math.round(size * 0.34), whiteSpace: 'nowrap', boxShadow: elevation[level]}}>
        <GlassLayers radius={999} strength={accent ? 0.6 : 1} />
        {icon ? (
          <span style={{position: 'relative', width: size * 1.3, height: size * 1.3, borderRadius: '50%', background: iconBg, display: 'grid', placeItems: 'center', flex: 'none',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,.5), 0 4px 10px rgba(0,0,0,.35)', overflow: 'hidden'}}>
            <Img src={staticFile(icon)} style={{width: size * 0.9, height: size * 0.9, objectFit: 'contain'}} />
          </span>
        ) : null}
        <Chip.Label style={{position: 'relative', fontSize: 'inherit', lineHeight: 'inherit', padding: 0, textShadow: accent ? 'none' : textDepth}}>{label}</Chip.Label>
      </Chip>
    );
  };
