import {
  CreditCardIcon,
  MessageSquareIcon,
  RefreshCwIcon,
  TruckIcon,
} from "lucide-react";
import React from "react";
import { Card, CardContent } from "../../../../components/ui/card";

export const BenefitsByAnima = (): JSX.Element => {
  // Define benefits data for mapping
  const benefits = [
    {
      icon: <TruckIcon className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Free Shipping & Returns",
      description: "For all orders over ৳199.00",
    },
    {
      icon: <CreditCardIcon className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Secure Payment",
      description: "We ensure secure payment",
    },
    {
      icon: <RefreshCwIcon className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Money Back Guarantee",
      description: "Returning money 30 days",
    },
    {
      icon: <MessageSquareIcon className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "24/7 Customer Support",
      description: "Friendly customer support",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
      {benefits.map((benefit, index) => (
        <Card
          key={index}
          className="border-none shadow-none bg-transparent"
        >
          <CardContent className="flex items-center gap-3 sm:gap-4 p-0">
            <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 md:w-[86px] md:h-[86px] bg-gray-50 rounded-full flex-shrink-0">
              {benefit.icon}
            </div>
            <div className="flex flex-col items-start gap-0.5 sm:gap-1 md:gap-1.5 flex-1">
              <h3 className="self-stretch font-medium text-sm sm:text-base md:text-lg text-gray-900 leading-tight">
                {benefit.title}
              </h3>
              <p className="self-stretch font-normal text-xs sm:text-xs md:text-sm text-gray-600 leading-tight sm:leading-5 md:leading-[22px]">
                {benefit.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
