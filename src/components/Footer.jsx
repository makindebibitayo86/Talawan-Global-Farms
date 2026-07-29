import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import logoIcon from '../assets/logo-icon-color.png'
import logoWordmark from '../assets/logo-wordmark-color.png'

const FOOTER_LINKS = {
  Explore: [
    { label: 'About Us', href: '#about' },
    { label: 'Our Farms', href: '#farms' },
    { label: 'Products', href: '#products' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Team', href: '#team' },
  ],
  Company: [
    { label: 'About Talawan', href: '#about-talawan' },
    { label: 'Our Story', href: '#story' },
    { label: 'Sustainability', href: '#sustainability' },
    { label: 'Certifications', href: '#certifications' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#privacy' },
    { label: 'Terms of Use', href: '#terms' },
    { label: 'Shipping & Export', href: '#shipping' },
    { label: 'Admin', href: '/admin' },
  ],
}

const SOCIALS = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/talawanglobalfarms',
    external: true,
    hoverBg:
      'hover:bg-[linear-gradient(45deg,#f09433_0%,#e6683c_25%,#dc2743_50%,#cc2366_75%,#bc1888_100%)]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/talawanglobalfarms',
    external: true,
    hoverBg: 'hover:bg-[#1877F2]',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.25c0-.87.24-1.46 1.49-1.46H16.6V4.14C16.32 4.1 15.36 4 14.24 4c-2.34 0-3.94 1.43-3.94 4.05V10.5H7.75v3h2.55V21h3.2z" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/2348086407680',
    external: true,
    hoverBg: 'hover:bg-[#25D366]',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.113.548 4.1 1.508 5.83L0 24l6.335-1.647A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.823 9.823 0 01-5.006-1.366l-.36-.214-3.73.97.997-3.63-.235-.374A9.812 9.812 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:talawanfarms@gmail.com',
    hoverBg: 'hover:bg-[#EA4335]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
]

const MODAL_CONTENT = {
  'About Talawan': {
    sub: 'Grown with intention.',
    heading: 'About Talawan Global Farms',
    body: `Talawan Global Farms produces and exports premium agricultural goods, grown under careful stewardship and handled with the same discipline from field to shipment.\n\nWe work directly with our own farms and trusted growing partners, so every batch we export can be traced back to the ground it came from.`,
    items: [
      'Farm-direct sourcing, fully traceable',
      'In-house quality inspection at every stage',
      'Export-grade grading and packing',
      'Long-term partnerships with growers',
      'Consistent supply across seasons',
      'Serving buyers across multiple regions',
    ],
  },
  'Our Story': {
    sub: 'From soil to shipment.',
    heading: 'Our Story',
    body: `Talawan began with a straightforward belief — that agriculture done properly, with patience and attention, produces goods worth trusting. That standard shaped every decision since.\n\nWhat started as a single farming operation has grown into a global-facing export business, but the fields, and the care that goes into them, haven't changed.`,
    items: [
      'Rooted in generations of farming knowledge',
      'Grown from a single farm to a global operation',
      'Same quality standard at every scale',
      'Long-standing relationships with local growers',
      'Reinvestment into farm infrastructure',
      'Built for buyers who value consistency',
    ],
  },
  Sustainability: {
    sub: 'Stewardship, not extraction.',
    heading: 'Sustainability',
    body: `Land that's farmed well keeps producing. We manage our farms with a long horizon in mind — protecting soil health, water use, and the communities our operations depend on.\n\nSustainable practice isn't a separate initiative for us; it's the only way we know how to farm for the long term.`,
    items: [
      'Crop rotation and soil health management',
      'Responsible water use across all farms',
      'Fair, consistent terms for growing partners',
      'Reduced-waste packing and logistics',
      'Ongoing investment in farm workers',
      'Long-term land stewardship over short-term yield',
    ],
  },
  Certifications: {
    sub: 'Standards we hold ourselves to.',
    heading: 'Certifications',
    body: `We hold our operations to the standards our export partners require, and we're continually working through the certifications that matter most to our buyers.\n\nDocumentation for any specific shipment or certification is available directly on request.`,
    items: [
      'Export compliance documentation on request',
      'Quality inspection records maintained per batch',
      'Certifications in progress — updated as confirmed',
      'Phytosanitary certification per shipment',
      'Third-party quality verification available',
      'Full traceability from farm to port',
    ],
  },
  'Privacy Policy': {
    sub: 'Your data. Handled with care.',
    heading: 'Privacy Policy',
    body: `Last updated: July 2026\n\nTalawan Global Farms ("we", "us", "our") collects only the information needed to process inquiries, orders, and export documentation — company details, contact information, and order specifications submitted through this site.\n\nWe do not sell or share your data with third parties beyond what's required to fulfil an order or shipment. You can request deletion of your data at any time by contacting us directly.`,
    items: [
      'No data sold to third parties',
      'Information used only for order processing',
      'Shared only where required for shipment/export',
      'Email communications are opt-in',
      'Data deletion available on request',
      'Contact: hello@talawanglobalfarms.com',
    ],
  },
  'Terms of Use': {
    sub: 'Clear terms. No surprises.',
    heading: 'Terms of Use',
    body: `Last updated: July 2026\n\nBy using this site or placing an order with Talawan Global Farms, you agree to these terms. Orders are fulfilled according to the specifications, quantities, and grades confirmed at the time of order.\n\nAll content on this site — including photography, copy, and design — is the property of Talawan Global Farms and may not be reproduced without permission. Delivery and shipment timelines are estimates and may vary with season, availability, and export logistics.`,
    items: [
      'Orders fulfilled to confirmed specifications',
      'All content © Talawan Global Farms',
      'No reproduction without permission',
      'Timelines are estimates, not guarantees',
      'Disputes resolved via direct contact',
      'Nigerian law governs these terms',
    ],
  },
  'Shipping & Export': {
    sub: 'What to expect after you order.',
    heading: 'Shipping & Export',
    body: `Export orders are prepared according to destination-country requirements, including phytosanitary and customs documentation, and are scheduled once quantities and grading are confirmed.\n\nDomestic orders are dispatched separately from export shipments. Delivery and shipment timelines are confirmed directly with each buyer at the time of order.`,
    items: [
      'Export documentation prepared per shipment',
      'Domestic and export orders handled separately',
      'Timelines confirmed per order, not fixed',
      'Tracking provided once a shipment departs',
      'Quality issues addressed on arrival inspection',
      'Contact us for current shipping estimates',
    ],
  },
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <img src={logoIcon} alt="" className="h-20 w-20 object-contain shrink-0" />
      <img src={logoWordmark} alt="Talawan Global Farms" className="h-11 w-auto object-contain" />
    </div>
  )
}

