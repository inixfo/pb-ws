import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

export const TrackOrderLookup = (): JSX.Element => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = code.trim();
    if (value) navigate(`/track-order/${value}`);
  };

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <HeaderByAnima showHeroSection={false} />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Track your order</h1>
        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4 items-center">
          <Input
            placeholder="Enter order number or ID"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full"
          />
          <Button type="submit" className="w-full">Track Order</Button>
        </form>
      </main>
      <CtaFooterByAnima />
    </div>
  );
}; 