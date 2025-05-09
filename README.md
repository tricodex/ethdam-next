# ROFL Swap - Private Token Exchange

A decentralized exchange (DEX) interface for swapping WATER and FIRE tokens using Oasis Sapphire's confidential EVM and ROFL (Runtime Off-chain Logic) framework.

## Features

- Swap between WATER and FIRE tokens with complete privacy
- Powered by Oasis Sapphire's confidential EVM
- Uses ROFL framework for secure off-chain computation
- Clean, modern UI inspired by leading DEXes

## Tech Stack

- Next.js 15
- TailwindCSS 4
- React 19
- TypeScript
- Oasis Sapphire integration (backend)

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
# or
./run.sh
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app/page.tsx` - Main swap interface
- `src/app/globals.css` - Global styles and theme
- `src/components/ui/` - UI components

## Backend Integration

This frontend is designed to work with a backend implementation built on:

- Oasis Sapphire's confidential EVM for privacy-preserving transactions
- ROFL framework for secure off-chain order matching
- Smart contracts for WATER and FIRE token handling

## ETHDam Hackathon Project

This project was built for the ETHDam III Hackathon as part of the Oasis track.
