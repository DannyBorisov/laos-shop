import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "./api";
import { ProductDrawer } from "./components/ProductDrawer";
import logo from "./assets/logo.png";
import "./App.css";

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

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Category = {
  id: number;
  name: string;
  nameLao: string | null;
  imageUrl: string | null;
};

type ProductsResponse = {
  products: Product[];
  pagination: Pagination;
};

const heroImages = [
  "https://images.unsplash.com/photo-1552693673-1bf958298935?w=1200&q=80",
  "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1200&q=80",
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80",
];

const categoryImages: Record<string, string> = {
  Botox:
    "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&q=80",
  Fillers:
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80",
  "Fat Dissolving":
    "https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=400&q=80",
  "Skin Brightening":
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80",
  "Thread Lift":
    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80",
  "Weight Loss":
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
};

function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === "lo" ? "en" : "lo";
    i18n.changeLanguage(newLang);
  };

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Listen for cart updates from other pages
    const handleCartUpdate = () => {
      const updatedCart = localStorage.getItem("cart");
      if (updatedCart) {
        setCart(JSON.parse(updatedCart));
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.productId === product.id);
      let newCart;
      if (existing) {
        newCart = prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      } else {
        newCart = [
          ...prevCart,
          {
            productId: product.id,
            quantity,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
          },
        ];
      }
      localStorage.setItem("cart", JSON.stringify(newCart));
      window.dispatchEvent(new Event("cartUpdated"));
      return newCart;
    });
  };

  const openProductDrawer = (product: Product) => {
    setSelectedProduct(product);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleCheckout = () => {
    if (cart.length > 0) {
      navigate("/checkout", { state: { items: cart, total: cartTotal } });
    }
  };

  useEffect(() => {
    api.get<Category[]>("/categories").then((data) => {
      setCategories(data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get<ProductsResponse>(`/products?page=${currentPage}&limit=10`)
      .then((data) => {
        setProducts(data.products);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  }, [currentPage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="header-brand">
            <img src={logo} alt={t("brand.name")} className="header-logo" />
            <div className="header-text">
              <h1>{t("brand.name")}</h1>
              <span>{t("brand.tagline")}</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="lang-toggle" onClick={toggleLanguage}>
              {i18n.language === "lo" ? "EN" : "ລາວ"}
            </button>
            <div className="header-contact">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="16"
                height="16"
              >
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              <span>020 7891 2805</span>
            </div>
            <button
              className="cart-button"
              aria-label={t("cart.title")}
              onClick={handleCheckout}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-image">
          {heroImages.map((src, index) => (
            <img
              key={src}
              src={src}
              alt="Beauty aesthetics"
              className={`hero-slide ${index === currentHeroImage ? "active" : ""}`}
            />
          ))}
        </div>
        <div className="hero-content">
          <h2 className="hero-title">{t("hero.title")}</h2>
          <p className="hero-subtitle">{t("hero.subtitle")}</p>
          <a href="#products" className="hero-btn">
            {t("hero.cta")}
          </a>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2>{t("categories.title")}</h2>
        <div className="categories-grid">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.id}`}
              className="category-card"
            >
              <img
                src={category.imageUrl || categoryImages[category.name] || ""}
                alt={
                  i18n.language === "lo" && category.nameLao
                    ? category.nameLao
                    : category.name
                }
              />
              <span className="category-name">
                {i18n.language === "lo" && category.nameLao
                  ? category.nameLao
                  : category.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <main className="main" id="products">
        <h2>{t("products.title")}</h2>
        {loading ? (
          <div className="loading-products">{t("products.loading")}</div>
        ) : (
          <>
            <div className="products-grid">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`product-card ${product.quantity === 0 ? "out-of-stock" : ""}`}
                >
                  <div
                    className="product-image-wrapper"
                    onClick={() => openProductDrawer(product)}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="product-image"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="no-image-placeholder">
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
                    {product.quantity === 0 && (
                      <div className="out-of-stock-badge">
                        {t("products.outOfStock")}
                      </div>
                    )}
                  </div>
                  <div className="product-info">
                    <div
                      className="product-title-link"
                      onClick={() => openProductDrawer(product)}
                    >
                      <h3>{product.name}</h3>
                    </div>
                    <p className="description">{product.description}</p>
                    <div className="product-footer">
                      <p className="price">
                        {product.price.toLocaleString()} {t("common.currency")}
                      </p>
                      <button
                        className="add-to-cart"
                        onClick={() => addToCart(product, 1)}
                        disabled={product.quantity === 0}
                      >
                        {product.quantity === 0
                          ? t("products.outOfStock")
                          : t("products.addToCart")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  <span>{t("products.prev")}</span>
                </button>

                <div className="pagination-pages">
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1,
                  ).map((page) => (
                    <button
                      key={page}
                      className={`pagination-page ${page === currentPage ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  className="pagination-btn"
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(pagination.totalPages, p + 1),
                    )
                  }
                  disabled={currentPage === pagination.totalPages}
                >
                  <span>{t("products.next")}</span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}

            {pagination && (
              <div className="pagination-info">
                {t("products.showing")}{" "}
                {(currentPage - 1) * pagination.limit + 1}-
                {Math.min(currentPage * pagination.limit, pagination.total)}{" "}
                {t("products.of")} {pagination.total}{" "}
                {t("products.productsText")}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src={logo} alt={t("brand.name")} className="footer-logo" />
            <p>{t("footer.description")}</p>
            <p className="phone">020 7891 2805</p>
          </div>

          <div className="footer-links">
            <h4>{t("footer.legal")}</h4>
            <a href="#">{t("footer.privacy")}</a>
            <a href="#">{t("footer.terms")}</a>
            <a href="#">{t("footer.shippingPolicy")}</a>
            <a href="#">{t("footer.returnPolicy")}</a>
          </div>

          <div className="footer-social">
            <h4>{t("footer.followUs")}</h4>
            <div className="social-icons">
              <a href="https://www.facebook.com/share/19An8ox24e/?mibextid=wwXIfr" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="https://www.tiktok.com/@morhkoung.tateang" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.6 5.82c-1.006-.994-1.567-2.325-1.579-3.82h-3.61v13.87c0 1.65-1.34 2.99-2.99 2.99a2.99 2.99 0 01-2.99-2.99 2.99 2.99 0 012.99-2.99c.27 0 .53.04.77.11V9.32a6.68 6.68 0 00-.77-.05A6.75 6.75 0 003.65 15.99 6.75 6.75 0 0010.42 22.75a6.75 6.75 0 006.75-6.76V9.03a9.36 9.36 0 005.48 1.76V6.79a5.9 5.9 0 01-5.05-1.97z" />
                </svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a href="https://wa.me/8562078912805" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{t("footer.copyright")}</p>
          <p className="made-by">{t("footer.madeBy")}</p>
        </div>
      </footer>

      {/* Product Drawer */}
      <ProductDrawer
        product={selectedProduct}
        isOpen={drawerOpen}
        onClose={closeDrawer}
        onAddToCart={addToCart}
      />
    </div>
  );
}

export default App;
