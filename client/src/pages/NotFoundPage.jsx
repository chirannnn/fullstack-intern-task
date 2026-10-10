import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/StatusViews';
import { buttonClasses } from '../components/ui/buttonClasses';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="The page you're looking for doesn't exist or has moved."
      action={
        <Link to="/templates" className={buttonClasses()}>
          Go to templates
        </Link>
      }
    />
  );
}
