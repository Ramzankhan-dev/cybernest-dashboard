// Decorative brand panel shown beside the login / reset forms.

import { BrandMark, IconBell, IconShieldCheck, IconSmartphone } from "../../components/icons";

// Decorative brand panel shown beside the login / reset forms (hidden on
// narrow screens). Describes real product capabilities — no fake stats.
export function LoginAside() {
  return (
    <aside className="login-aside" aria-hidden="true">
      <div className="brand-row">
        <BrandMark size={40} />
        <strong>CyberNest</strong>
      </div>
      <div>
        <h2>Every device. One secure nest.</h2>
        <p>Enroll, monitor and protect your organization's Android fleet from a single console.</p>
      </div>
      <ul className="login-feature-list">
        <li><span className="feature-icon"><IconSmartphone size={16} /></span>Enrollment &amp; remote device commands</li>
        <li><span className="feature-icon"><IconShieldCheck size={16} /></span>Policy enforcement &amp; compliance</li>
        <li><span className="feature-icon"><IconBell size={16} /></span>Real-time alerts &amp; audit trails</li>
      </ul>
    </aside>
  );
}
