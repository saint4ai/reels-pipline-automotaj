import type {StorybookConfig} from '@storybook/react-vite';

// Витрина компонентов ролика: каждый блок смотрится отдельно до сборки (шаг «для просмотра» маршрута).
const config: StorybookConfig = {
  stories: ['../src/stories/*.stories.tsx'],
  framework: {name: '@storybook/react-vite', options: {}},
  // /public — для шрифтов витрины; корень — для staticFile() внутри плееров Remotion (без remotion_staticBase он даёт пути от корня)
  staticDirs: [{from: '../public', to: '/public'}, {from: '../public', to: '/'}],
  async viteFinal(cfg) {
    const {default: tailwind} = await import('@tailwindcss/vite');
    cfg.plugins = [...(cfg.plugins ?? []), tailwind()];
    return cfg;
  },
};
export default config;
