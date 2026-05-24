import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingWhatsAppButton from '../ui/FloatingWhatsAppButton';
import ChatbotWidget from '../ui/ChatbotWidget';

export default function PageWrapper({ title, description, children }) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title
      ? `${title} — Grandview Academy`
      : 'Grandview Academy — Excellence Rooted in Tradition';

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && description) {
      metaDesc.setAttribute('content', description);
    }
  }, [title, description]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '72px', minHeight: '100vh' }}>
        {children}
      </main>
      <ChatbotWidget />
      <FloatingWhatsAppButton />
      <Footer />
    </>
  );
}
