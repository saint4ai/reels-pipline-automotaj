import {Card} from '@heroui/react';
import {elevation, glassFill, Material, radius} from './tokens';
import {GlassLayers} from './Glass';
import {useFit} from './useFit';

// Панель на Card из HeroUI: матовое стекло по умолчанию, сплошная — в ключевой момент.
export const Panel: React.FC<{name: string; rgb?: string; material?: Material; width?: number; children: React.ReactNode}> = ({name, rgb = '14,24,22', material = 'frosted', width, children}) => {
  const ref = useFit(`panel:${name}`);
  return (
    <Card ref={ref as never} style={{...glassFill(material, rgb), position: 'relative', border: 'none', width, padding: '72px 80px', borderRadius: radius.panel, boxShadow: elevation[3], gap: 30}}>
      <GlassLayers radius={radius.panel} />
      <div style={{position: 'relative', display: 'flex', flexDirection: 'column', gap: 30}}>{children}</div>
    </Card>
  );
};
