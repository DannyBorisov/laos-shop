import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import logo from "../assets/logo.png";
import "./Product.css";

type Product = {
  id: number;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  quantity: number;
};

type CartItem = {
  productId: number;
  quantity: number;
  name: string;
  price: number;
  imageUrl: string | null;
};

export function ProductPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (id) {
      api
        .get<Product>(`/products/${id}`)
        .then(setProduct)
        .catch(() => navigate("/"))
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  const decreaseQty = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQty = () => {
    if (product && quantity < product.quantity) {
      setQuantity(quantity + 1);
    }
  };

  const addToCart = () => {
    if (!product) return;

    // Get existing cart from localStorage
    const existingCart: CartItem[] = JSON.parse(
      localStorage.getItem("cart") || "[]",
    );

    const existingItem = existingCart.find(
      (item) => item.productId === product.id,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      existingCart.push({
        productId: product.id,
        quantity,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      });
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));
    setAddedToCart(true);

    // Dispatch custom event so App.tsx can update cart
    window.dispatchEvent(new Event("cartUpdated"));

    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return (
      <div className="product-page">
        <div className="loading">{t("common.loading")}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-page">
        <div className="not-found">{t("common.notFound")}</div>
      </div>
    );
  }

  const isOutOfStock = product.quantity === 0;

  return (
    <div className="product-page">
      <header className="product-header">
        <Link to="/" className="product-logo">
          <img src={logo} alt="Logo" />
          <span>{t("brand.name")}</span>
        </Link>
        <Link to="/" className="btn-back">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>{t("products.backToShop")}</span>
        </Link>
      </header>

      <main className="product-main">
        <div className="product-image-section">
          <div className="product-image-large">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="no-image">
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
            )}
            {isOutOfStock && (
              <div className="out-of-stock-overlay">
                {t("products.outOfStock")}
              </div>
            )}
          </div>
        </div>

        <div className="product-details-section">
          <h1 className="product-title">{product.name}</h1>

          <p className="product-price">
            {product.price.toLocaleString()} {t("common.currency")}
          </p>

          {product.description && (
            <p className="product-description">{product.description}</p>
          )}

          <div className="product-stock">
            {isOutOfStock ? (
              <span className="stock-out">{t("products.outOfStock")}</span>
            ) : (
              <span className="stock-in">
                {product.quantity} {t("products.inStock")}
              </span>
            )}
          </div>

          {!isOutOfStock && (
            <div className="quantity-section">
              <label>{t("products.quantity")}:</label>
              <div className="quantity-selector">
                <button onClick={decreaseQty} disabled={quantity <= 1}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span>{quantity}</span>
                <button
                  onClick={increaseQty}
                  disabled={quantity >= product.quantity}
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
          )}

          <button
            className={`btn-add-to-cart ${addedToCart ? "added" : ""}`}
            onClick={addToCart}
            disabled={isOutOfStock}
          >
            {addedToCart ? (
              <>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {t("products.addedToCart")}
              </>
            ) : isOutOfStock ? (
              t("products.outOfStock")
            ) : (
              <>
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
                {t("products.addToCart")}
              </>
            )}
          </button>

          <div className="product-meta">
            <p>{t("products.freeShipping")}</p>
          </div>
        </div>
      </main>

      {/* Video Instruction Section - only show if videoUrl exists */}
      {product.videoUrl && (
        <section className="video-section">
          <div className="video-container">
            <div className="video-header">
              <div className="video-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <div>
                <h2>{t("products.videoTitle")}</h2>
                <p>{t("products.videoSubtitle")}</p>
              </div>
            </div>
            <div className="video-wrapper">
              <video controls crossOrigin="anonymous" playsInline>
                <source src={product.videoUrl} type="video/mp4" />
                {t("products.videoNotSupported")}
              </video>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
