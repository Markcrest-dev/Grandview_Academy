import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: {
        home: "Home",
        about: "About Us",
        academics: "Academics",
        admissions: "Admissions",
        staff: "Staff",
        news: "News & Events",
        gallery: "Gallery",
        contact: "Contact"
      },
      hero: {
        title: "Excellence Rooted in Tradition"
      }
    }
  },
  fr: {
    translation: {
      nav: {
        home: "Accueil",
        about: "À Propos",
        academics: "Études",
        admissions: "Admissions",
        staff: "Personnel",
        news: "Actualités",
        gallery: "Galerie",
        contact: "Contact"
      },
      hero: {
        title: "L'Excellence Enracinée dans la Tradition"
      }
    }
  },
  ha: {
    translation: {
      nav: {
        home: "Gida",
        about: "Game da Mu",
        academics: "Ilimi",
        admissions: "Shiga",
        staff: "Ma'aikata",
        news: "Labarai",
        gallery: "Hotuna",
        contact: "Tuntuɓi"
      },
      hero: {
        title: "Kwarewa da ke Cikin Al'ada"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
