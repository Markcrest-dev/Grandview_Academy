import { Link } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

export default function NotFoundPage() {
  return (
    <PageWrapper title="Page Not Found" description="The page you are looking for does not exist.">
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
            fontFamily: 'var(--font-heading)',
            fontSize: '5rem',
            fontWeight: '700',
            color: 'var(--color-gold)',
            display: 'block',
            marginBottom: '0.5rem',
          }}>
            404
          </span>
          <h1 style={{
            fontSize: '1.5rem',
            color: 'var(--color-navy)',
            marginBottom: '0.75rem',
          }}>
            Page Not Found
          </h1>
          <p style={{
            fontSize: '0.9375rem',
            color: '#888',
            maxWidth: '400px',
            lineHeight: '1.7',
            marginBottom: '2rem',
          }}>
            The page you are looking for may have been moved, deleted, or does not exist. 
            Please check the URL or return to the homepage.
          </p>
          <Link to="/" className="btn btn--primary">Return to Homepage</Link>
        </div>
      </section>
    </PageWrapper>
  );
}
