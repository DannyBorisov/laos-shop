import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import logo from "../assets/logo.png";
import "./Admin.css";

type OrderItem = {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product: {
    name: string;
    imageUrl: string | null;
  };
};

type Order = {
  id: number;
  totalPrice: number;
  phoneNumber: string;
  address: string;
  status: "PENDING" | "PAID" | "FAILED";
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

type Supplier = {
  id: number;
  name: string;
  phoneNumber: string;
  country: string;
  templateName: string;
  languageCode: string;
  createdAt: string;
  updatedAt: string;
};

type Product = {
  id: number;
  name: string;
  price: number;
  description: string | null;
  imagePath: string | null; // GCS filename for product image
  imageUrl: string | null; // Signed URL from backend
  videoPath: string | null; // GCS filename for instruction video
  videoUrl: string | null; // Signed URL from backend
  quantity: number;
  supplierId: number | null;
  supplier: Supplier | null;
  updatedAt: string;
};

type Tab = "orders" | "products" | "suppliers";

export function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<Product>>({});
  const [saving, setSaving] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    description: "",
    quantity: 0,
    imagePath: "",
    videoPath: "",
    supplierId: "" as string,
  });
  const [uploadingNewImage, setUploadingNewImage] = useState(false);
  const [uploadingNewVideo, setUploadingNewVideo] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phoneNumber: "",
    country: "",
    templateName: "",
    languageCode: "en_US",
  });
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(
    new Set(),
  );
  const [bulkAction, setBulkAction] = useState<"price" | "stock" | null>(null);
  const [bulkValue, setBulkValue] = useState<number>(0);
  const [videoModal, setVideoModal] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState<"set" | "add" | "subtract">("set");
  const [uploadingVideo, setUploadingVideo] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<number | null>(null);
  const [supplierEditValues, setSupplierEditValues] = useState<
    Partial<Supplier>
  >({});

  useEffect(() => {
    if (activeTab === "orders") {
      setLoading(true);
      api
        .get<Order[]>("/orders")
        .then(setOrders)
        .finally(() => setLoading(false));
    } else if (activeTab === "products") {
      setLoading(true);
      Promise.all([
        api.get<{ products: Product[] }>("/products?limit=1000"),
        api.get<Supplier[]>("/suppliers"),
      ])
        .then(([data, sup]) => {
          setProducts(data.products);
          setSuppliers(sup);
        })
        .finally(() => setLoading(false));
    } else if (activeTab === "suppliers") {
      setLoading(true);
      api
        .get<Supplier[]>("/suppliers")
        .then(setSuppliers)
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case "PAID":
        return "status-paid";
      case "FAILED":
        return "status-failed";
      default:
        return "status-pending";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const startEditing = (product: Product) => {
    setEditingProduct(product.id);
    setEditValues({
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      description: product.description || "",
      videoPath: product.videoPath || "",
      supplierId: product.supplierId,
    });
  };

  const cancelEditing = () => {
    setEditingProduct(null);
    setEditValues({});
  };

  const saveProduct = async (productId: number) => {
    setSaving(true);
    try {
      const updated = await api.put<Product>(
        `/products/${productId}`,
        editValues,
      );
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...updated } : p)),
      );
      setEditingProduct(null);
      setEditValues({});
    } catch (error) {
      console.error("Failed to update product:", error);
      alert("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (productId: number, productName: string) => {
    if (!confirm(`Delete "${productName}"?`)) return;
    try {
      await api.delete(`/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product");
    }
  };

  const createProduct = async () => {
    if (!newProduct.name.trim()) {
      alert("Name is required");
      return;
    }
    if (newProduct.price <= 0) {
      alert("Price must be greater than 0");
      return;
    }
    if (!newProduct.supplierId) {
      alert("Supplier is required");
      return;
    }

    setSaving(true);
    try {
      const created = await api.post<Product>("/products", {
        ...newProduct,
        imagePath: newProduct.imagePath || null,
        videoPath: newProduct.videoPath || null,
        description: newProduct.description || null,
        supplierId: newProduct.supplierId
          ? Number(newProduct.supplierId)
          : null,
      });
      setProducts((prev) => [created, ...prev]);
      setShowAddProduct(false);
      setNewProduct({
        name: "",
        price: 0,
        description: "",
        quantity: 0,
        imagePath: "",
        videoPath: "",
        supplierId: "",
      });
    } catch (error) {
      console.error("Failed to create product:", error);
      alert("Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  const handleNewImageUpload = async (file: File) => {
    setUploadingNewImage(true);
    try {
      const { filename } = await api.uploadImage(file);
      setNewProduct((p) => ({ ...p, imagePath: filename }));
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingNewImage(false);
    }
  };

  const handleNewVideoUpload = async (file: File) => {
    setUploadingNewVideo(true);
    try {
      const { filename } = await api.uploadVideo(file);
      setNewProduct((p) => ({ ...p, videoPath: filename }));
    } catch (error) {
      console.error("Failed to upload video:", error);
      alert("Failed to upload video");
    } finally {
      setUploadingNewVideo(false);
    }
  };

  const createSupplier = async () => {
    if (
      !newSupplier.name ||
      !newSupplier.phoneNumber ||
      !newSupplier.country ||
      !newSupplier.templateName ||
      !newSupplier.languageCode
    ) {
      alert("Please fill in all supplier fields");
      return;
    }
    setSaving(true);
    try {
      const created = await api.post<Supplier>("/suppliers", newSupplier);
      setSuppliers((prev) => [...prev, created]);
      setShowAddSupplier(false);
      setNewSupplier({
        name: "",
        phoneNumber: "",
        country: "",
        templateName: "",
        languageCode: "en_US",
      });
    } catch (error) {
      console.error("Failed to create supplier:", error);
      alert("Failed to create supplier");
    } finally {
      setSaving(false);
    }
  };

  const startEditingSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier.id);
    setSupplierEditValues({
      name: supplier.name,
      phoneNumber: supplier.phoneNumber,
      country: supplier.country,
      templateName: supplier.templateName,
      languageCode: supplier.languageCode,
    });
  };

  const cancelEditingSupplier = () => {
    setEditingSupplier(null);
    setSupplierEditValues({});
  };

  const saveSupplier = async (supplierId: number) => {
    setSaving(true);
    try {
      const updated = await api.put<Supplier>(
        `/suppliers/${supplierId}`,
        supplierEditValues,
      );
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplierId ? { ...s, ...updated } : s)),
      );
      setEditingSupplier(null);
      setSupplierEditValues({});
    } catch (error) {
      console.error("Failed to update supplier:", error);
      alert("Failed to update supplier");
    } finally {
      setSaving(false);
    }
  };

  const toggleSelectProduct = (productId: number) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    }
  };

  const clearSelection = () => {
    setSelectedProducts(new Set());
    setBulkAction(null);
    setBulkValue(0);
  };

  const handleVideoUpload = async (productId: number, file: File) => {
    setUploadingVideo(productId);
    try {
      const { filename } = await api.uploadVideo(file);
      const updated = await api.put<Product>(`/products/${productId}`, {
        videoPath: filename,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...updated } : p)),
      );
    } catch (error) {
      console.error("Failed to upload video:", error);
      alert("Failed to upload video");
    } finally {
      setUploadingVideo(null);
    }
  };

  const handleImageUpload = async (productId: number, file: File) => {
    setUploadingImage(productId);
    try {
      const { filename } = await api.uploadImage(file);
      const updated = await api.put<Product>(`/products/${productId}`, {
        imagePath: filename,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...updated } : p)),
      );
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingImage(null);
    }
  };

  const applyBulkEdit = async () => {
    if (selectedProducts.size === 0 || !bulkAction) return;

    setSaving(true);
    try {
      const updates = Array.from(selectedProducts).map(async (productId) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        let newValue: number;
        const currentValue =
          bulkAction === "price" ? product.price : product.quantity;

        switch (bulkMode) {
          case "add":
            newValue = currentValue + bulkValue;
            break;
          case "subtract":
            newValue = Math.max(0, currentValue - bulkValue);
            break;
          default:
            newValue = bulkValue;
        }

        const updateData =
          bulkAction === "price" ? { price: newValue } : { quantity: newValue };
        return api.put<Product>(`/products/${productId}`, updateData);
      });

      const results = await Promise.all(updates);

      setProducts((prev) =>
        prev.map((p) => {
          const updated = results.find((r) => r && r.id === p.id);
          return updated ? { ...p, ...updated } : p;
        }),
      );

      clearSelection();
    } catch (error) {
      console.error("Failed to apply bulk edit:", error);
      alert("Failed to apply bulk edit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <Link to="/" className="admin-logo">
          <img src={logo} alt="Logo" />
          <span>Mhorkoung Admin</span>
        </Link>
        <Link to="/" className="btn-back-shop">
          Back to Shop
        </Link>
      </header>

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("orders");
            clearSelection();
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12h6M9 16h6" />
          </svg>
          Orders
        </button>
        <button
          className={`tab ${activeTab === "products" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("products");
            clearSelection();
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Products
        </button>
        <button
          className={`tab ${activeTab === "suppliers" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("suppliers");
            clearSelection();
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 9l1-5h16l1 5M4 9v11a1 1 0 001 1h14a1 1 0 001-1V9M9 21v-6h6v6" />
          </svg>
          Suppliers
        </button>
      </div>

      <main className="admin-main">
        {activeTab === "orders" && (
          <>
            <div className="admin-title">
              <h1>Orders</h1>
              <span className="order-count">{orders.length} total</span>
            </div>

            {loading ? (
              <div className="loading">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="orders-table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Updated</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <>
                        <tr
                          key={order.id}
                          className={`order-row ${expandedOrder === order.id ? "expanded" : ""}`}
                          onClick={() =>
                            setExpandedOrder(
                              expandedOrder === order.id ? null : order.id,
                            )
                          }
                        >
                          <td className="order-id">#{order.id}</td>
                          <td className="order-date">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="order-date">
                            {formatDate(order.updatedAt)}
                          </td>
                          <td className="order-customer">
                            <div className="customer-phone">
                              {order.phoneNumber}
                            </div>
                            <div className="customer-address">
                              {order.address}
                            </div>
                          </td>
                          <td className="order-items-count">
                            {order.items.reduce(
                              (sum, item) => sum + item.quantity,
                              0,
                            )}{" "}
                            items
                          </td>
                          <td className="order-total">
                            {order.totalPrice.toLocaleString()} KIP
                          </td>
                          <td>
                            <span
                              className={`status-badge ${getStatusClass(order.status)}`}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                        {expandedOrder === order.id && (
                          <tr className="order-details-row">
                            <td colSpan={7}>
                              <div className="order-details">
                                <h4>Order Items</h4>
                                <div className="items-list">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="item-row">
                                      <div className="item-image">
                                        {item.product.imageUrl ? (
                                          <img
                                            src={item.product.imageUrl}
                                            alt={item.product.name}
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
                                              <rect
                                                x="3"
                                                y="3"
                                                width="18"
                                                height="18"
                                                rx="2"
                                              />
                                              <circle
                                                cx="8.5"
                                                cy="8.5"
                                                r="1.5"
                                              />
                                              <path d="M21 15l-5-5L5 21" />
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                      <div className="item-info">
                                        <span className="item-name">
                                          {item.product.name}
                                        </span>
                                        <span className="item-qty">
                                          x{item.quantity}
                                        </span>
                                      </div>
                                      <div className="item-price">
                                        {(
                                          item.price * item.quantity
                                        ).toLocaleString()}{" "}
                                        KIP
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === "products" && (
          <>
            <div className="admin-title">
              <h1>Products</h1>
              <span className="order-count">{products.length} total</span>
              <button
                className="btn-add-product"
                onClick={() => setShowAddProduct(true)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Product
              </button>
            </div>

            {showAddProduct && (
              <div className="add-product-form">
                <h3>Add New Product</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="Product name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Price (KIP) *</label>
                    <input
                      type="number"
                      value={newProduct.price || ""}
                      onChange={(e) =>
                        setNewProduct((p) => ({
                          ...p,
                          price: parseInt(e.target.value) || 0,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock</label>
                    <input
                      type="number"
                      value={newProduct.quantity || ""}
                      onChange={(e) =>
                        setNewProduct((p) => ({
                          ...p,
                          quantity: parseInt(e.target.value) || 0,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Image *</label>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingNewImage}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleNewImageUpload(file);
                      }}
                    />
                    {uploadingNewImage && <small>Uploading…</small>}
                    {newProduct.imagePath && !uploadingNewImage && (
                      <small>Uploaded: {newProduct.imagePath}</small>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Video</label>
                    <input
                      type="file"
                      accept="video/*"
                      disabled={uploadingNewVideo}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleNewVideoUpload(file);
                      }}
                    />
                    {uploadingNewVideo && <small>Uploading…</small>}
                    {newProduct.videoPath && !uploadingNewVideo && (
                      <small>Uploaded: {newProduct.videoPath}</small>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Supplier *</label>
                    <select
                      value={newProduct.supplierId}
                      onChange={(e) =>
                        setNewProduct((p) => ({
                          ...p,
                          supplierId: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select a supplier…</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) =>
                        setNewProduct((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Product description"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    className="btn-save"
                    onClick={createProduct}
                    disabled={saving || uploadingNewImage || uploadingNewVideo}
                  >
                    {saving ? "Creating..." : "Create Product"}
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => setShowAddProduct(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {selectedProducts.size > 0 && (
              <div className="bulk-actions-bar">
                <div className="bulk-info">
                  <span className="bulk-count">
                    {selectedProducts.size} selected
                  </span>
                  <button
                    className="btn-clear-selection"
                    onClick={clearSelection}
                  >
                    Clear
                  </button>
                </div>
                <div className="bulk-controls">
                  <select
                    value={bulkAction || ""}
                    onChange={(e) =>
                      setBulkAction(
                        (e.target.value as "price" | "stock" | null) || null,
                      )
                    }
                    className="bulk-select"
                  >
                    <option value="">Select action...</option>
                    <option value="price">Update Price</option>
                    <option value="stock">Update Stock</option>
                  </select>
                  {bulkAction && (
                    <>
                      <select
                        value={bulkMode}
                        onChange={(e) =>
                          setBulkMode(
                            e.target.value as "set" | "add" | "subtract",
                          )
                        }
                        className="bulk-select"
                      >
                        <option value="set">Set to</option>
                        <option value="add">Add</option>
                        <option value="subtract">Subtract</option>
                      </select>
                      <input
                        type="number"
                        value={bulkValue || ""}
                        onChange={(e) =>
                          setBulkValue(parseInt(e.target.value) || 0)
                        }
                        placeholder="Value"
                        className="bulk-input"
                      />
                      <button
                        className="btn-apply-bulk"
                        onClick={applyBulkEdit}
                        disabled={saving || bulkValue === 0}
                      >
                        {saving ? "Applying..." : "Apply"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className="loading">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p>No products yet</p>
              </div>
            ) : (
              <div className="orders-table-wrapper">
                <table className="orders-table products-table">
                  <thead>
                    <tr>
                      <th className="checkbox-cell">
                        <input
                          type="checkbox"
                          checked={
                            selectedProducts.size === products.length &&
                            products.length > 0
                          }
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th>Image</th>
                      <th>Video</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Supplier</th>
                      <th>Price (KIP)</th>
                      <th>Stock</th>
                      <th>Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className={`product-row ${selectedProducts.has(product.id) ? "selected" : ""}`}
                      >
                        <td className="checkbox-cell">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={() => toggleSelectProduct(product.id)}
                          />
                        </td>
                        <td className="product-image-cell">
                          {uploadingImage === product.id ? (
                            <div className="uploading-indicator">
                              <svg className="spinner" viewBox="0 0 24 24">
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeDasharray="31.4"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                          ) : product.imageUrl ? (
                            <div className="image-cell-actions">
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                referrerPolicy="no-referrer"
                              />
                              <label className="image-upload-btn replace">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file)
                                      handleImageUpload(product.id, file);
                                  }}
                                  hidden
                                />
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                                </svg>
                              </label>
                            </div>
                          ) : (
                            <label className="image-upload-btn">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(product.id, file);
                                }}
                                hidden
                              />
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                              </svg>
                            </label>
                          )}
                        </td>
                        <td className="product-video-cell">
                          {uploadingVideo === product.id ? (
                            <div className="uploading-indicator">
                              <svg className="spinner" viewBox="0 0 24 24">
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeDasharray="31.4"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                          ) : editingProduct === product.id ? (
                            <input
                              type="text"
                              value={editValues.videoPath || ""}
                              onChange={(e) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  videoPath: e.target.value,
                                }))
                              }
                              className="edit-input"
                              placeholder="Video path"
                            />
                          ) : product.videoUrl ? (
                            <div className="video-cell-actions">
                              <button
                                className="video-play-btn"
                                onClick={() => setVideoModal(product.videoUrl)}
                              >
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                              </button>
                              <label className="video-upload-btn replace">
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file)
                                      handleVideoUpload(product.id, file);
                                  }}
                                  hidden
                                />
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                                </svg>
                              </label>
                            </div>
                          ) : (
                            <label className="video-upload-btn">
                              <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleVideoUpload(product.id, file);
                                }}
                                hidden
                              />
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                              </svg>
                            </label>
                          )}
                        </td>
                        <td className="product-name-cell">
                          {editingProduct === product.id ? (
                            <input
                              type="text"
                              value={editValues.name || ""}
                              onChange={(e) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              className="edit-input"
                            />
                          ) : (
                            product.name
                          )}
                        </td>
                        <td className="product-description-cell">
                          {editingProduct === product.id ? (
                            <textarea
                              value={editValues.description || ""}
                              onChange={(e) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              className="edit-textarea"
                              rows={2}
                              placeholder="Description"
                            />
                          ) : (
                            <span className="description-text">
                              {product.description || "-"}
                            </span>
                          )}
                        </td>
                        <td className="product-supplier-cell">
                          {editingProduct === product.id ? (
                            <select
                              value={editValues.supplierId ?? ""}
                              onChange={(e) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  supplierId: e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                }))
                              }
                              className="edit-input"
                            >
                              <option value="">-</option>
                              {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            product.supplier?.name || "-"
                          )}
                        </td>
                        <td className="product-price-cell">
                          {editingProduct === product.id ? (
                            <input
                              type="number"
                              value={editValues.price || 0}
                              onChange={(e) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  price: parseInt(e.target.value) || 0,
                                }))
                              }
                              className="edit-input edit-input-number"
                            />
                          ) : (
                            product.price?.toLocaleString()
                          )}
                        </td>
                        <td className="product-stock-cell">
                          {editingProduct === product.id ? (
                            <input
                              type="number"
                              value={editValues.quantity || 0}
                              onChange={(e) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  quantity: parseInt(e.target.value) || 0,
                                }))
                              }
                              className="edit-input edit-input-number"
                            />
                          ) : (
                            <span
                              className={
                                product.quantity === 0 ? "out-of-stock" : ""
                              }
                            >
                              {product.quantity}
                            </span>
                          )}
                        </td>
                        <td className="product-updated-cell">
                          {formatDate(product.updatedAt)}
                        </td>
                        <td className="product-actions-cell">
                          {editingProduct === product.id ? (
                            <div className="action-buttons">
                              <button
                                className="btn-save"
                                onClick={() => saveProduct(product.id)}
                                disabled={saving}
                              >
                                {saving ? "..." : "Save"}
                              </button>
                              <button
                                className="btn-cancel"
                                onClick={cancelEditing}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="action-buttons">
                              <button
                                className="btn-edit"
                                onClick={() => startEditing(product)}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() =>
                                  deleteProduct(product.id, product.name)
                                }
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === "suppliers" && (
          <>
            <div className="admin-title">
              <h1>Suppliers</h1>
              <span className="order-count">{suppliers.length} total</span>
              <button
                className="btn-add-product"
                onClick={() => setShowAddSupplier(true)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Supplier
              </button>
            </div>

            {showAddSupplier && (
              <div className="add-product-form">
                <h3>Add New Supplier</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={newSupplier.name}
                      onChange={(e) =>
                        setNewSupplier((s) => ({ ...s, name: e.target.value }))
                      }
                      placeholder="Supplier name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="text"
                      value={newSupplier.phoneNumber}
                      onChange={(e) =>
                        setNewSupplier((s) => ({
                          ...s,
                          phoneNumber: e.target.value,
                        }))
                      }
                      placeholder="+856..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Country *</label>
                    <input
                      type="text"
                      value={newSupplier.country}
                      onChange={(e) =>
                        setNewSupplier((s) => ({
                          ...s,
                          country: e.target.value,
                        }))
                      }
                      placeholder="Laos"
                    />
                  </div>
                  <div className="form-group">
                    <label>Template Name / ID *</label>
                    <input
                      type="text"
                      value={newSupplier.templateName}
                      onChange={(e) =>
                        setNewSupplier((s) => ({
                          ...s,
                          templateName: e.target.value,
                        }))
                      }
                      placeholder="WhatsApp template name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Template Language Code *</label>
                    <input
                      type="text"
                      value={newSupplier.languageCode}
                      onChange={(e) =>
                        setNewSupplier((s) => ({
                          ...s,
                          languageCode: e.target.value,
                        }))
                      }
                      placeholder="en_US"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    className="btn-save"
                    onClick={createSupplier}
                    disabled={saving}
                  >
                    {saving ? "Creating..." : "Create Supplier"}
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => setShowAddSupplier(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="loading">Loading suppliers...</div>
            ) : suppliers.length === 0 ? (
              <div className="empty-state">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 9l1-5h16l1 5M4 9v11a1 1 0 001 1h14a1 1 0 001-1V9M9 21v-6h6v6" />
                </svg>
                <p>No suppliers yet</p>
              </div>
            ) : (
              <div className="orders-table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Phone Number</th>
                      <th>Country</th>
                      <th>Template</th>
                      <th>Language</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td className="order-id">#{supplier.id}</td>
                        <td>
                          {editingSupplier === supplier.id ? (
                            <input
                              type="text"
                              value={supplierEditValues.name ?? ""}
                              onChange={(e) =>
                                setSupplierEditValues((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              className="edit-input"
                            />
                          ) : (
                            supplier.name
                          )}
                        </td>
                        <td>
                          {editingSupplier === supplier.id ? (
                            <input
                              type="text"
                              value={supplierEditValues.phoneNumber ?? ""}
                              onChange={(e) =>
                                setSupplierEditValues((prev) => ({
                                  ...prev,
                                  phoneNumber: e.target.value,
                                }))
                              }
                              className="edit-input"
                            />
                          ) : (
                            supplier.phoneNumber
                          )}
                        </td>
                        <td>
                          {editingSupplier === supplier.id ? (
                            <input
                              type="text"
                              value={supplierEditValues.country ?? ""}
                              onChange={(e) =>
                                setSupplierEditValues((prev) => ({
                                  ...prev,
                                  country: e.target.value,
                                }))
                              }
                              className="edit-input"
                            />
                          ) : (
                            supplier.country
                          )}
                        </td>
                        <td>
                          {editingSupplier === supplier.id ? (
                            <input
                              type="text"
                              value={supplierEditValues.templateName ?? ""}
                              onChange={(e) =>
                                setSupplierEditValues((prev) => ({
                                  ...prev,
                                  templateName: e.target.value,
                                }))
                              }
                              className="edit-input"
                            />
                          ) : (
                            supplier.templateName
                          )}
                        </td>
                        <td>
                          {editingSupplier === supplier.id ? (
                            <input
                              type="text"
                              value={supplierEditValues.languageCode ?? ""}
                              onChange={(e) =>
                                setSupplierEditValues((prev) => ({
                                  ...prev,
                                  languageCode: e.target.value,
                                }))
                              }
                              className="edit-input"
                            />
                          ) : (
                            supplier.languageCode
                          )}
                        </td>
                        <td className="order-date">
                          {formatDate(supplier.createdAt)}
                        </td>
                        <td className="product-actions-cell">
                          {editingSupplier === supplier.id ? (
                            <div className="action-buttons">
                              <button
                                className="btn-save"
                                onClick={() => saveSupplier(supplier.id)}
                                disabled={saving}
                              >
                                {saving ? "..." : "Save"}
                              </button>
                              <button
                                className="btn-cancel"
                                onClick={cancelEditingSupplier}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="action-buttons">
                              <button
                                className="btn-edit"
                                onClick={() => startEditingSupplier(supplier)}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* Video Modal */}
      {videoModal && (
        <div
          className="video-modal-overlay"
          onClick={() => setVideoModal(null)}
        >
          <div className="video-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="video-modal-close"
              onClick={() => setVideoModal(null)}
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
            <video
              controls
              autoPlay
              className="video-modal-player"
              crossOrigin="anonymous"
            >
              <source src={videoModal} type="video/mp4" />
            </video>
          </div>
        </div>
      )}
    </div>
  );
}
