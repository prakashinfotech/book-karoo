import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { ROUTES } from '@/shared/constants';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg-base">
      <div className="w-full max-w-md">
        {/* Back + Logo */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            to={ROUTES.LOGIN}
            className="p-2 rounded-full hover:bg-bg-surface border border-transparent hover:border-border-default transition-colors text-text-muted hover:text-text-primary"
          >
            <ArrowLeft size={18} />
          </Link>
          <span className="font-display font-bold text-xl text-text-primary">
            Book<span className="text-accent-crimson">Karoo</span>
          </span>
        </div>

        <div className="bg-bg-surface border border-border-default rounded-2xl p-8 shadow-sm">
          <h1 className="font-display font-semibold text-2xl text-text-primary mb-1.5 tracking-tight">
            Forgot your password?
          </h1>
          <p className="text-text-muted font-sans text-sm mb-6">
            Enter your registered email address and we'll send you a reset link.
          </p>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
