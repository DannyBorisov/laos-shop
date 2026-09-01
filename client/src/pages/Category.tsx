import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { ProductDrawer } from "../components/ProductDrawer";
import logo from "../assets/logo.png";
import "./Category.css";

type Product = {
  id: number;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  quantity: number;
};

type Category = {
  id: number;
  name: string;
  nameLao: string | null;
  imageUrl: string | null;
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

type ProductsResponse = {
  products: Product[];
  pagination: Pagination;
};

export function CategoryPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (id) {
      api.get<Category>(`/categories/${id}`).then(setCategory);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      api
        .get<ProductsResponse>(`/products?page=${currentPage}&limit=12&category=${id}`)
        .then((data) => {
          setProducts(data.products);
          setPagination(data.pagination);
        })
        .finally(() => setLoading(false));
    }
  }, [id, currentPage]);

  // Load cart from localStorage on mount and listen for updates
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    const handleCartUpdate = () => {
      const updatedCart = localStorage.getItem("cart");
      if (updatedCart) {
        setCart(JSON.parse(updatedCart));
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

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

  const categoryName =
    i18n.language === "lo" && category?.nameLao
      ? category.nameLao
      : category?.name || "";

  return (
    <div className="category-page">
      <header className="category-header">
        <Link to="/" className="category-logo">
          <img src={logo} alt="Logo" />
          <span>{t("brand.name")}</span>
        </Link>
        <Link to="/checkout" className="cart-link">
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
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>
      </header>

      <main className="category-main">
        <h1 className="category-title">{categoryName}</h1>

        {loading ? (
          <div className="loading">{t("products.loading")}</div>
        ) : products.length === 0 ? (
          <div className="no-products">
            <p>{t("categories.noProducts")}</p>
            <Link to="/" className="btn-browse">
              {t("products.backToShop")}
            </Link>
          </div>
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
