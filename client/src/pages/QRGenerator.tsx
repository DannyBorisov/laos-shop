import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../api";

type QRResponse = {
  message: string;
  transactionId: string;
  qrCode: string;
  link: string;
};

export function QRGenerator() {
  const [qrData, setQrData] = useState<QRResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateQR = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.post<QRResponse>("/orders", {});
      setQrData(response);
    } catch (err) {
      setError("Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "500px", margin: "0 auto" }}>
      <h1>QR Code Generator</h1>

      <button
        onClick={generateQR}
        disabled={loading}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          background: "#6B4E8C",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "24px",
        }}
      >
        {loading ? "Generating..." : "Generate QR"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {qrData && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              padding: "20px",
              background: "#fff",
              display: "inline-block",
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
            }}
          >
            <QRCodeSVG value={qrData.qrCode} size={256} level="M" />
          </div>

          <p style={{ marginTop: "16px" }}>
            <strong>Transaction ID:</strong> {qrData.transactionId}
          </p>
        </div>
      )}
    </div>
  );
}
