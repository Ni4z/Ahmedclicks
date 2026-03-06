import type { Config } from 'eslint';

const config: Config = {
  extends: 'next/core-web-vitals',
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
  },
};

export default config;
