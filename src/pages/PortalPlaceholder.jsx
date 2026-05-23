import { Link } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

export default function PortalPlaceholder({ portalName }) {
  return (
    <PageWrapper title={`${portalName} Portal`} description={`${portalName} portal — coming soon.`}>
      <section style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 1.5rem',
      }}>
        <div>
          <span style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderRadius: '3px',
            backgroundColor: 'var(--color-gold)',
            color: 'var(--color-navy-dark)',
            marginBottom: '1.5rem',
          }}>
            Coming Soon
          </span>
          <h1 style={{
            fontSize: '2rem',
            color: 'var(--color-navy)',
            marginBottom: '0.75rem',
          }}>
            {portalName} Portal
          </h1>
          <p style={{
            fontSize: '0.9375rem',
            color: '#888',
            maxWidth: '450px',
            lineHeight: '1.7',
            marginBottom: '2rem',
          }}>
            This portal is currently under development. The {portalName.toLowerCase()} dashboard, 
            features, and functionality will be available in a future update.
          </p>
          <Link to="/" className="btn btn--outline">Return to Homepage</Link>
        </div>
      </section>
    </PageWrapper>
  );
}
