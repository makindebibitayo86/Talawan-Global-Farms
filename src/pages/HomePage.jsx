import HeroShell from '../components/HeroShell'
import AboutUs from '../components/AboutUs'
import OurFarms from '../components/OurFarms'
import OurProducts from '../components/OurProducts'
import Gallery from '../components/Gallery'
import Team from '../components/Team'
import ContactUs from '../components/ContactUs'
import Newsletter from '../components/Newsletter'
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
        <Team />
        <ContactUs />
        <Newsletter />
        <Footer />
        <ScrollToTopButton />
        <WhatsAppButton />
      </div>
    </>
  )
}
