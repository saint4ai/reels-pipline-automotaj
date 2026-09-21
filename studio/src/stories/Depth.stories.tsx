import type {Meta, StoryObj} from '@storybook/react-vite';
import {DepthText, Panel, color, textDepth, type} from '../ds';

const Showcase: React.FC = () => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 48, alignItems: 'flex-start'}}>
    <DepthText size={type.figure} family="JBM">$20</DepthText>
    <DepthText size={type.headline} tone="mint">4 года</DepthText>
    <Panel name="story" width={900}>
      <DepthText size={type.headline} tone="mint">4 года</DepthText>
      <div style={{fontFamily: 'Manrope', fontWeight: 600, fontSize: 64, color: color.text, textShadow: textDepth}}>внедряю AI в бизнес</div>
    </Panel>
  </div>
);
const meta: Meta<typeof Showcase> = {title: 'Дизайн-система/Глубина: текст и панель', component: Showcase};
export default meta;
export const Витрина: StoryObj<typeof Showcase> = {};
