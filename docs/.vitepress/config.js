export default {
  title: 'TipKoro Documentation',
  description: 'The official documentation for TipKoro.',
  themeConfig: {
    search: {
      provider: 'local'
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Architecture', link: '/architecture/' },
      { text: 'Contributing', link: '/contributing' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Features', link: '/guide/features' }
          ]
        }
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/' },
            { text: 'Frontend', link: '/architecture/frontend' },
            { text: 'Backend', link: '/architecture/backend' }
          ]
        }
      ]
    }
  }
}
