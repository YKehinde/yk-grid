import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'yk-grid',
  description: 'AI-assisted React DataGrid with sorting, filtering, grouping, pagination, and natural-language query input.',
  base: '/yk-grid/',
  cleanUrls: true,
  appearance: 'dark',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'yk-grid',

    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'Type Reference', link: '/type-reference' },
      { text: 'Recipes', link: '/recipes' },
      {
        text: 'npm',
        link: 'https://www.npmjs.com/package/yk-grid',
      },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
        ],
      },
      {
        text: 'Core Features',
        collapsed: false,
        items: [
          { text: 'Column Definition', link: '/columns' },
          { text: 'Filtering', link: '/filtering' },
          { text: 'Sorting', link: '/sorting' },
          { text: 'Grouping', link: '/grouping' },
          { text: 'Pagination', link: '/pagination' },
          { text: 'Selection', link: '/selection' },
          { text: 'Toolbar', link: '/toolbar' },
          { text: 'Virtual Scrolling', link: '/virtual-scrolling' },
        ],
      },
      {
        text: 'Advanced',
        collapsed: false,
        items: [
          { text: 'Server Mode', link: '/server-mode' },
          { text: 'AI Integration', link: '/ai-integration' },
          { text: 'Imperative Ref API', link: '/imperative-ref' },
          { text: 'Theming', link: '/theming' },
        ],
      },
      {
        text: 'Reference',
        collapsed: false,
        items: [
          { text: 'Type Reference', link: '/type-reference' },
          { text: 'Recipes', link: '/recipes' },
          { text: 'Troubleshooting', link: '/troubleshooting' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/YKehinde/yk-grid' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/yk-grid' },
    ],

    footer: {
      message: 'Released under the MIT Licence.',
      copyright: 'Copyright © 2024–present Yemi Kehinde',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/YKehinde/yk-grid/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
