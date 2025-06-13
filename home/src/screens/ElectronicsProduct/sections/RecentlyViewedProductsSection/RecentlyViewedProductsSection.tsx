import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from "lucide-react";
import React from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";

// Product data for mapping
const products = [
  {
    id: 1,
    name: "Sony Dualsense Edge Controller",
    price: "৳200.00",
    originalPrice: null,
    discount: null,
    rating: 5,
    reviews: 187,
    image: "/image-15.png",
    halfStar: false,
  },
  {
    id: 2,
    name: "VRB01 Camera Nikon Max",
    price: "৳652.00",
    originalPrice: "৳785.00",
    discount: "-17%",
    rating: 5,
    reviews: 14,
    image: "/image-16.png",
    halfStar: false,
  },
  {
    id: 3,
    name: "Apple iPhone 14 128GB Blue",
    price: "৳899.00",
    originalPrice: null,
    discount: null,
    rating: 4.5,
    reviews: 335,
    image: "/image-17.png",
    halfStar: true,
  },
  {
    id: 4,
    name: "Tablet Apple iPad Pro M1",
    price: "৳640.00",
    originalPrice: null,
    discount: null,
    rating: 4.5,
    reviews: 49,
    image: "/image-18.png",
    halfStar: true,
  },
];

export const RecentlyViewedProductsSection = (): JSX.Element => {
  // Function to render star ratings
  const renderStars = (rating: number, halfStar: boolean) => {
    const stars = [];
    const fullStars = Math.floor(rating);

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <StarIcon
          key={`full-${i}`}
          className="w-3 h-3 fill-current text-yellow-500"
        />,
      );
    }

    if (halfStar) {
      stars.push(
        <img
          key="half-star"
          className="w-3 h-3"
          alt="StarIcon half"
          src="/star-half.svg"
        />,
      );
    }

    return stars;
  };

  return (
    <section className="flex flex-col w-full items-start gap-6 relative">
      <div className="gap-6 flex flex-col items-start relative self-stretch w-full">
        <h2 className="relative font-heading-desktop-h3 text-gray-900 text-[length:var(--heading-desktop-h3-font-size)] leading-[var(--heading-desktop-h3-line-height)] tracking-[var(--heading-desktop-h3-letter-spacing)] font-semibold">
          Viewed products
        </h2>
        <Separator className="w-full" />
      </div>

      <div className="flex gap-6 self-stretch w-full items-start relative">
        {products.map((product) => (
          <Card
            key={product.id}
            className="flex flex-col w-full items-start bg-white-100 rounded-lg overflow-hidden border-none"
          >
            <div className="flex flex-col items-center justify-center p-6 relative self-stretch w-full">
              {product.discount && (
                <Badge className="absolute top-4 left-4 bg-dangermain text-white-100">
                  {product.discount}
                </Badge>
              )}
              <img
                className="w-[258px] h-60 object-contain"
                alt={product.name}
                src={product.image}
              />
            </div>

            <CardContent className="flex flex-col items-start gap-3 pt-0 pb-4 px-4 relative self-stretch w-full bg-white-100">
              <div className="flex flex-col items-start gap-2 relative self-stretch w-full">
                <div className="flex items-center gap-2 relative self-stretch w-full">
                  <div className="inline-flex items-start gap-1 relative">
                    {renderStars(product.rating, product.halfStar)}
                  </div>
                  <span className="relative flex-1 font-body-extra-small text-gray-400 text-[length:var(--body-extra-small-font-size)] tracking-[var(--body-extra-small-letter-spacing)] leading-[var(--body-extra-small-line-height)]">
                    ({product.reviews})
                  </span>
                </div>

                <h3 className="relative self-stretch font-navigation-nav-link-small text-gray-900 text-[length:var(--navigation-nav-link-small-font-size)] leading-[var(--navigation-nav-link-small-line-height)] tracking-[var(--navigation-nav-link-small-letter-spacing)]">
                  {product.name}
                </h3>
              </div>

              <div className="flex items-center justify-between relative self-stretch w-full">
                <div className="flex h-10 items-center gap-2 relative">
                  <span className="relative font-heading-desktop-h5 text-gray-900 text-[length:var(--heading-desktop-h5-font-size)] tracking-[var(--heading-desktop-h5-letter-spacing)] leading-[var(--heading-desktop-h5-line-height)] whitespace-nowrap">
                    {product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="relative font-normal text-gray-400 text-sm leading-[21px] line-through">
                      {product.originalPrice}
                    </span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 p-3 bg-gray-100 rounded-lg"
                >
                  <img
                    className="w-4 h-4"
                    alt="Add to cart"
                    src="/icon-4.svg"
                  />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          size="icon"
          className="inline-flex items-center justify-center p-3 absolute top-[181px] right-[-20px] bg-white-100 rounded-full border border-solid border-[#e0e5eb] z-10"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="inline-flex items-center justify-center p-3 absolute top-[181px] left-[-20px] bg-white-100 rounded-full border border-solid border-[#e0e5eb] z-10"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>
      </div>
    </section>
  );
}; 