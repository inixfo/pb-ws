import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ShoppingCartIcon,
} from "lucide-react";
import React, { useEffect, useState } from 'react';
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";
import { StarRating } from "../../../../components/ui/StarRating";
import { productService } from '../../../../services/api';
import { Product, ProductImage } from '../../../../types/products';
import { useNavigate } from 'react-router-dom';
import { useCart } from "../../../../context/CartContext";

// Helper function to get image URL from product
const getProductImageUrl = (product: Product): string => {
  if (typeof product.primary_image === 'string') {
    return product.primary_image;
  }
  if (product.primary_image && 'image' in product.primary_image) {
    return product.primary_image.image;
  }
  return product.image || '/placeholder.png';
};

export const TrendingProductsSection = (): JSX.Element => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const data = await productService.getTrending(8);
        const products = Array.isArray(data) ? data : data.results || [];
        setProducts(products);
        setError(null);
      } catch (err) {
        setError('Failed to load trending products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const handleProductClick = (productId: number, slug: string) => {
    if (slug && slug.trim() !== '') {
      navigate(`/products/${slug}`);
    } else {
      navigate(`/products/${productId}`);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, productId: number, slug: string) => {
    e.stopPropagation();
    if (slug && slug.trim() !== '') {
      navigate(`/products/${slug}`);
    } else {
      navigate(`/products/${productId}`);
    }
  };

  if (loading) {
    return (
      <section className="flex flex-col w-full items-start gap-6">
        <div className="flex flex-col items-start gap-6 w-full">
          <h2 className="font-heading-desktop-h3 text-gray-900">Trending products</h2>
          <Separator className="w-full" />
        </div>
        <div className="w-full flex justify-center py-8">
          <div className="w-12 h-12 border-4 border-primarymain border-t-transparent rounded-full animate-spin"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col w-full items-start gap-6">
        <div className="flex flex-col items-start gap-6 w-full">
          <h2 className="font-heading-desktop-h3 text-gray-900">Trending products</h2>
          <Separator className="w-full" />
        </div>
        <div className="w-full flex justify-center py-8 text-red-500">{error}</div>
      </section>
    );
  }

  return (
    <section className="flex flex-col w-full items-start gap-6">
      <div className="flex flex-col items-start gap-6 w-full">
        <h2 className="font-heading-desktop-h3 font-[number:var(--heading-desktop-h3-font-weight)] text-gray-900 text-[length:var(--heading-desktop-h3-font-size)] tracking-[var(--heading-desktop-h3-letter-spacing)] leading-[var(--heading-desktop-h3-line-height)] [font-style:var(--heading-desktop-h3-font-style)]">
          Trending products
        </h2>
        <Separator className="w-full" />
      </div>
      <div className="relative flex w-full">
        <Button
          variant="outline"
          size="icon"
          className="absolute -left-5 top-[181px] z-10 rounded-full bg-white-100 border-[#e0e5eb]"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <div className="flex gap-6 w-full">
          {products.map((product) => (
            <Card
              key={product.id}
              className="flex-1 rounded-lg overflow-hidden bg-white-100 cursor-pointer"
              onClick={() => handleProductClick(product.id, product.slug)}
            >
              <div className="flex flex-col items-center justify-center p-6 relative">
                <img
                  className="w-[258px] h-60 object-contain"
                  alt={product.name}
                  src={getProductImageUrl(product)}
                />
              </div>
              <CardContent className="flex flex-col items-start gap-3 pt-0 pb-4 px-4 bg-white-100">
                <div className="flex flex-col items-start gap-2 w-full">
                  <StarRating
                    rating={product.average_rating || product.rating || 0}
                    showCount
                    count={product.total_reviews || product.reviews_count || 0}
                  />
                  <h3 className="font-navigation-nav-link-small font-[number:var(--navigation-nav-link-small-font-weight)] text-gray-900 text-[length:var(--navigation-nav-link-small-font-size)] leading-[var(--navigation-nav-link-small-line-height)] tracking-[var(--navigation-nav-link-small-letter-spacing)] [font-style:var(--navigation-nav-link-small-font-style)]">
                    {product.name}
                  </h3>
                </div>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-heading-desktop-h5 font-[number:var(--heading-desktop-h5-font-weight)] text-gray-900 text-[length:var(--heading-desktop-h5-font-size)] tracking-[var(--heading-desktop-h5-letter-spacing)] leading-[var(--heading-desktop-h5-line-height)] [font-style:var(--heading-desktop-h5-font-style)]">
                      ${product.sale_price || product.price}
                    </span>
                    {product.sale_price && product.sale_price < product.price && (
                      <span className="text-gray-400 text-sm line-through">
                        ${product.price}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-10 h-10 bg-gray-100 rounded-lg"
                    onClick={(e) => handleAddToCart(e, product.id, product.slug)}
                  >
                    <ShoppingCartIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-[181px] z-10 rounded-full bg-white-100 border-[#e0e5eb]"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}; 