import { Link } from 'react-router-dom';
import { SignupForm } from '../components/SignupForm';
import { ROUTES } from '@/shared/constants';

const BULLETS = ['🎬 Movies & Events', '🏏 Live Sports & IPL', '🎭 Plays & Comedy'];

export default function SignupPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col items-center justify-center p-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1a40] via-[#07091a] to-[#130820]" />
        <div className="relative z-10 max-w-xs text-center">
          <Link to={ROUTES.HOME} className="inline-block mb-10">
            <span className="text-4xl font-display font-bold text-white tracking-tight">
              Book<span className="text-[#ef4444]">Karoo</span>
            </span>
          </Link>
          <p className="text-lg text-white/75 font-display italic mb-10 leading-snug">
            "Book the moment. Karo it now."
          </p>
          <ul className="space-y-4 text-left">
            {BULLETS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-white/70 font-sans text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-start lg:items-center justify-center min-h-screen overflow-y-auto px-6 py-12 bg-bg-base">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to={ROUTES.HOME}>
              <span className="text-2xl font-display font-bold text-text-primary">
                Book<span className="text-accent-crimson">Karoo</span>
              </span>
            </Link>
          </div>

          <h1 className="font-display font-semibold text-3xl text-text-primary mb-1.5 tracking-tight">
            Create your account
          </h1>
          <p className="text-text-muted font-sans text-sm mb-8">
            Join millions booking entertainment across India
          </p>

          <SignupForm />
        </div>
      </div>
    </div>
  );
}
