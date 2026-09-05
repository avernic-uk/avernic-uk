import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { AdminRoute } from '@/components/routing/AdminRoute'

import HomePage from '@/pages/HomePage'
import ShopPage from '@/pages/ShopPage'
import CategoriesIndexPage from '@/pages/CategoriesIndexPage'
import CategoryPage from '@/pages/CategoryPage'
import ProductPage from '@/pages/ProductPage'
import BasketPage from '@/pages/BasketPage'
import CheckoutPage from '@/pages/CheckoutPage'
import OrderConfirmationPage from '@/pages/OrderConfirmationPage'
import AboutPage from '@/pages/AboutPage'
import FaqPage from '@/pages/FaqPage'
import ContactPage from '@/pages/ContactPage'
import DeliveryPage from '@/pages/DeliveryPage'
import ReturnsPage from '@/pages/ReturnsPage'
import TermsPage from '@/pages/TermsPage'
import PrivacyPage from '@/pages/PrivacyPage'
import CookiesPage from '@/pages/CookiesPage'
import NotFoundPage from '@/pages/NotFoundPage'

import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'

import AccountPage from '@/pages/account/AccountPage'
import AccountOrdersPage from '@/pages/account/AccountOrdersPage'
import AccountOrderDetailPage from '@/pages/account/AccountOrderDetailPage'

import AdminLayout from '@/pages/admin/AdminLayout'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage'
import AdminOrderDetailPage from '@/pages/admin/AdminOrderDetailPage'
import AdminProductsPage from '@/pages/admin/AdminProductsPage'
import AdminProductFormPage from '@/pages/admin/AdminProductFormPage'
import AdminCategoriesPage from '@/pages/admin/AdminCategoriesPage'
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage'
import AdminFaqsPage from '@/pages/admin/AdminFaqsPage'

export default function App() {
  return (
    <Routes>
      {/* Admin routes have their own chrome (no public header/footer/basket) */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products/new" element={<AdminProductFormPage mode="create" />} />
        <Route path="products/:id" element={<AdminProductFormPage mode="edit" />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="faqs" element={<AdminFaqsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Public / customer site */}
      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/shop/categories" element={<CategoriesIndexPage />} />
              <Route path="/shop/:categorySlug" element={<CategoryPage />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/basket" element={<BasketPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />

              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/delivery" element={<DeliveryPage />} />
              <Route path="/returns" element={<ReturnsPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiesPage />} />

              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/account/reset-password" element={<ResetPasswordPage />} />

              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/orders"
                element={
                  <ProtectedRoute>
                    <AccountOrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/orders/:id"
                element={
                  <ProtectedRoute>
                    <AccountOrderDetailPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  )
}
