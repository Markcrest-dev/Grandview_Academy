import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import './VirtualTour.css';

export default function VirtualTour() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <PageWrapper
      title="Virtual Tour"
      description="Take a virtual walkthrough of the Grandview Academy campus."
    >
      <section className="section">
        <div className="container">
          <div className="section-heading" style={{ textAlign: 'center' }}>
            <span className="section-heading__label">Campus Experience</span>
            <h1 className="section-heading__title">Virtual School Tour</h1>
            <p className="section-heading__description" style={{ margin: '1rem auto 0', maxWidth: '42rem' }}>
              Explore our state-of-the-art facilities from the comfort of your home. 
              Our campus is designed to foster a safe, engaging, and inspiring learning environment.
            </p>
          </div>

          <div className="virtual-tour-embed" style={{ backgroundImage: 'url(/images/virtual_tour.png)' }}>
            {/* Placeholder for 3D Tour Embed or Video */}
            <div className="virtual-tour-embed__overlay">
              <h3 className="virtual-tour-embed__title">Main Campus View</h3>
              <p className="virtual-tour-embed__subtitle">Interactive 360° Panorama</p>
            </div>
            
            <div className="virtual-tour-embed__action">
              <div 
                className="virtual-tour-embed__play-btn"
                onClick={() => setIsVideoOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="virtual-tour-embed__play-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="virtual-tour-embed__action-text">Start Virtual Tour</span>
              <p className="virtual-tour-embed__action-subtext">(Click to play video)</p>
            </div>
          </div>

          <div className="facilities-grid">
            <div className="facility-card">
              <h3 className="facility-card__title">Science Laboratories</h3>
              <p className="facility-card__description">Fully equipped physics, chemistry, and biology labs for hands-on practical learning.</p>
            </div>
            <div className="facility-card">
              <h3 className="facility-card__title">Library & Media Center</h3>
              <p className="facility-card__description">Extensive collection of books, digital resources, and quiet study areas for students.</p>
            </div>
            <div className="facility-card">
              <h3 className="facility-card__title">Sports Complex</h3>
              <p className="facility-card__description">Olympic-sized pool, indoor basketball court, and full track and field facilities.</p>
            </div>
          </div>
        </div>
      </section>

      {isVideoOpen && (
        <div className="video-modal-overlay" onClick={() => setIsVideoOpen(false)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={() => setIsVideoOpen(false)}>
              &times;
            </button>
            <div className="video-modal-player">
              <video 
                controls 
                autoPlay 
                style={{ width: '100%', height: '100%', borderRadius: '8px' }}
                poster="/images/virtual_tour.png"
              >
                {/* Placeholder video - swap this source with the actual Grandview Academy video URL */}
                <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                Your browser does not support HTML video.
              </video>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
