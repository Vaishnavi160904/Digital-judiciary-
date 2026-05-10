import React from 'react';
import { FileText, MessageSquare, Calendar, Shield, TrendingUp, Users } from 'lucide-react';

export default function Home() {
  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>AI-Powered Digital Judiciary System</h1>
        <p style={styles.heroSubtitle}>
          Streamline legal processes with intelligent case management, AI-powered legal assistance, and real-time case tracking
        </p>
      </div>

      <div style={styles.features}>
        <div style={styles.featureCard}>
          <FileText size={40} color="#3b82f6" />
          <h3 style={styles.featureTitle}>Case Management</h3>
          <p style={styles.featureText}>
            Submit, track, and manage legal cases efficiently with our comprehensive digital platform
          </p>
        </div>

        <div style={styles.featureCard}>
          <MessageSquare size={40} color="#10b981" />
          <h3 style={styles.featureTitle}>LawGPT Assistant</h3>
          <p style={styles.featureText}>
            Get instant legal information powered by AI trained on Indian law documents including IPC, Companies Act, and more
          </p>
        </div>

        <div style={styles.featureCard}>
          <Calendar size={40} color="#f59e0b" />
          <h3 style={styles.featureTitle}>Court Scheduling</h3>
          <p style={styles.featureText}>
            Automated hearing scheduling and calendar management for judges and lawyers
          </p>
        </div>

        <div style={styles.featureCard}>
          <Shield size={40} color="#8b5cf6" />
          <h3 style={styles.featureTitle}>Secure & Compliant</h3>
          <p style={styles.featureText}>
            Role-based access control ensures data security and regulatory compliance
          </p>
        </div>

        <div style={styles.featureCard}>
          <TrendingUp size={40} color="#ef4444" />
          <h3 style={styles.featureTitle}>Real-time Updates</h3>
          <p style={styles.featureText}>
            Get instant notifications about case status, hearings, and important updates
          </p>
        </div>

        <div style={styles.featureCard}>
          <Users size={40} color="#06b6d4" />
          <h3 style={styles.featureTitle}>Collaborative Platform</h3>
          <p style={styles.featureText}>
            Seamless collaboration between lawyers, judges, and legal professionals
          </p>
        </div>
      </div>

      <div style={styles.cta}>
        <h2 style={styles.ctaTitle}>Ready to Transform Legal Management?</h2>
        <p style={styles.ctaText}>
          Join thousands of legal professionals using our AI-powered platform
        </p>
        <button style={styles.ctaButton}>Get Started Today</button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  hero: {
    textAlign: 'center',
    padding: '3rem 0',
  },
  heroTitle: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#1e293b',
    lineHeight: '1.2',
  },
  heroSubtitle: {
    fontSize: '1.2rem',
    color: '#64748b',
    maxWidth: '800px',
    margin: '0 auto 3rem',
    lineHeight: '1.6',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    marginTop: '3rem',
  },
  featureCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    textAlign: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: '1rem 0',
    color: '#1e293b',
  },
  featureText: {
    color: '#64748b',
    lineHeight: '1.6',
  },
  cta: {
    textAlign: 'center',
    marginTop: '4rem',
    padding: '3rem 2rem',
    backgroundColor: '#3b82f6',
    borderRadius: '0.5rem',
    color: 'white',
  },
  ctaTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
  },
  ctaText: {
    fontSize: '1.1rem',
    marginBottom: '2rem',
    opacity: 0.9,
  },
  ctaButton: {
    backgroundColor: 'white',
    color: '#3b82f6',
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
};