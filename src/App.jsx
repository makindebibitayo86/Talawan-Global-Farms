import HeroShell from './components/HeroShell'
import AboutUs from './components/AboutUs'
import OurFarms from './components/OurFarms'
import OurProducts from './components/OurProducts'
import ContactUs from './components/ContactUs'
import Footer from './components/Footer'
import ScrollToTopButton from './components/ScrollToTopButton'
import WhatsAppButton from './components/WhatsAppButton'
import Loader from './components/Loader'

function App() {
  return (
    <>
      {/* Full-screen brand loader — sits above everything, fades out once
          the page is ready. The rest of the app mounts underneath it so
          there's no layout shift or re-render when it disappears. */}
      <Loader />

      <div className="overflow-x-hidden">
      {/* HeroShell is the self-contained hero card: video background, notch
          bump, glass navbar, and scroll indicator all live inside it. */}
      <HeroShell />

      <AboutUs />

      <OurFarms />

      <OurProducts />

      {/* Form + contact info + map. The navbar's "Get in Touch" button
          links to #get-in-touch, which is the id on this section. */}
      <ContactUs />

      {/* More page content goes here */}

      <Footer />

      {/* Fixed-position, renders itself only past a scroll threshold —
          safe to mount once here regardless of where it sits in the tree. */}
      <ScrollToTopButton />

      {/* Always-visible WhatsApp enquiry button, stacked below the
          scroll-to-top button in the same bottom-right corner. */}
      <WhatsAppButton />
      </div>
    </>
  )
}

export default App
