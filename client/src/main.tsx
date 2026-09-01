import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./i18n";
import "./index.css";
import App from "./App.tsx";
import { QRGenerator } from "./pages/QRGenerator.tsx";
import { Checkout } from "./pages/Checkout.tsx";
import { Admin } from "./pages/Admin.tsx";
import { ProductPage } from "./pages/Product.tsx";
import { CategoryPage } from "./pages/Category.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/qr" element={<QRGenerator />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
