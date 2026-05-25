type Props = {
  title: string;
  description: string;
};

const PlaceholderPage = ({ title, description }: Props) => (
  <div className="hero-panel glass section" style={{ textAlign: 'center', padding: 60 }}>
    <div className="overline">Coming soon</div>
    <h1 style={{ margin: '16px 0 12px' }}>{title}</h1>
    <p style={{ opacity: 0.75, maxWidth: 480, margin: '0 auto' }}>{description}</p>
    <p style={{ opacity: 0.5, fontSize: '0.85rem', marginTop: 20 }}>
      This module is wired in the sidebar — full implementation coming next.
    </p>
  </div>
);

export default PlaceholderPage;
