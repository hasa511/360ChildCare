import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="brand-mark huge">404</div>
      <h1>Page not found</h1>
      <p className="muted">The page you are looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn btn-primary">
        Back to dashboard
      </Link>
    </div>
  );
}