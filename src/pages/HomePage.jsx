import HeroShell from '../components/HeroShell'
import AboutUs from '../components/AboutUs'
import OurFarms from '../components/OurFarms'
import OurProducts from '../components/OurProducts'
import Gallery from '../components/Gallery'
import ContactUs from '../components/ContactUs'
import Footer from '../components/Footer'
import ScrollToTopButton from '../components/ScrollToTopButton'
import WhatsAppButton from '../components/WhatsAppButton'
import Loader from '../components/Loader'

export default function HomePage() {
  return (
    <>
      <Loader />

      <div className="overflow-x-hidden">
        <HeroShell />
        <AboutUs />
        <OurFarms />
        <OurProducts />
        <Gallery />
        <ContactUs />
        <Footer />
        <ScrollToTopButton />
        <WhatsAppButton />
      </div>
    </>
  )
}
