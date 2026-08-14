import { Navigate } from 'react-router-dom';

/**
 * /help/faq redirects to the main Help & FAQ page.
 * The full FAQ accordion is rendered in HelpPage at /help.
 */
export default function FaqPage() {
  return <Navigate to="/help#faq-section" replace />;
}