function FooterModal({ id, onClose }) {
  const content = MODAL_CONTENT[id]

  useEffect(() => {
    if (!content) return
    const scrollY = window.scrollY
    const { overflow, position, top, width } = document.body.style

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.body.style.overflow = overflow
      document.body.style.position = position
      document.body.style.top = top
      document.body.style.width = width
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' })
    }
  }, [content])

  if (!content) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-ink/70 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <motion.div
          className="relative max-h-[88vh] w-full max-w-[720px] overflow-y-auto rounded-sm border border-line bg-canvas [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="sticky top-0 z-[1] flex items-center justify-between px-8 pt-6 pb-2 bg-canvas">
            <div className="flex items-center gap-3">
              <img src={logoIcon} alt="" className="h-14 w-14 object-contain shrink-0" />
              <img src={logoWordmark} alt="Talawan Global Farms" className="h-10 w-auto object-contain" />
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-[1.1rem] text-ink-soft hover:text-primary transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="px-10 pb-12 pt-4">
            <p className="mb-4 text-[0.7rem] uppercase tracking-[0.22em] text-accent">
              {content.sub}
            </p>
            <h2 className="mb-6 font-display text-[clamp(2rem,4.5vw,2.8rem)] leading-[1.1] text-ink">
              {content.heading}
            </h2>
            <div className="mb-8 h-px bg-gradient-to-r from-line to-transparent" />

            <div className="mb-8">
              {content.body.split('\n\n').map((para, i) => (
                <p key={i} className="mb-5 text-[0.92rem] leading-[1.8] text-ink-soft">
                  {para}
                </p>
              ))}
            </div>

            {content.items && (
              <ul className="mb-2 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {content.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-baseline gap-2.5 text-[0.85rem] text-ink-soft"
                  >
                    <span className="text-[0.45rem] text-accent">◆</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const MODAL_KEYS = new Set(Object.keys(MODAL_CONTENT))

export default function Footer() {
  const year = new Date().getFullYear()
  const [activeModal, setActiveModal] = useState(null)

  const handleNavClick = (e, href) => {
    if (!href.startsWith('#') || MODAL_KEYS.has(href)) return
    e.preventDefault()
    const target = document.querySelector(href)
    if (target) target.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="border-t border-line bg-canvas-alt px-[clamp(1rem,3vw,3rem)] pb-12 pt-16 md:pt-24">
      <div className="mx-auto max-w-[1400px]">
        {/* Top: brand + nav columns */}
        <div className="mb-20 grid grid-cols-1 gap-16 md:grid-cols-[1fr_1.6fr] md:gap-24">
          {/* Brand */}
          <div className="flex flex-col items-start gap-5">
            <BrandMark />

            <p className="max-w-full md:max-w-[380px] text-[0.95rem] font-light leading-[1.8] text-ink-soft">
              Feeding the Nation,
              <br />
              Premium harvests,
              <br />
              Grown for the world.
            </p>

            <div className="mt-1 flex gap-[10px]">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target={s.external ? '_blank' : undefined}
                  rel={s.external ? 'noopener noreferrer' : undefined}
                  className={`flex h-[48px] w-[48px] items-center justify-center rounded-full border border-line text-ink-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-transparent hover:text-white ${s.hoverBg}`}
                >
                  <span className="h-[18px] w-[18px]">{s.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          <nav className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-12" aria-label="Footer navigation">
            {Object.entries(FOOTER_LINKS).map(([group, links]) => (
              <div
                key={group}
                className={
                  group === 'Legal'
                    ? 'col-span-2 grid grid-cols-2 gap-x-10 gap-y-4 border-t border-line pt-8 sm:col-span-1 sm:block sm:border-t-0 sm:pt-0'
                    : undefined
                }
              >
                <h3
                  className={
                    group === 'Legal'
                      ? 'col-span-2 mb-7 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-ink-soft sm:col-span-1'
                      : 'mb-7 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-ink-soft'
                  }
                >
                  {group}
                </h3>
                <ul className="flex flex-col gap-4">
                  {links.map((link) => (
                    <li key={link.label}>
                      {MODAL_KEYS.has(link.label) ? (
                        <button
                          onClick={() => setActiveModal(link.label)}
                          className="text-left text-[0.88rem] font-light text-ink-soft transition-colors duration-300 hover:text-primary"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <a
                          href={link.href}
                          onClick={(e) => handleNavClick(e, link.href)}
                          className="text-[0.88rem] font-light text-ink-soft transition-colors duration-300 hover:text-primary"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="mb-11 h-px bg-gradient-to-r from-transparent via-line to-transparent" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center gap-2 text-center md:flex-row md:justify-between md:text-left">
          <p className="text-[0.8rem] font-light text-ink-soft">
            © {year} TALAWAN GLOBAL FARMS. All rights reserved.
          </p>
          <p className="text-[0.8rem] font-light text-ink-soft">
            Feeding the Nation. Grown for the World.
          </p>
        </div>
      </div>

      {activeModal && <FooterModal id={activeModal} onClose={() => setActiveModal(null)} />}
    </footer>
  )
}
