import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Product } from '@/services/events/productService';
import { ProductFormValues } from '../types';

interface ProductFormDebugInfoProps {
  form: UseFormReturn<ProductFormValues>;
  editingProduct: Product | null;
}

export function ProductFormDebugInfo({ form, editingProduct }: ProductFormDebugInfoProps) {
  if (!import.meta.env.DEV) return null;
  
  // Create copies of the objects without IDs for display
  const formValues = { ...form.getValues() };
  const productForDisplay = editingProduct ? { ...editingProduct } : null;
  
  // Remove IDs from debug display
  if (productForDisplay) {
    delete productForDisplay.id;
  }
  
  return (
    <div className="bg-yellow-100 dark:bg-yellow-900 p-2 mb-4 rounded text-xs">
      <details>
        <summary>Debug: Current Form Values</summary>
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(formValues, null, 2)}
        </pre>
        <p className="mt-2 font-bold">Debug: editingProduct</p>
        <pre className="whitespace-pre-wrap">
          {productForDisplay ? JSON.stringify(productForDisplay, null, 2) : "null"}
        </pre>
      </details>
    </div>
  );
}