// Слои жидкого стекла поверх подложки: светящийся обод (свет слева сверху, отблеск справа снизу) и блик.
// Кладутся внутрь контейнера с position: relative. Сами без фильтров, поэтому не ломают размытие фона.
export const GlassLayers: React.FC<{radius: number | string; strength?: number}> = ({radius, strength = 1}) => (
  <>
    <span aria-hidden style={{position: 'absolute', inset: 0, borderRadius: radius, padding: 2, pointerEvents: 'none',
      background: `linear-gradient(135deg, rgba(255,255,255,${0.85 * strength}) 0%, rgba(255,255,255,${0.12 * strength}) 32%, rgba(255,255,255,${0.04 * strength}) 60%, rgba(255,255,255,${0.5 * strength}) 100%)`,
      WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude'}} />
    <span aria-hidden style={{position: 'absolute', inset: 0, borderRadius: radius, pointerEvents: 'none',
      background: `radial-gradient(120% 90% at 18% -10%, rgba(255,255,255,${0.26 * strength}) 0%, rgba(255,255,255,0) 55%)`}} />
    <span aria-hidden style={{position: 'absolute', inset: 0, borderRadius: radius, pointerEvents: 'none',
      boxShadow: `inset 0 -10px 24px rgba(0,0,0,${0.28 * strength}), inset 0 2px 0 rgba(255,255,255,${0.3 * strength})`}} />
  </>
);
