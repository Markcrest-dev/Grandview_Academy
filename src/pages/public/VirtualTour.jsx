import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';

export default function VirtualTour() {
  return (
    <PageWrapper
      title="Virtual Tour"
      description="Take a virtual walkthrough of the Grandview Academy campus."
    >
      <section className="section">
        <div className="container">
          <div className="section-heading text-center mb-12">
            <span className="section-heading__label">Campus Experience</span>
            <h1 className="section-heading__title">Virtual School Tour</h1>
            <p className="section-heading__description mx-auto max-w-2xl text-gray-600 mt-4">
              Explore our state-of-the-art facilities from the comfort of your home. 
              Our campus is designed to foster a safe, engaging, and inspiring learning environment.
            </p>
          </div>

          <div className="w-full bg-gray-200 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden shadow-lg border border-gray-300" style={{ backgroundImage: 'url(/images/virtual_tour.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {/* Placeholder for 3D Tour Embed or Video */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent flex flex-col justify-end p-8 z-10">
              <h3 className="text-white text-2xl font-bold mb-2">Main Campus View</h3>
              <p className="text-gray-200">Interactive 360° Panorama</p>
            </div>
            
            <div className="text-center z-20">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/30 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="text-white font-medium text-lg">Start Virtual Tour</span>
              <p className="text-gray-200 text-sm mt-2">(Interactive Map Coming Soon)</p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <h3 className="text-xl font-bold text-[#1B2A4A] mb-3">Science Laboratories</h3>
              <p className="text-gray-600 text-sm">Fully equipped physics, chemistry, and biology labs for hands-on practical learning.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <h3 className="text-xl font-bold text-[#1B2A4A] mb-3">Library & Media Center</h3>
              <p className="text-gray-600 text-sm">Extensive collection of books, digital resources, and quiet study areas for students.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <h3 className="text-xl font-bold text-[#1B2A4A] mb-3">Sports Complex</h3>
              <p className="text-gray-600 text-sm">Olympic-sized pool, indoor basketball court, and full track and field facilities.</p>
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
