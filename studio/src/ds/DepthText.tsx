import {color} from './tokens';

// Объёмный текст: тёмная выдавленная подложка + светлый градиент сверху. Буквы не лежат плоско на холсте.
export const DepthText: React.FC<{children: React.ReactNode; size: number; weight?: number; family?: string; tone?: 'light' | 'mint'; style?: React.CSSProperties}> =
  ({children, size, weight = 800, family = 'Manrope', tone = 'light', style}) => {
    const depth = Math.max(3, Math.round(size / 36));
    const extrude = Array.from({length: depth}, (_, i) => `0 ${i + 1}px 0 ${tone === 'mint' ? '#0F6E5A' : '#3F444D'}`).join(', ');
    const fill = tone === 'mint' ? `linear-gradient(180deg, #B6FFEC 0%, ${color.mint} 55%, #1DBF97 100%)` : 'linear-gradient(180deg, #FFFFFF 0%, #E8EBF0 50%, #B9C0CA 100%)';
    const base: React.CSSProperties = {fontFamily: family, fontWeight: weight, fontSize: size, lineHeight: 1, letterSpacing: '-0.03em', whiteSpace: 'nowrap'};
    return (
      <span style={{position: 'relative', display: 'inline-block', ...style}}>
        <span aria-hidden style={{...base, position: 'absolute', left: 0, top: 0, color: tone === 'mint' ? '#0F6E5A' : '#3F444D',
          textShadow: `${extrude}, 0 ${depth + 14}px 40px rgba(0,0,0,.55)`}}>{children}</span>
        <span style={{...base, position: 'relative', backgroundImage: fill, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>{children}</span>
      </span>
    );
  };
