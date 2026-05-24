import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import './GalleryPage.css';

const categories = ['All', 'Campus', 'Academic', 'Sports', 'Events', 'Student Life'];

const photos = [
  { id: 1, category: 'Campus', caption: 'Main academic building entrance', color: '#C9A84C' },
  { id: 2, category: 'Academic', caption: 'Senior secondary chemistry laboratory session', color: '#1B2A4A' },
  { id: 3, category: 'Sports', caption: '2025 Inter-House Sports — 100m sprint finals', color: '#2D7D46' },
  { id: 4, category: 'Events', caption: 'Annual Prize Giving Day ceremony', color: '#8B5E3C' },
  { id: 5, category: 'Student Life', caption: 'Primary school students during morning assembly', color: '#D4A843' },
  { id: 6, category: 'Campus', caption: 'University library and study centre', color: '#3A5A8C' },
  { id: 7, category: 'Academic', caption: 'University engineering workshop', color: '#555555' },
  { id: 8, category: 'Sports', caption: 'Secondary school football team — regional champions', color: '#1B4A2A' },
  { id: 9, category: 'Events', caption: 'Grandview Academy 30th anniversary celebration', color: '#4A1B3A' },
  { id: 10, category: 'Student Life', caption: 'Reading hour in the primary school library', color: '#6B4423' },
  { id: 11, category: 'Campus', caption: 'Aerial view of the Grandview Academy campus', color: '#2A4A6B' },
  { id: 12, category: 'Academic', caption: 'University graduation ceremony — Class of 2025', color: '#1B2A4A' },
];

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightbox, setLightbox] = useState(null);

  const filtered = activeCategory === 'All'
    ? photos
    : photos.filter(p => p.category === activeCategory);

  return (
    <PageWrapper
      title="Gallery"
      description="Explore photos from Grandview Academy campus life, academic activities, sports events, and school celebrations."
    >
      <section className="page-header">
        <div className="container">
          <span className="page-header__label">Campus Life</span>
          <h1 className="page-header__title">Gallery</h1>
          <p className="page-header__subtitle">
            A visual journey through life at Grandview Academy — from the classroom 
            to the sports field, from campus grounds to community events.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* Category Filters */}
          <div className="gallery-filters">
            {categories.map(cat => (
              <button
                key={cat}
                className={`staff-filter ${activeCategory === cat ? 'staff-filter--active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Photo Grid */}
          <div className="gallery-grid">
            {filtered.map(photo => (
              <div
                key={photo.id}
                className="gallery-item"
                onClick={() => setLightbox(photo)}
              >
                <div
                  className="gallery-item__image"
                  style={{ 
                    backgroundColor: photo.color,
                    backgroundImage: `url(/images/gallery_photo_${(photo.id % 6) + 1}.png)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                </div>
                <div className="gallery-item__overlay">
                  <span className="gallery-item__category">{photo.category}</span>
                  <p className="gallery-item__caption">{photo.caption}</p>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="staff-empty">No photos found in this category.</p>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox__content" onClick={e => e.stopPropagation()}>
            <button className="lightbox__close" onClick={() => setLightbox(null)}>✕</button>
            <div
              className="lightbox__image"
              style={{ 
                backgroundColor: lightbox.color,
                backgroundImage: `url(/images/gallery_photo_${(lightbox.id % 6) + 1}.png)`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
            </div>
            <div className="lightbox__info">
              <span className="lightbox__category">{lightbox.category}</span>
              <p className="lightbox__caption">{lightbox.caption}</p>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
