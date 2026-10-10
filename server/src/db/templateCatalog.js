// Deterministic sample catalog used by the seed and by the test suite.
const image = (photoId) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=960&q=70`;

module.exports = [
  {
    slug: 'launchpad-saas',
    name: 'Launchpad',
    category: 'SaaS',
    description:
      'Conversion-focused SaaS marketing site with a pricing table, feature grid, customer logos and a sticky signup call to action.',
    thumbnail_url: image('photo-1460925895917-afdab827c52f'),
  },
  {
    slug: 'metricly-dashboard',
    name: 'Metricly',
    category: 'Dashboard',
    description:
      'Analytics dashboard with KPI cards, revenue charts, a sortable data table and a collapsible sidebar for internal tools.',
    thumbnail_url: image('photo-1551288049-bebda4e38f71'),
  },
  {
    slug: 'northwind-store',
    name: 'Northwind Store',
    category: 'E-commerce',
    description:
      'Modern storefront with product listings, quick-view modals, a slide-out cart and a streamlined three-step checkout.',
    thumbnail_url: image('photo-1441986300917-64674bd600d8'),
  },
  {
    slug: 'folio-portfolio',
    name: 'Folio',
    category: 'Portfolio',
    description:
      'Minimal portfolio for designers and developers featuring case-study pages, a project gallery and a contact form.',
    thumbnail_url: image('photo-1547658719-da2b51169166'),
  },
  {
    slug: 'inkwell-blog',
    name: 'Inkwell',
    category: 'Blog',
    description:
      'Readable editorial blog theme with long-form article layouts, author profiles, tags and a newsletter signup block.',
    thumbnail_url: image('photo-1499750310107-5fef28a66643'),
  },
  {
    slug: 'pulse-landing',
    name: 'Pulse',
    category: 'Landing Page',
    description:
      'Single-page product launch template with a hero video section, testimonials, FAQ accordion and waitlist capture.',
    thumbnail_url: image('photo-1522542550221-31fd19575a2d'),
  },
  {
    slug: 'ledger-finance',
    name: 'Ledger',
    category: 'Dashboard',
    description:
      'Finance admin panel for invoices, subscriptions and payouts with filterable transaction history and status badges.',
    thumbnail_url: image('photo-1504868584819-f8e8b4b6d7e3'),
  },
  {
    slug: 'atelier-shop',
    name: 'Atelier',
    category: 'E-commerce',
    description:
      'Boutique fashion store with editorial lookbooks, size guides, wishlists and product image zoom on hover.',
    thumbnail_url: image('photo-1556742049-0cfed4f6a45d'),
  },
  {
    slug: 'devdocs-saas',
    name: 'DevDocs',
    category: 'SaaS',
    description:
      'Developer documentation site with sidebar navigation, code snippets, version switcher and full-text search layout.',
    thumbnail_url: image('photo-1555066931-4365d14bab8c'),
  },
  {
    slug: 'studio-agency',
    name: 'Studio',
    category: 'Portfolio',
    description:
      'Creative agency site showcasing services, team members, client work and a bold project inquiry flow.',
    thumbnail_url: image('photo-1519389950473-47ba0277781c'),
  },
  {
    slug: 'chronicle-magazine',
    name: 'Chronicle',
    category: 'Blog',
    description:
      'Magazine-style publication layout with featured stories, category sections, reading time and related articles.',
    thumbnail_url: image('photo-1486312338219-ce68d2c6f44d'),
  },
  {
    slug: 'beacon-event',
    name: 'Beacon',
    category: 'Landing Page',
    description:
      'Conference and event landing page with a speaker lineup, schedule timeline, venue map and ticket tiers.',
    thumbnail_url: image('photo-1498050108023-c5249f4df085'),
  },
];
