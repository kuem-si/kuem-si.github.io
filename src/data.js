import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Products',
      links: [
        {
          text: 'KuIoT',
          // href: getPermalink('/landing/saas'),
          href: getPermalink('/kuiot'),
        },
        // {
        //   text: 'QMStack',
        //   href: getPermalink('/landing/startup'),
        // },
        // {
        //   text: 'QMCloud',
        //   href: getPermalink('/landing/mobile-app'),
        // },
      ],
    },
    {
      text: 'Services',
      links: [
        {
          text: 'Software Design & Development',
          href: getPermalink('/software-design-development'),
        },
        {
          text: 'Software Architecture and Consulting',
          href: getPermalink('/software-architecture-consulting'),
        },
        {
          text: 'DevOps & Platform Engineering',
          href: getPermalink('/devops-platform-engineering'),
        },
      ],
    },
    {
      text: 'About',
      links: [
        {
          text: 'About Us',
          // href: getPermalink('/terms'),
          href: getPermalink('/about'),
        },
        {
          text: 'References',
          href: getPermalink('/references'),
        },
        // {
        //   text: 'Privacy policy',
        //   href: getPermalink('/privacy'),
        // },
      ],
    },
    {
      text: 'Contact',
      // href: getBlogPermalink(),
      href: getPermalink('/contact'),
    },
    // {
    //   text: 'Language',
    //   links: [
    //     {
    //       text: 'English',
    //       href: getPermalink('/')
    //     },
    //     {
    //       text: 'Slovenian',
    //       href: getPermalink('/sl')
    //     }
    //   ]
    // },
  ],
  actions: [
    // { type: 'button', text: 'Download', href: 'https://github.com/onwidget/astrowind' }
  ],
};
  
export const footerData = {
  // links: [
  //   {
  //     title: 'Product',
  //     links: [
  //       { text: 'Features', href: '#' },
  //       { text: 'Security', href: '#' },
  //       { text: 'Team', href: '#' },
  //       { text: 'Enterprise', href: '#' },
  //       { text: 'Customer stories', href: '#' },
  //       { text: 'Pricing', href: '#' },
  //     ],
  //   },
  //   {
  //     title: 'Platform',
  //     links: [
  //       { text: 'Developer API', href: '#' },
  //       { text: 'Partners', href: '#' },
  //       { text: 'Atom', href: '#' },
  //       { text: 'Electron', href: '#' },
  //       { text: 'AstroWind Desktop', href: '#' },
  //     ],
  //   },
  //   {
  //     title: 'Support',
  //     links: [
  //       { text: 'Docs', href: '#' },
  //       { text: 'Community Forum', href: '#' },
  //       { text: 'Professional Services', href: '#' },
  //       { text: 'Skills', href: '#' },
  //       { text: 'Status', href: '#' },
  //     ],
  //   },
  //   {
  //     title: 'Company',
  //     links: [
  //       { text: 'About', href: '#' },
  //       { text: 'Blog', href: '#' },
  //       { text: 'Careers', href: '#' },
  //       { text: 'Press', href: '#' },
  //       { text: 'Inclusion', href: '#' },
  //       { text: 'Social Impact', href: '#' },
  //       { text: 'Shop', href: '#' },
  //     ],
  //   },
  // ],
  // secondaryLinks: [
  //   { text: 'Terms', href: getPermalink('/terms') },
  //   { text: 'Privacy Policy', href: getPermalink('/privacy') },
  // ],
  socialLinks: [
    { ariaLabel: 'LinkedIn', icon: 'tabler:brand-linkedin', href: 'https://www.linkedin.com/company/kuemsi' },
    // { ariaLabel: 'Twitter', icon: 'tabler:brand-twitter', href: '#' },
    // { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: '#' },
    // { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: '#' },
    // { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/kuem-si' },
  ],
  footNote: `
    Made by <a class="text-blue-600 hover:underline dark:text-gray-200" href="https://www.kuem.si"> Kuem d.o.o.</a> · All rights reserved.
  `,
};
