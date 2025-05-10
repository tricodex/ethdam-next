"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowDown, ArrowRightLeft, Droplets, Flame, Settings, ChevronDown } from "lucide-react";

const TokenIcon = ({ type }: { type: "water" | "fire" }) => {
  return (
    <div className={`rounded-full p-2 ${type === "water" ? "bg-water" : "bg-fire"}`}>
      {type === "water" ? (
        <Droplets className="text-white" size={24} />
      ) : (
        <Flame className="text-white" size={24} />
      )}
    </div>
  );
};

export default function Home() {
  const [fromToken, setFromToken] = useState<"water" | "fire">("water");
  const [toToken, setToToken] = useState<"water" | "fire">("fire");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty input
    if (value === "") {
      setFromAmount("");
      return;
    }

    // Only allow numbers and one decimal point
    if (!/^\d*\.?\d*$/.test(value)) return;

    // Limit to 2 decimal places
    if (value.includes('.')) {
      const [whole, decimal] = value.split('.');
      if (decimal && decimal.length > 2) return;
    }

    setFromAmount(value);
  };

  return (
    <div className="dark-gradient min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Image src="/logo.svg" alt="ROFL Swap Logo" width={40} height={40} />
          <h1 className="text-xl font-bold text-white">ROFL Swap</h1>
        </div>
        <Button variant="ghost" className="text-white">
          <Settings size={20} />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="glass-card max-w-md w-full mx-auto overflow-hidden shadow-2xl">
          <CardHeader className="p-6 border-b border-border">
            <CardTitle className="text-xl font-bold flex items-center justify-between">
              <span>Swap</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                  Limit
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                  Pool
                </Button>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {/* From Token */}
            <div className="p-4 bg-muted rounded-xl">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">From</span>
                <span className="text-sm text-muted-foreground">Balance: 0.0</span>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  inputMode="decimal"
                  value={fromAmount}
                  onChange={handleFromAmountChange}
                  className="bg-transparent text-2xl font-semibold flex-1 focus:outline-none rounded-lg px-3 py-1.5 w-[140px] placeholder:text-muted-foreground/50"
                  placeholder="0.00"
                />
                <Button 
                  variant="ghost" 
                  className={`flex items-center gap-2 ${fromToken === "water" ? "text-water" : "text-fire"}`}
                >
                  <TokenIcon type={fromToken} />
                  <span className="font-semibold">{fromToken === "water" ? "WATER" : "FIRE"}</span>
                  <ChevronDown size={16} />
                </Button>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center relative" style={{ transform: 'translateY(-50%)', top: '50%', marginTop: '44px' }}>
              <Button 
                onClick={handleSwapTokens}
                size="icon" 
                className="rounded-full bg-muted hover:bg-accent"
              >
                <ArrowRightLeft size={18} />
              </Button>
            </div>

            {/* To Token */}
            <div className="p-4 bg-muted rounded-xl">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">To</span>
                <span className="text-sm text-muted-foreground">Balance: 0.0</span>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={toAmount}
                  readOnly
                  className="bg-transparent text-2xl font-semibold flex-1 focus:outline-none"
                  placeholder="0.00"
                />
                <Button 
                  variant="ghost" 
                  className={`flex items-center gap-2 ${toToken === "water" ? "text-water" : "text-fire"}`}
                >
                  <TokenIcon type={toToken} />
                  <span className="font-semibold">{toToken === "water" ? "WATER" : "FIRE"}</span>
                  <ChevronDown size={16} />
                </Button>
              </div>
            </div>

            {/* Price Info */}
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">1 {fromToken.toUpperCase()} = 1 {toToken.toUpperCase()}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Private Exchange</span>
                <span className="font-medium text-water">Oasis ROFL</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 pt-0">
            <Button 
              className="w-full py-6 water-fire-gradient font-bold text-white"
              disabled={!fromAmount || parseFloat(fromAmount) <= 0}
            >
              Connect Wallet
            </Button>
          </CardFooter>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>Powered by Oasis Sapphire and ROFL Framework</p>
        <div className="flex justify-center gap-4 mt-2">
          <span>Built for ETHDam Hackathon 2025</span>
        </div>
      </footer>
    </div>
  );
}
