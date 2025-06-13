import React, { useState, useRef, useEffect } from "react";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { ChevronRightIcon } from "lucide-react";
import { productService } from "../../services/api";
import { Product } from "../../types/products";
import { useNavigate } from "react-router-dom";

export const ShopCategories = (): JSX.Element => {
  // Category data
  const categories = [
    { title: "Smartphones", image: "/image.png", brands: ["Apple iPhone", "Samsung", "Xiaomi", "Nokia", "Meizu"] },
    { title: "Accessories", image: "/image-1.png", brands: ["Accessory Kits", "Batteries & Battery Packs", "Cables", "Car Accessories", "Charges & Power Adapters", "FM Transmitters"] },
    { title: "Tablets", image: "/image-2.png", brands: ["Apple iPad", "Android Tablets", "Samsung", "Xiaomi", "Lenovo"] },
    { title: "Wearable Electronics", image: "/image-3.png", brands: ["Smart Watches", "Fitness Trackers", "Smart Glasses", "E-books", "Clips, Arm & Wristbands", "Voice Recorders"] },
    { title: "Computers & Laptops", image: "/image-4.png", brands: ["Asus", "Acer", "HP (Hewlett Packard)", "Lenovo", "Apple MacBook"] },
    { title: "Cameras, Photo & Video", image: "/image-5.png", brands: ["Photo Cameras", "Video Cameras", "Action Cameras", "Camcorders", "Studio Equipment", "Bags and Covers"] },
    { title: "Headphones", image: "/image-6.png", brands: ["Apple", "Defunc", "HyperX", "JBL", "Logitech", "Panasonic"] },
    { title: "Video Games", image: "/image-7.png", brands: ["PlayStation 5", "PlayStation Games", "Gaming PCs", "Nintendo Switch", "Xbox Series X/S", "Gaming Peripherals"] },
  ];

  // Add state for products
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getAll();
        const products = Array.isArray(data) ? data : data.results || [];
        setProducts(products);
        setError(null);
      } catch (err) {
        setError('Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Brand logos
  const brandLogos = [
    { alt: "Frame", src: "/frame-573-1.svg" },
    { alt: "Inner logo", src: "/inner-logo.svg" },
    { alt: "Frame", src: "/frame-573.svg" },
    { alt: "Inner logo", src: "/inner-logo-2.svg" },
    { alt: "Inner logo", src: "/inner-logo-1.svg" },
    { alt: "Inner logo", src: "/inner-logo-3.svg" },
  ];

  // Render star ratings
  const renderStars = (rating: number) => (
    <div className="inline-flex items-start gap-1">
      {[...Array(5)].map((_, i) => (
        <img
          key={i}
          className="w-3 h-3"
          alt={i < rating ? "Star fill" : "Star"}
          src={i < rating ? "/star-fill.svg" : "/star.svg"}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col w-full bg-white-100">
      <HeaderByAnima showHeroSection={false} />
      <main className="container mx-auto mt-24">
        {/* Breadcrumb */}
        <div className="flex flex-col w-full items-start gap-6 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 text-sm font-medium">Home</span>
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400 text-sm font-medium">Categories</span>
          </div>
          <h1 className="text-gray-900 text-2xl font-semibold">Shop categories</h1>
        </div>
        {/* Brand Logos */}
        <div className="flex items-center gap-6 mb-6 overflow-x-auto">
          {brandLogos.map((logo, index) => (
            <Card key={index} className="w-[196px] h-28 rounded-xl shrink-0">
              <CardContent className="flex items-center justify-center h-full p-4">
                <img className="max-w-[164px] max-h-20" alt={logo.alt} src={logo.src} />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Categories Grid - First Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.slice(0, 4).map((category, index) => (
            <Card key={index} className="rounded-lg overflow-hidden border-0">
              <CardContent className="p-0">
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                  <img className="w-[258px] h-[184px]" alt={category.title} src={category.image} />
                </div>
                <div className="flex flex-col items-start justify-center gap-3 p-6 pt-4">
                  <h3 className="font-heading-desktop-h6 text-gray-900 font-semibold">{category.title}</h3>
                  <div className="flex flex-col items-start gap-2 w-full">
                    {category.brands.map((brand, idx) => (
                      <span key={idx} className="text-gray-700 text-sm">{brand}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Categories Grid - Second Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.slice(4, 8).map((category, index) => (
            <Card key={index} className="rounded-lg overflow-hidden border-0">
              <CardContent className="p-0">
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                  <img className="w-[258px] h-[184px]" alt={category.title} src={category.image} />
                </div>
                <div className="flex flex-col items-start justify-center gap-3 p-6 pt-4">
                  <h3 className="font-heading-desktop-h6 text-gray-900 font-semibold">{category.title}</h3>
                  <div className="flex flex-col items-start gap-2 w-full">
                    {category.brands.map((brand, idx) => (
                      <span key={idx} className="text-gray-700 text-sm">{brand}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Featured Products Banner */}
        <div className="flex flex-col md:flex-row items-start gap-6 pt-2 mb-10">
          {/* iPhone Banner */}
          <div className="w-full md:w-[746px] h-80 rounded-2xl overflow-hidden bg-gradient-to-r from-[rgba(172,203,238,1)] to-[rgba(231,240,253,1)] relative">
            <div className="absolute top-[95px] left-[440px] flex flex-col w-[266px] gap-2">
              <h2 className="text-gray-900 text-2xl font-semibold">iPhone 14</h2>
              <p className="text-gray-700 text-sm">Apple iPhone 14 128GB Blue</p>
            </div>
            <Button className="absolute top-[185px] left-[440px] bg-primarymain text-white-100">
              From ৳899
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Button>
            <img className="absolute w-[416px] h-80 top-0 left-0 object-cover" alt="iPhone 14" src="/image-8.png" />
          </div>
          {/* iPad Banner */}
          <div className="w-full md:w-[526px] h-80 rounded-2xl overflow-hidden bg-gradient-to-r from-[rgba(253,203,241,1)] to-[rgba(255,236,250,1)] relative">
            <div className="absolute w-[239px] h-[107px] top-8 left-[146px] text-center">
              <img className="absolute w-[30px] h-[30px] top-0 left-[103px]" alt="Apple" src="/apple.svg" />
              <p className="absolute top-[45px] left-[62px] text-gray-700 text-sm">Deal of the week</p>
              <h2 className="absolute w-[235px] top-[71px] left-0 text-gray-900 text-2xl font-semibold text-center">iPad Pro M1</h2>
            </div>
            <img className="absolute w-[525px] h-[159px] top-[161px] left-px object-cover" alt="iPad Pro" src="/image-9.png" />
          </div>
        </div>
        {/* Products Grid - First Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-8">
              <div className="w-12 h-12 border-4 border-primarymain border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="col-span-full flex justify-center items-center py-8 text-red-500">{error}</div>
          ) : products.length === 0 ? (
            <div className="col-span-full flex justify-center items-center py-8 text-gray-500">No products found.</div>
          ) : (
            products.slice(0, 4).map((product) => (
              <Card key={product.id} className="rounded-lg overflow-hidden border-0 bg-white-100">
                <CardContent className="p-0">
                  <div className="relative flex flex-col items-center justify-center p-6">
                    {product.sale_price && product.sale_price < product.price && (
                      <Badge className="absolute top-4 left-4 bg-dangermain text-white-100">
                        -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
                      </Badge>
                    )}
                    {product.is_new && (
                      <Badge className="absolute top-4 left-4 bg-infomain text-white-100">New</Badge>
                    )}
                    <img className="w-[258px] h-60" alt={product.name} src={product.image || (product.images && product.images[0])} />
                  </div>
                  <div className="flex flex-col items-start gap-3 pt-0 pb-4 px-4">
                    <div className="flex flex-col items-start gap-2 w-full">
                      <div className="flex items-center gap-2 w-full">
                        {renderStars(product.average_rating ?? product.rating ?? 0)}
                        <span className="text-gray-400 text-xs">({product.reviews_count})</span>
                      </div>
                      <h3 className="text-gray-900 text-sm font-medium">{product.name}</h3>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 text-xl font-semibold">${product.sale_price || product.price}</span>
                        {product.sale_price && product.sale_price < product.price && (
                          <span className="text-gray-400 text-sm line-through">${product.price}</span>
                        )}
                      </div>
                      <Button variant="secondary" size="icon" className="w-10 h-10 p-3 bg-gray-100 rounded-lg" onClick={() => navigate(`/products/${product.slug || product.id}`)}>
                        <img className="w-4 h-4" alt="Add to cart" src="/icon-5.svg" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        {/* Products Grid - Second Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(4, 8).map((product) => (
            <Card key={product.id} className="rounded-lg overflow-hidden border-0 bg-white-100">
              <CardContent className="p-0">
                <div className="flex flex-col items-center justify-center p-6">
                  <img className="w-[258px] h-60" alt={product.name} src={product.image || (product.images && product.images[0])} />
                </div>
                <div className="flex flex-col items-start gap-3 pt-0 pb-4 px-4">
                  <div className="flex flex-col items-start gap-2 w-full">
                    <div className="flex items-center gap-2 w-full">
                      {renderStars(product.average_rating ?? product.rating ?? 0)}
                      <span className="text-gray-400 text-xs">({product.reviews_count})</span>
                    </div>
                    <h3 className="text-gray-900 text-sm font-medium">{product.name}</h3>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 text-xl font-semibold">${product.sale_price || product.price}</span>
                    </div>
                    <Button variant="secondary" size="icon" className="w-10 h-10 p-3 bg-gray-100 rounded-lg" onClick={() => navigate(`/products/${product.slug || product.id}`)}>
                      <img className="w-4 h-4" alt="Add to cart" src="/icon-5.svg" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <CtaFooterByAnima />
    </div>
  );
}; 