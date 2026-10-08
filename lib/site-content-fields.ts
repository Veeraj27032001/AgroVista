export const SITE_CONTENT_FIELDS: { key: string; label: string; default: string; multiline?: boolean }[] = [
  { key: 'hero_badge', label: 'Hero badge text', default: 'New issue every month' },
  { key: 'hero_title', label: 'Hero title', default: 'Stories & data shaping the future of agriculture.' },
  {
    key: 'hero_subtitle',
    label: 'Hero subtitle',
    multiline: true,
    default:
      "AgriOxen Monthly brings farmers, agronomists and agribusiness leaders in-depth reporting on technology, markets, sustainability and the people growing the world's food. Sign in and unlock any issue to read online."
  },
  { key: 'hero_stat_volumes', label: 'Hero stat — Volumes', default: '3' },
  { key: 'hero_stat_readers', label: 'Hero stat — Monthly Readers', default: '45K+' },
  { key: 'stats_experts', label: 'Stats strip — Contributing Experts', default: '120+' },
  { key: 'stats_countries', label: 'Stats strip — Countries Read In', default: '60+' },
  { key: 'stats_price', label: 'Stats strip — Per Issue Price', default: '₹49' },
  {
    key: 'about_title',
    label: 'About — title',
    default: 'Independent, practical reporting for the whole agriculture value chain.'
  },
  {
    key: 'about_paragraph_1',
    label: 'About — paragraph 1',
    multiline: true,
    default:
      'AgriOxen Monthly has published issues since 2024 — covering crop science, livestock, agri-tech, policy and the markets that move the industry. Every issue is written for people who work the land and the businesses that support them.'
  },
  {
    key: 'about_paragraph_2',
    label: 'About — paragraph 2',
    multiline: true,
    default: 'Sign in once, unlock an issue for a small one-time fee, and read it online any time afterwards — no re-purchase needed, ever.'
  },
  { key: 'about_feature_1_title', label: 'About — feature 1 title', default: 'Markets & Policy' },
  { key: 'about_feature_1_body', label: 'About — feature 1 body', default: 'Grain prices, trade rules and subsidy shifts explained in plain language.' },
  { key: 'about_feature_2_title', label: 'About — feature 2 title', default: 'Agri-Technology' },
  { key: 'about_feature_2_body', label: 'About — feature 2 body', default: "Drones, sensors, precision farming and the startups building what's next." },
  { key: 'about_feature_3_title', label: 'About — feature 3 title', default: 'Read Online, Securely' },
  { key: 'about_feature_3_body', label: 'About — feature 3 body', default: "Every issue opens after sign-in — access follows your account, not a device." },
  { key: 'contact_email', label: 'Contact — editorial email', default: 'editor@agrioxenmonthly.com' },
  { key: 'contact_phone', label: 'Contact — reader support phone', default: '+91 80 4567 8900 · Mon–Fri, 9am–6pm IST' },
  { key: 'contact_address', label: 'Contact — head office address', default: 'Bengaluru, Karnataka, India' }
];
