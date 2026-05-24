import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';

export default function AlumniPortal() {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <PageWrapper
      title="Alumni Portal"
      description="Stay connected with Grandview Academy. Join our alumni network."
    >
      <section className="section bg-gray-50">
        <div className="container">
          <div className="section-heading text-center mb-12">
            <span className="section-heading__label">Grandview Network</span>
            <h1 className="section-heading__title">Alumni Portal</h1>
            <p className="section-heading__description mx-auto max-w-2xl text-gray-600 mt-4">
              Welcome back! Reconnect with classmates, access exclusive networking opportunities, 
              and stay updated on the latest developments at your alma mater.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-4 text-center font-medium transition-colors ${
                  activeTab === 'login' ? 'text-[#1B2A4A] border-b-2 border-[#1B2A4A] bg-gray-50' : 'text-gray-500 hover:text-[#1B2A4A]'
                }`}
                onClick={() => setActiveTab('login')}
              >
                Login
              </button>
              <button
                className={`flex-1 py-4 text-center font-medium transition-colors ${
                  activeTab === 'register' ? 'text-[#1B2A4A] border-b-2 border-[#1B2A4A] bg-gray-50' : 'text-gray-500 hover:text-[#1B2A4A]'
                }`}
                onClick={() => setActiveTab('register')}
              >
                Join Network
              </button>
            </div>

            <div className="p-8">
              {activeTab === 'login' ? (
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#1B2A4A] focus:border-[#1B2A4A] outline-none" 
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#1B2A4A] focus:border-[#1B2A4A] outline-none" 
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input id="remember" type="checkbox" className="h-4 w-4 text-[#1B2A4A] border-gray-300 rounded" />
                      <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">Remember me</label>
                    </div>
                    <a href="#" className="text-sm font-medium text-[#C9A84C] hover:text-[#b0933b]">Forgot password?</a>
                  </div>
                  <button type="submit" className="w-full btn btn--primary mt-4">
                    Sign In
                  </button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded outline-none focus:border-[#1B2A4A]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded outline-none focus:border-[#1B2A4A]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded outline-none focus:border-[#1B2A4A] bg-white">
                      <option value="">Select Year</option>
                      {[...Array(30)].map((_, i) => (
                        <option key={i} value={2025 - i}>{2025 - i}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded outline-none focus:border-[#1B2A4A]" />
                  </div>
                  <button type="submit" className="w-full btn btn--primary mt-4">
                    Submit Application
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-4">
                    All applications are verified by the school administration before access is granted.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
