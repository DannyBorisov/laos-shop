import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../api";
import logo from "../assets/logo.png";
import ldbLogo from "../assets/ldb-bank-logo.png";
import "./Checkout.css";

type CartItem = {
  productId: number;
  quantity: number;
  name: string;
  price: number;
  imageUrl?: string | null;
};

type QRResponse = {
  transactionId: string;
  qrCode: string;
  link: string;
};

export function Checkout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = i18n.language === "lo" ? "en" : "lo";
    i18n.changeLanguage(newLang);
  };
  const initial =
    (location.state as { items: CartItem[]; total: number }) || {
      items: [],
      total: 0,
    };

  const [items, setItems] = useState<CartItem[]>(initial.items ?? []);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const syncCart = (next: CartItem[]) => {
    localStorage.setItem("cart", JSON.stringify(next));
    window.dispatchEvent(new Event("cartUpdated"));
    return next;
  };

  const removeItem = (productId: number) => {
    setItems((prev) =>
      syncCart(prev.filter((item) => item.productId !== productId)),
    );
  };

  const changeQuantity = (productId: number, delta: number) => {
    setItems((prev) =>
      syncCart(
        prev.flatMap((item) => {
          if (item.productId !== productId) return [item];
          const quantity = item.quantity + delta;
          return quantity <= 0 ? [] : [{ ...item, quantity }];
        }),
      ),
    );
  };

  const [step, setStep] = useState<"details" | "payment">("details");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrData, setQrData] = useState<QRResponse | null>(null);

  const itemCount = items.reduce((sum, { quantity }) => sum + quantity, 0);

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <header className="checkout-header">
          <Link to="/" className="checkout-logo">
            <img src={logo} alt="Logo" />
            <span>{t("brand.name")}</span>
          </Link>
          <button className="lang-toggle" onClick={toggleLanguage}>
            {i18n.language === "lo" ? "EN" : "ລາວ"}
          </button>
        </header>
        <div className="checkout-empty">
          <div className="empty-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
          <h2>{t("cart.empty")}</h2>
          <p>{t("cart.emptyMessage")}</p>
          <Link to="/" className="btn-back">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {t("cart.continueShopping")}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const fullAddress = `${village}, ${district}, ${city}`;
      const response = await api.post<QRResponse>("/orders", {
        amount: total,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        address: fullAddress,
        phoneNumber,
      });

      setQrData(response);
      setStep("payment");
    } catch (err) {
      setError(t("checkout.orderError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <Link to="/" className="checkout-logo">
          <img src={logo} alt="Logo" />
          <span>{t("brand.name")}</span>
        </Link>

        <div className="checkout-steps">
          <div
            className={`step ${step === "details" ? "active" : "completed"}`}
          >
            <span className="step-number">
              {step === "payment" ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  width="12"
                  height="12"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                "1"
              )}
            </span>
            {t("checkout.step1")}
          </div>
          <span
            className={`step-divider ${step === "payment" ? "active" : ""}`}
          />
          <div className={`step ${step === "payment" ? "active" : ""}`}>
            <span className="step-number">2</span>
            {t("checkout.step2")}
          </div>
        </div>

        <button className="lang-toggle" onClick={toggleLanguage}>
          {i18n.language === "lo" ? "EN" : "ລາວ"}
        </button>
      </header>

      <div className="checkout-container">
        {step === "details" && (
          <>
            <div className="checkout-main">
              <h1>{t("checkout.title")}</h1>
              <p className="subtitle">
                {t("checkout.subtitle")}
              </p>

              <form onSubmit={handleSubmit} className="checkout-form">
                <section className="form-section">
                  <div className="section-header">
                    <div className="section-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                      </svg>
                    </div>
                    <h2>{t("checkout.contactInfo")}</h2>
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">
                      {t("checkout.phone")} <span className="required">{t("checkout.required")}</span>
                    </label>
                    <div className="input-wrapper">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                      </svg>
                      <input
                        type="tel"
                        id="phone"
                        className="with-icon"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder={t("checkout.phonePlaceholder")}
                        required
                      />
                    </div>
                    <p className="form-hint">
                      {t("checkout.phoneHint")}
                    </p>
                  </div>
                </section>

                <section className="form-section">
                  <div className="section-header">
                    <div className="section-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <h2>{t("checkout.deliveryAddress")}</h2>
                  </div>
                  <div className="form-group">
                    <label htmlFor="city">
                      {t("checkout.city")} <span className="required">{t("checkout.required")}</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={t("checkout.cityPlaceholder")}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="district">
                      {t("checkout.district")} <span className="required">{t("checkout.required")}</span>
                    </label>
                    <input
                      type="text"
                      id="district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder={t("checkout.districtPlaceholder")}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="village">
                      {t("checkout.village")} <span className="required">{t("checkout.required")}</span>
                    </label>
                    <input
                      type="text"
                      id="village"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder={t("checkout.villagePlaceholder")}
                      required
                    />
                  </div>
                </section>

                {error && (
                  <div className="error-message">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    t("checkout.processing")
                  ) : (
                    <>
                      {t("checkout.continueToPayment")}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>

            <aside className="checkout-sidebar">
              <div className="order-summary">
                <div className="summary-header">
                  <h2>{t("checkout.orderSummary")}</h2>
                  <span className="item-count">
                    {itemCount} {itemCount === 1 ? t("checkout.item") : t("checkout.items")}
                  </span>
                </div>

                <div className="order-items">
                  {items.map((item) => (
                    <div key={item.productId} className="order-item">
                      <div className="item-image">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextElementSibling?.classList.remove(
                                "hidden",
                              );
                            }}
                          />
                        ) : null}
                        <div
                          className={`item-placeholder ${item.imageUrl ? "hidden" : ""}`}
                          style={item.imageUrl ? { display: "none" } : {}}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                          </svg>
                        </div>
                        <span className="item-qty">{item.quantity}</span>
                      </div>
                      <div className="item-details">
                        <p className="item-name">{item.name}</p>
                        <p className="item-price">
                          {item.price.toLocaleString()} {t("common.currency")} {t("checkout.each")}
                        </p>
                        <div className="item-qty-controls">
                          <button
                            type="button"
                            aria-label={t("cart.decrease")}
                            onClick={() => changeQuantity(item.productId, -1)}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M5 12h14" />
                            </svg>
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            aria-label={t("cart.increase")}
                            onClick={() => changeQuantity(item.productId, 1)}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="item-total">
                        {(item.price * item.quantity).toLocaleString()} {t("common.currency")}
                      </div>
                      <button
                        type="button"
                        className="item-remove"
                        aria-label={t("cart.remove")}
                        onClick={() => removeItem(item.productId)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="order-totals">
                  <div className="total-row">
                    <span>{t("checkout.subtotal")}</span>
                    <span>{total.toLocaleString()} {t("common.currency")}</span>
                  </div>
                  <div className="total-row">
                    <span>{t("checkout.shipping")}</span>
                    <span>{t("checkout.free")}</span>
                  </div>
                  <div className="total-row total-final">
                    <span>{t("cart.total")}</span>
                    <span>{total.toLocaleString()} {t("common.currency")}</span>
                  </div>
                </div>
              </div>
            </aside>
          </>
        )}

        {step === "payment" && qrData && (
          <div className="payment-container">
            <div className="payment-card">
              <div className="payment-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M7 7h.01M7 12h.01M7 17h.01M12 7h.01M12 12h.01M12 17h.01M17 7h.01M17 12h.01M17 17h.01" />
                </svg>
              </div>

              <h1>{t("payment.scanToPay")}</h1>
              <p className="payment-subtitle">
                {t("payment.useApp")}
              </p>

              <div className="qr-wrapper">
                <QRCodeSVG value={qrData.qrCode} size={200} level="M" />
              </div>

              <div className="payment-amount">
                <span>{t("payment.amountDue")}</span>
                <strong>{total.toLocaleString()} {t("common.currency")}</strong>
              </div>

              <div className="payment-info">
                <div className="info-row">
                  <span>{t("payment.transactionId")}</span>
                  <code>{qrData.transactionId}</code>
                </div>
              </div>

              <a href={qrData.link} className="btn-payment-link">
                <img src={ldbLogo} alt="LDB Bank" className="ldb-logo" />
                {t("payment.openInApp")}
              </a>

              <button onClick={() => navigate("/")} className="btn-back-home">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                {t("payment.backToShop")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
