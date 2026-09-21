import type {Meta, StoryObj} from '@storybook/react-vite';
import {Pill, Panel, DepthText, color, textDepth, type} from '../ds';

// Стекло поверх фона зоны: прозрачное, матовое и сплошное (только ключевые моменты).
const bg = 'radial-gradient(700px 700px at 20% 20%, rgba(255,138,61,.55), transparent 70%), radial-gradient(800px 800px at 80% 70%, rgba(120,70,255,.6), transparent 70%), radial-gradient(600px 600px at 60% 10%, rgba(0,200,255,.4), transparent 70%), #0A0B10';
const Showcase: React.FC = () => (
  <div style={{background: bg, padding: 80, display: 'flex', flexDirection: 'column', gap: 44, width: 1300}}>
    <div style={{display: 'flex', gap: 30, flexWrap: 'wrap'}}>
      <Pill label="Прозрачное стекло" material="clear" icon="brand/claude.svg" />
      <Pill label="Матовое стекло" material="frosted" />
      <Pill label="Сплошная — ключ" tone="danger" material="solid" />
      <Pill label="1 мин" tone="mint" />
    </div>
    <Panel name="glass-story" width={900}>
      <DepthText size={type.headline} tone="mint">4 года</DepthText>
      <div style={{fontFamily: 'Manrope', fontWeight: 600, fontSize: 64, color: color.text, textShadow: textDepth}}>панель из матового стекла</div>
    </Panel>
  </div>
);
const meta: Meta<typeof Showcase> = {title: 'Дизайн-система/Стекло', component: Showcase, parameters: {layout: 'fullscreen', frameW: 1460, frameH: 1100}};
export default meta;
export const Материалы: StoryObj<typeof Showcase> = {};
