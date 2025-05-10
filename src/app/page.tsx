"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRightLeft, Droplets, Flame, Settings, ChevronDown } from "lucide-react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useBalance } from 'wagmi';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { contractConfig } from './contract-config';
import { parseEther, formatEther, stringToBytes, toHex, decodeEventLog } from 'viem';
import { config } from './wagmi-config';
import { WATER_TOKEN_ADDRESS, FIRE_TOKEN_ADDRESS } from './contract-config';
import { erc20Abi } from 'viem';

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
  const [swapStatus, setSwapStatus] = useState<"idle" | "approving" | "placing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>();
  const [orderHash, setOrderHash] = useState<`0x${string}` | undefined>();
  const [pendingAmount, setPendingAmount] = useState<bigint | undefined>();
  const [displayedOrderId, setDisplayedOrderId] = useState<string | null>(null);

  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  const { data: orderReceipt, isLoading: isOrderConfirming, isSuccess: isOrderConfirmed } = useWaitForTransactionReceipt({
    hash: orderHash,
  });

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Contract write hook for placing orders
  const { writeContractAsync } = useWriteContract();

  // Enhanced network detection
  const SAPPHIRE_TESTNET_ID = 23295;
  const isCorrectNetwork = chainId === SAPPHIRE_TESTNET_ID;

  // Get chain info from config
  const currentChain = config.chains.find(chain => chain.id === chainId);

  const fromTokenAddress = fromToken === 'water' ? WATER_TOKEN_ADDRESS : FIRE_TOKEN_ADDRESS;
  const { data: fromBalanceData, isLoading: isFromBalanceLoading } = useBalance({
    address: address,
    token: fromTokenAddress,
    chainId: chainId,
  });
  const formattedFromBalance = fromBalanceData ? parseFloat(formatEther(fromBalanceData.value)).toFixed(2) : "0.0";

  const toTokenAddress = toToken === 'water' ? WATER_TOKEN_ADDRESS : FIRE_TOKEN_ADDRESS;
  const { data: toBalanceData, isLoading: isToBalanceLoading } = useBalance({
    address: address,
    token: toTokenAddress,
    chainId: chainId,
  });
  const formattedToBalance = toBalanceData ? parseFloat(formatEther(toBalanceData.value)).toFixed(2) : "0.0";

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };


  const handleSwitchNetwork = async () => {
    try {
      console.log('Attempting to switch to Sapphire Testnet...');
      await switchChain({
        chainId: SAPPHIRE_TESTNET_ID,
        addEthereumChainParameter: {
          chainName: 'Oasis Sapphire Testnet',
          nativeCurrency: {
            name: 'ROSE',
            symbol: 'ROSE',
            decimals: 18,
          },
          rpcUrls: ['https://testnet.sapphire.oasis.dev'],
          blockExplorerUrls: ['https://explorer.oasis.io/testnet/sapphire'],
        }
      });
      console.log('Network switch request sent');
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  // Split the order placement into a separate function
  const handlePlaceOrder = async () => {
    if (!pendingAmount) return;
    
    const buyOrder = JSON.stringify({
      owner: address,
      token: WATER_TOKEN_ADDRESS,
      price: parseEther("1.0").toString(), // Same price
      size: pendingAmount.toString(),
      isBuy: true
    });
    const encryptedBuyOrder = toHex(stringToBytes(buyOrder));

    console.log(encryptedBuyOrder);
    try {
      setSwapStatus("placing");
      console.log('Initiating order placement...');
      
      const hash = await writeContractAsync({
        ...contractConfig,
        functionName: 'placeOrder',
        args: [encryptedBuyOrder],
      });

      if (!hash) {
        throw new Error('No transaction hash received');
      }

      console.log('Waiting for order confirmation...', hash);
      setOrderHash(hash);
      
    } catch (error) {
      console.error('Error during order placement:', error);
      setErrorMessage('Failed to place order');
      setSwapStatus("error");
    }
  };

  // Effect to handle approval confirmation
  useEffect(() => {
    if (isApprovalConfirmed) {
      console.log('Approval confirmed!');
      handlePlaceOrder();
    }
  }, [isApprovalConfirmed]);

  // Effect to handle order confirmation
  useEffect(() => {
    if (isOrderConfirmed && orderReceipt) {
      console.log('Order confirmed! Receipt:', orderReceipt);
      setSwapStatus("success");

      const orderPlacedEventAbiItem = contractConfig.abi.find(
        (item: any) => item.type === "event" && item.name === "OrderPlaced"
      );

      if (orderPlacedEventAbiItem) {
        for (const log of orderReceipt.logs) {
          // Filter logs by the contract address that emitted the event
          if (log.address.toLowerCase() === contractConfig.address.toLowerCase()) {
            try {
              const decodedLog = decodeEventLog({
                abi: [orderPlacedEventAbiItem], // ABI for the specific event
                data: log.data,
                topics: log.topics as any, // Cast topics to any to satisfy viem type if necessary
              });

              if (decodedLog.eventName === "OrderPlaced") {
                const orderId = (decodedLog.args as any).orderId; 
                console.log(`Order placed with ID: ${orderId}`);
                setDisplayedOrderId(orderId.toString()); // Store the order ID
                // You could store this orderId in a state if needed elsewhere
                break; 
              }
            } catch (e) {
              // This log might be from our contract but not the OrderPlaced event,
              // or there was an issue decoding it.
              // console.debug("Could not decode log or not the OrderPlaced event:", log, e);
            }
          }
        }
      } else {
        console.warn("OrderPlaced event ABI item not found in contractConfig.abi. Make sure the ABI is correctly configured.");
      }

      // Clear input fields on success
      setFromAmount("");
      setToAmount("");
      // Clear the pending amount
      setPendingAmount(undefined);
    }
  }, [isOrderConfirmed, orderReceipt]);

  const handleSwap = async () => {
    if (!fromAmount || !address) return;

    setSwapStatus("idle");
    setErrorMessage(null);
    setApprovalHash(undefined);
    setOrderHash(undefined);
    setDisplayedOrderId(null); // Reset displayed order ID when starting a new swap

    // Enhanced network check
    if (!isCorrectNetwork) {
      console.log('Wrong network detected, attempting to switch...');
      await handleSwitchNetwork();
      // Add a check to see if the switch was successful
      if (chainId !== SAPPHIRE_TESTNET_ID) {
        console.log('Network switch did not complete successfully');
        setErrorMessage("Failed to switch to Sapphire Network");
        return;
      }
    }

    try {
      // Determine which token to approve
      const tokenAddress = fromToken === 'water' ? WATER_TOKEN_ADDRESS : FIRE_TOKEN_ADDRESS;
      const amount = parseEther(fromAmount);
      // Store the amount for later use
      setPendingAmount(amount);

      // Approve token spending
      setSwapStatus("approving");
      console.log('Initiating token approval...');
      
      try {
        const hash = await writeContractAsync({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [contractConfig.address, amount],
        });

        if (!hash) {
          throw new Error('No transaction hash received');
        }

        console.log('Waiting for approval confirmation...', hash);
        setApprovalHash(hash);
        
      } catch (error) {
        console.error('Error during token approval:', error);
        setErrorMessage('Failed to approve token spending');
        setSwapStatus("error");
        setPendingAmount(undefined);
        return;
      }

    } catch (error) {
      console.error('Failed during swap process:', error);
      let errorMsg = 'Unknown error occurred';
      
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
        errorMsg = error.message;
      } else {
        console.error('Non-Error object thrown:', error);
      }
      
      setErrorMessage(errorMsg);
      setSwapStatus("error");
      setPendingAmount(undefined);
    }
  };

  const handleCloseSuccessPopup = () => {
    setSwapStatus("idle");
    setDisplayedOrderId(null);
    // Optionally clear amounts too if desired
    // setFromAmount("");
    // setToAmount("");
  };

  // Add this helper function to check if amount is valid
  const isValidAmount = (amount: string) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  };

  return (
    <div className="dark-gradient min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Image src="/logo.svg" alt="ROFL Swap Logo" width={40} height={40} />
          <h1 className="text-xl font-bold text-white">ROFL Swap</h1>
          <Image src="/logoOasis.svg" alt="ROFL Swap Logo" width={120} height={600} />
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="text-white">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              {chainId !== 23295 && (
                <Button 
                  className="bg-yellow-500 text-white"
                  onClick={handleSwitchNetwork}
                >
                  Switch to Sapphire
                </Button>
              )}
              <Button 
                variant="ghost" 
                className="text-white"
                onClick={() => disconnect()}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button 
              className="bg-blue-500 text-white"
              onClick={() => connect({ connector: injected() })}
            >
              Connect Wallet
            </Button>
          )}
          <Button variant="ghost" className="text-white">
            <Settings size={20} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {errorMessage && (
          <div className="absolute top-24 w-full max-w-md mx-auto bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4 z-50">
            <p className="text-red-500 text-center">{errorMessage}</p>
          </div>
        )}
        
        {swapStatus === "success" && displayedOrderId && (
          <div className="absolute top-24 w-full max-w-md mx-auto bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-4 z-50">
            <div className="flex justify-between items-center">
              <p className="text-green-500 text-center font-semibold">
                Order Placed Successfully!
              </p>
              <Button variant="ghost" size="sm" onClick={handleCloseSuccessPopup} className="text-green-500 hover:text-green-700">
                X
              </Button>
            </div>
            <p className="text-green-500 text-center mt-2">
              Order ID: {displayedOrderId}
            </p>
          </div>
        )}
        
        {isConnected && !isCorrectNetwork && (
          <div className="absolute top-24 w-full max-w-md mx-auto bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-4">
            <div className="flex flex-col items-center text-center gap-2">
              <p className="text-yellow-500">Please switch to Sapphire Network to use the swap</p>
              <Button 
                onClick={handleSwitchNetwork}
                className="bg-yellow-500 text-white hover:bg-yellow-600"
              >
                Switch to Sapphire Network
              </Button>
            </div>
          </div>
        )}
        <Card className="glass-card max-w-md w-full mx-auto overflow-hidden shadow-2xl">
          <CardHeader className="p-6 border-b border-border">
            <CardTitle className="text-xl font-bold flex items-center justify-between">
              <span>Swap</span>
              <div className="flex gap-2">
                <span className="text-base text-muted-foreground">Dark Pool</span>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {/* From Token */}
            <div className="p-4 bg-muted rounded-xl">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">From</span>
                <span className="text-sm text-muted-foreground">
                  Balance: {isConnected && isCorrectNetwork ? (isFromBalanceLoading ? "Loading..." : formattedFromBalance) : "0.0"}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={fromAmount}
                  onChange={(e) => {
                    setFromAmount(e.target.value);
                    setToAmount(e.target.value);
                  }}
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
                <span className="text-sm text-muted-foreground">
                  Balance: {isConnected && isCorrectNetwork ? (isToBalanceLoading ? "Loading..." : formattedToBalance) : "0.0"}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={toAmount}
                  readOnly
                  className="bg-transparent text-2xl font-semibold flex-1 focus:outline-none rounded-lg px-3 py-1.5 w-[140px] placeholder:text-muted-foreground/50"
                  placeholder="0.00"
                />
                <Button 
                  variant="ghost" 
                  className={`flex items-center gap-2 ${toToken === "water" ? "text-water" : "text-fire"}`}
                >
                  <TokenIcon type={toToken} />
                  <span className="font-semibold max-w-[70px] overflow-hidden text-ellipsis whitespace-nowrap">{toToken === "water" ? "WATER" : "FIRE"}</span>
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
              disabled={!isConnected || (isConnected && !isValidAmount(fromAmount)) || swapStatus === "approving" || swapStatus === "placing"}
              onClick={handleSwap}
            >
              {!isConnected 
                ? 'Connect Wallet' 
                : !isCorrectNetwork 
                ? 'Switch to Sapphire Network'
                : !isValidAmount(fromAmount)
                ? 'Enter an amount'
                : swapStatus === "approving"
                ? 'Approving...'
                : swapStatus === "placing"
                ? 'Placing Order...'
                : 'Swap'}
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
