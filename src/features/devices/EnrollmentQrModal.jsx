// Modal: enrollment QR code with token expiry countdown.

import { useEffect, useState } from "react";
import { IconX } from "../../components/icons";

export function EnrollmentQrModal({ device, onClose }) {
  const [remaining, setRemaining] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function tick() {
      if (!device.token_expires_at) { setRemaining(""); return; }
      const diffMs = new Date(device.token_expires_at).getTime() - Date.now();
      if (diffMs <= 0) {
        setExpired(true);
        setRemaining("Expired");
        return;
      }
      const h = Math.floor(diffMs / 3600000);
      const m = Math.floor((diffMs % 3600000) / 60000);
      const s = Math.floor((diffMs % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [device.token_expires_at]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
        <button type="button" className="modal-close" aria-label="Close dialog" title="Close" onClick={onClose}><IconX size={16} /></button>
        <h3 style={{ marginTop: 0 }}>Enrollment QR</h3>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0 0 0.8rem" }}>
          Enrollment code: <span className="mono">{device.device_uid}</span>
        </p>
        <img
          className="qr-image"
          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${device.device_uid}`}
          alt="Enrollment QR code"
          style={{ opacity: expired ? 0.35 : 1 }}
        />
        <p style={{ fontSize: "0.85rem", marginTop: "0.8rem", fontWeight: 600, color: expired ? "var(--alert)" : "var(--teal)" }}>
          {expired ? "⚠️ Token expired" : `⏱ Expires in ${remaining}`}
        </p>
        <button type="button" className="ghost-dark" onClick={onClose} style={{ marginTop: "0.6rem" }}>Close</button>
      </div>
    </div>
  );
}
