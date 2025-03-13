# Blockchain Group Buying DApp 👋

> A smart contract group buying application based on [dapp-starter](https://github.com/jellydn/dapp-starter)

## Project Description

This is an Ethereum blockchain-based group buying smart contract application that allows users to:

- Participate in group buying activities
- Track group buying progress
- Complete purchase or automatic refund after deadline

## Key Features

- 🛍️ Join Group Buy: Users can participate by paying specified amounts
- 💰 Auto Settlement: Transfers to supplier when goal is reached, auto refund if not
- ⏰ Time Management: Deadline control for participation
- 📊 Real-time Progress: Shows current funding progress and participant count
- 🔒 Security: Uses OpenZeppelin's upgradeable contracts and access control

## Tech Stack

- ⚡️ Next.js - React Framework
- 📦 Hardhat - Ethereum Development Environment
- 🦾 TypeChain - TypeScript bindings for Smart Contracts
- 🔥 web3-react - Ethereum DApp Framework
- 🎨 TailwindCSS & DaisyUI - UI Component Library
- 🎨 OpenZeppelin - Secure Smart Contract Library

## Installation & Usage

1. Install dependencies:
```sh
pnpm install
```

2. Start development environment:
```sh
pnpm run dev
```

3. Deploy contracts:
```sh
npx hardhat compile
npx hardhat run scripts/deploy_volta.ts --network volta
```

## Smart Contract

The contract implements:

- Group purchase goal amount setting
- Participant payment management
- Deadline control
- Automatic refund mechanism
- Fund transfer to supplier
- Interaction using Metamask addresses and Volta test network

## Testing

Run contract tests:
```sh
pnpm run test
```

## Setting up Volta Network

- Switch networks in MetaMask by manually adding the Volta test network
- Get test tokens: [EWF Volta testnet faucet](https://voltafaucet.energyweb.org/)
- View transactions: [volta-explorer](https://volta-explorer.energyweb.org/)

## Environment Variables

```
ETHERSCAN_API_KEY=Your_Etherscan_API
PRIVATE_KEY=Your_Metamask_Private_Key
M2_ADDRESS=Your_Another_Metamask_Address
VOLTA_RPC_URL=https://volta-rpc.energyweb.org
```

## License

MIT License

## Acknowledgments

This project is built upon [dapp-starter](https://github.com/jellydn/dapp-starter). Thanks to the original author for providing an excellent starter template.
