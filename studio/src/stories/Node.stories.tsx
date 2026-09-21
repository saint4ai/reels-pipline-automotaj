import type {Meta, StoryObj} from '@storybook/react-vite';
import {Pill} from '../ds';

const meta: Meta<typeof Pill> = {title: 'Дизайн-система/Пилюля', component: Pill, args: {label: 'Claude', icon: 'brand/claude.svg'}};
export default meta;
type S = StoryObj<typeof Pill>;
export const Обычная: S = {};
export const Опасность: S = {args: {label: '0 коннекторов', icon: undefined, tone: 'danger'}};
export const Работает: S = {args: {label: '✓ работает', icon: undefined, tone: 'ok', size: 60}};
export const Акцент: S = {args: {label: '1 мин', icon: undefined, tone: 'mint', size: 60}};
export const Коннектор: S = {args: {label: 'Perplexity', icon: 'brand/perplexity.svg'}};
export const СветлыйЛоготип: S = {args: {label: 'Composio', icon: 'brand/composio.svg', iconBg: '#0B0D10'}};
