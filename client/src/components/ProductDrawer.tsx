import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./ProductDrawer.css";

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

type ProductDrawerProps = {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
};

export function ProductDrawer({ product, isOpen, onClose, onAddToCart }: ProductDrawerProps) {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setAddedToCart(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!product) return null;

  const isOutOfStock = product.quantity === 0;

  const decreaseQty = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQty = () => {
    if (quantity < product.quantity) {
      setQuantity(quantity + 1);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      onClose();
    }, 1000);
  };

  return (
    <>
      <div
        className={`drawer-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />
      <div className={`product-drawer ${isOpen ? "open" : ""}`}>
        <button className="drawer-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="drawer-content">
          <div className="drawer-image">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="no-image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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

          <div className="drawer-details">
            <h2 className="drawer-title">{product.name}</h2>

            <p className="drawer-price">
              {product.price.toLocaleString()} {t("common.currency")}
            </p>

            {product.description && (
              <p className="drawer-description">{product.description}</p>
            )}

            <div className="drawer-stock">
              {isOutOfStock ? (
                <span className="stock-out">{t("products.outOfStock")}</span>
              ) : (
                <span className="stock-in">
                  {product.quantity} {t("products.inStock")}
                </span>
              )}
            </div>

            {!isOutOfStock && (
              <div className="drawer-quantity">
                <label>{t("products.quantity")}:</label>
                <div className="quantity-selector">
                  <button onClick={decreaseQty} disabled={quantity <= 1}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <span>{quantity}</span>
                  <button onClick={increaseQty} disabled={quantity >= product.quantity}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <button
              className={`btn-add-to-cart ${addedToCart ? "added" : ""}`}
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              {addedToCart ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {t("products.addedToCart")}
                </>
              ) : isOutOfStock ? (
                t("products.outOfStock")
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  {t("products.addToCart")}
                </>
              )}
            </button>

            <p className="drawer-shipping">{t("products.freeShipping")}</p>
          </div>

          {product.videoUrl && (
            <div className="drawer-video">
              <h3>{t("products.videoTitle")}</h3>
              <p>{t("products.videoSubtitle")}</p>
              <video controls playsInline>
                <source src={product.videoUrl} type="video/mp4" />
                {t("products.videoNotSupported")}
              </video>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
