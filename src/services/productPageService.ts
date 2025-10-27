import { supabase } from '@/lib/supabase';
import { PageBuilderData } from '@/types/pagebuilder';

// Function to generate a URL-friendly slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '') // remove special characters
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-'); // remove multiple hyphens
};

export const getProductPageData = async (mentorProductId: string) => {
    const { data: mentorProduct, error: mentorProductError } = await supabase
        .from('mentorbooking_products')
        .select('product_page_id, name')
        .eq('id', mentorProductId)
        .single();

    if (mentorProductError) throw new Error(mentorProductError.message);
    if (!mentorProduct) throw new Error('Mentor product not found.');

    if (!mentorProduct.product_page_id) {
        return { product: null, name: mentorProduct.name };
    }

    const { data: productPage, error: productPageError } = await supabase
        .from('products')
        .select('content')
        .eq('id', mentorProduct.product_page_id)
        .single();

    if (productPageError) throw new Error(productPageError.message);

    return { product: productPage.content as PageBuilderData, name: mentorProduct.name };
};

export const saveProductPage = async (
  mentorProductId: string,
  content: PageBuilderData,
  productName: string
): Promise<{ slug: string }> => {
  // Check if a product page already exists for this mentor product
  const { data: existingMentorProduct, error: existingMentorProductError } = await supabase
    .from('mentorbooking_products')
    .select('product_page_id')
    .eq('id', mentorProductId)
    .single();

  if (existingMentorProductError) throw new Error(existingMentorProductError.message);

  const slug = generateSlug(productName);

  if (existingMentorProduct?.product_page_id) {
    // Update existing product page
    const { error } = await supabase
      .from('products')
      .update({ content, slug, name: productName })
      .eq('id', existingMentorProduct.product_page_id);

    if (error) throw error;
  } else {
    // Create new product page
    const { data: newProductPage, error: newProductPageError } = await supabase
      .from('products')
      .insert({
        name: productName,
        slug: slug,
        content: content,
        status: 'draft',
      })
      .select('id')
      .single();

    if (newProductPageError) throw newProductPageError;

    // Link new product page to mentor product
    const { error: updateError } = await supabase
      .from('mentorbooking_products')
      .update({ product_page_id: newProductPage.id })
      .eq('id', mentorProductId);

    if (updateError) throw updateError;
  }

  return { slug };
};
