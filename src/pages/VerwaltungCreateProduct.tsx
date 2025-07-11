import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate, useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { Plus } from 'lucide-react';

// Import consistent admin components
import { AdminPageLayout } from '@/components/admin/ui';
import { BackButton } from '@/components/admin/ui';

// Import the ProductManagementModal component
import ProductManagementModal from '@/components/events/ProductManagementModal';

const VerwaltungCreateProduct = () => {
  const { language } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = usePermissions();

  React.useEffect(() => {
    if (!permissions.canManageProducts) {
      navigate('/verwaltung');
    }
  }, [permissions.canManageProducts, navigate]);

  // Determine where to navigate back based on referrer or state
  const getBackPath = () => {
    // Check if we have state from navigation (preferred method)
    if (location.state?.from) {
      return location.state.from;
    }
    
    // Fallback: check the referrer path
    const referrer = document.referrer;
    if (referrer) {
      try {
        const referrerPath = new URL(referrer).pathname;
        if (referrerPath.includes('/verwaltung/all-products')) {
          return '/verwaltung/all-products';
        }
        if (referrerPath.includes('/verwaltung')) {
          return '/verwaltung';
        }
      } catch (e) {
        // If URL parsing fails, use default
      }
    }
    
    // Default fallback to verwaltung
    return '/verwaltung';
  };

  const backPath = getBackPath();

  const handleCancel = () => {
    navigate(backPath);
  };

  const handleProductsChange = () => {
    // After successful creation, navigate back to where we came from
    navigate(backPath);
  };

  const getBackButtonLabel = () => {
    if (backPath === '/verwaltung/all-products') {
      return language === 'en' ? 'Back to Products' : 'Zurück zu Produkten';
    }
    return language === 'en' ? 'Back to Administration' : 'Zurück zur Verwaltung';
  };

  if (!permissions.canManageProducts) {
    return null;
  }

  return (
    <AdminPageLayout
      title={null}
      description={null}
      icon={null}
      actions={null}
    >
      <div className="flex items-center justify-start mb-6">
        <BackButton label={getBackButtonLabel()} onClick={() => navigate(backPath)} />
      </div>
      <ProductManagementModal 
        embedded={true}
        onProductsChange={handleProductsChange}
        onCancel={handleCancel}
        initialProduct={null}
      />
    </AdminPageLayout>
  );
};

export default VerwaltungCreateProduct;