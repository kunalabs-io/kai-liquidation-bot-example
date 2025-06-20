# Liquidation bot @kunalabs-io/kai

An example of TypeScript-based liquidation bot for the Kai Finance protocol (https://kai.finance). This bot monitors lp positions and executes liquidations when necessary.

## Architecture Overview

The bot consists of three core components working in sequence:

1. **Rpc Position Monitor**: Watches and polls the chain for liquidatable positions
2. **Liquidation Controller**: Processes detected positions and makes execution decisions
3. **Flash Swap Executor**: Handles the actual liquidation transactions using flash swaps

For detailed arhitecture reference, see the [Kai Finance Liquidation Framework](https://github.com/kunalabs-io/kai-ts-sdk?tab=readme-ov-file#liquidation-framework).

The implementation includes Prometheus metrics integration for monitoring

## Installation

Install dependencies:

```bash
pnpm install
```

```bash
pnpm build
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
