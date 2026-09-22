import '../globals.css';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
