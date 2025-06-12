# Liquidation bot @kunalabs-io/kai

A TypeScript-based liquidation bot for the Kai Finance protocol (https://kai.finance). This bot monitors lp positions and executes liquidations when necessary.

## Features

- Real-time position monitoring
- Automated liquidation execution
- Flash swap execution for liquidations
- Prometheus metrics integration

## System Architecture

The bot consists of three main components:

1. **Position Monitor (`RpcPositionMonitor`)**

   - Continuously watches for positions that need liquidation
   - Polls the chain at regular intervals
   - Triggers events when positions need liquidation

2. **Liquidation Controller (`LiquidationController`)**

   - Acts as the decision-making component
   - Receives positions from the monitor
   - Determines how to handle liquidations
   - Coordinates with the executor to perform liquidations

3. **Flash Swap Executor (`FlashSwapExecutor`)**
   - Handles the actual execution of liquidations
   - Signs and sends transactions to the network
   - Performs flash swaps for liquidation

The system follows a clear flow:

1. Monitor detects positions needing liquidation
2. Controller receives and processes these positions
3. Executor carries out the actual liquidation transactions

## Installation

Install dependencies:

```bash
pnpm install
```

Add the environment variable `PRIVATE_KEY` to get a keypair by following the [Mysten Labs SDK guide](https://sdk.mystenlabs.com/typescript/cryptography/keypairs#deriving-a-keypair-from-a-bech32-encoded-secret-key)

## Usage

Run the bot using the following command:

```bash
pnpm start
```

> Note: Execution of first poll might be slower until cache initialization

## Metrics

The bot exposes Prometheus metrics on port 9284. You can access the metrics at:

```bash
http://localhost:9284/metrics
```
