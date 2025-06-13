import React from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useProduct } from "../../../../contexts/ProductContext";

const products = [
  {
    id: 1,
    name: "Apple iPhone 14 Plus 128GB Blue",
    price: "৳940.00",
    discountPercentage: null,
    originalPrice: null,
    image: "/image-9.png",
    checked: false,
  },
  {
    id: 2,
    name: "Headphones Apple AirPods 2 Pro",
    price: "৳224.00",
    discountPercentage: "32%",
    originalPrice: "৳330.00",
    image: "/image-7.png",
    checked: true,
  },
  {
    id: 3,
    name: "Wireless charger for iPhone",
    price: "৳26.00",
    discountPercentage: "48%",
    originalPrice: "৳50.00",
    image: "/image-8.png",
    checked: true,
  },
];

export const CheaperTogetherSection = (): JSX.Element => {
  const navigate = useNavigate();
  const { product } = useProduct();

  const handlePurchaseTogether = () => {
    // Navigate to the main product page
    if (product) {
      if (product.slug && product.slug.trim() !== '') {
        navigate(`/products/${product.slug}`);
      } else {
        navigate(`/products/${product.id}`);
      }
    } else {
      // Fallback to the first product in the list
      navigate(`/products/${products[0].id}`);
    }
  };

  return (
    <section className="flex flex-col items-center gap-16 pt-16 pb-10 px-4 bg-gray-50 rounded-2xl w-full">
      <div className="flex flex-col items-center gap-8 w-full max-w-[1076px]">
        <h3 className="font-heading-desktop-h3 text-gray-900 text-[length:var(--heading-desktop-h3-font-size)] leading-[var(--heading-desktop-h3-line-height)] tracking-[var(--heading-desktop-h3-letter-spacing)] font-[number:var(--heading-desktop-h3-font-weight)] [font-style:var(--heading-desktop-h3-font-style)]">
          Cheaper together
        </h3>
        <div className="flex flex-wrap justify-center gap-6 w-full">
          {products.map((product, index) => (
            <React.Fragment key={product.id}>
              {index > 0 && (
                <div className="flex items-center justify-center">
                  <img className="w-6 h-6" alt="Plus" src="/plus.svg" />
                </div>
              )}
              <div className="flex flex-col w-[306px] items-start gap-4">
                <Card className="w-full h-[306px] overflow-hidden rounded-lg bg-white-100">
                  <CardContent className="p-0">
                    <div className="relative w-full h-full">
                      <div
                        className="relative w-[274px] h-[274px] mx-auto mt-4"
                        style={{
                          backgroundImage: `url(${product.image})`,
                          backgroundSize: "100% 100%",
                        }}
                      >
                        {product.checked ? (
                          <img
                            className={`absolute top-0 right-0 w-6 h-6 ${product.id === 1 ? "opacity-50" : ""}`}
                            alt="Checkbox"
                            src={
                              product.id === 1 ? "/union.svg" : "/checkbox.svg"
                            }
                          />
                        ) : (
                          <div className="relative w-6 h-6 left-[250px]">
                            <img
                              className="absolute w-[18px] h-[18px] top-[3px] left-[3px]"
                              alt="Union"
                              src="/union.svg"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex flex-col items-start gap-2 w-full">
                  <p className="font-navigation-nav-link-small text-gray-900 text-[length:var(--navigation-nav-link-small-font-size)] leading-[var(--navigation-nav-link-small-line-height)] tracking-[var(--navigation-nav-link-small-letter-spacing)] font-[number:var(--navigation-nav-link-small-font-weight)] [font-style:var(--navigation-nav-link-small-font-style)]">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-2.5 w-full">
                    {product.discountPercentage && (
                      <Badge className="bg-dangermain text-white-100 px-2 py-0.5 rounded">
                        <span className="font-navigation-nav-link-extra-small text-[length:var(--navigation-nav-link-extra-small-font-size)] leading-[var(--navigation-nav-link-extra-small-line-height)] tracking-[var(--navigation-nav-link-extra-small-letter-spacing)] font-[number:var(--navigation-nav-link-extra-small-font-weight)] [font-style:var(--navigation-nav-link-extra-small-font-style)]">
                          -{product.discountPercentage}
                        </span>
                      </Badge>
                    )}
                    <span className="font-heading-desktop-h6 text-gray-900 text-[length:var(--heading-desktop-h6-font-size)] leading-[var(--heading-desktop-h6-line-height)] tracking-[var(--heading-desktop-h6-letter-spacing)] font-[number:var(--heading-desktop-h6-font-weight)] [font-style:var(--heading-desktop-h6-font-style)]">
                      {product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="flex-1 font-normal text-gray-400 text-xs tracking-[0] leading-[18px] line-through [font-family:'Inter',Helvetica]">
                        {product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      <footer className="flex flex-col w-full max-w-[1296px] items-center gap-10">
        <Separator className="w-full h-px" />
        <div className="flex justify-between items-center w-full max-w-[1076px]">
          <span className="font-normal text-gray-600 text-sm leading-[22px] [font-family:'Inter',Helvetica] tracking-[0]">
            Total for selected products
          </span>
          <div className="flex items-center gap-4">
            <span className="font-heading-desktop-h5 text-gray-900 text-[length:var(--heading-desktop-h5-font-size)] leading-[var(--heading-desktop-h5-line-height)] tracking-[var(--heading-desktop-h5-letter-spacing)] font-[number:var(--heading-desktop-h5-font-weight)] [font-style:var(--heading-desktop-h5-font-style)]">
              ৳1,164.00
            </span>
            <Button className="bg-primarymain text-white-100 rounded-lg px-5 py-2.5" onClick={handlePurchaseTogether}>
              <span className="font-navigation-nav-link-small text-[length:var(--navigation-nav-link-small-font-size)] leading-[var(--navigation-nav-link-small-line-height)] tracking-[var(--navigation-nav-link-small-letter-spacing)] font-[number:var(--navigation-nav-link-small-font-weight)] [font-style:var(--navigation-nav-link-small-font-style)]">
                Purchase together
              </span>
            </Button>
          </div>
        </div>
      </footer>
    </section>
  );
}; 