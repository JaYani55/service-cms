import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageBuilderForm } from '@/components/pagebuilder/PageBuilderForm';
import { getProductPageData } from '@/services/productPageService';
import { Loader2 } from 'lucide-react';
import { PageBuilderData } from '@/types/pagebuilder';

const PageBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<PageBuilderData | null>(null);
  const [productName, setProductName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const { product, name } = await getProductPageData(id);
        setInitialData(product);
        setProductName(name);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading product data: {error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Page Builder for {productName}</h1>
      <PageBuilderForm initialData={initialData} productId={id} productName={productName} />
    </div>
  );
};

export default PageBuilder;
