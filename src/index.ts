import { Command } from 'commander'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import {
  RpcPositionMonitor,
  LiquidationController,
  FlashSwapExecutor,
  LiqudationBackendClient,
  LIQUIDATION_BACKEND_CLIENT_BASE_URL,
  Metrics,
} from '@kunalabs-io/kai'
import pino from 'pino'
import { SuiClient } from '@mysten/sui/client'
import { SuiPriceServiceConnection } from '@pythnetwork/pyth-sui-js'
import { MeterProvider } from '@opentelemetry/sdk-metrics'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

const SERVICE_NAME = 'liquidation-bot'

const program = new Command()

interface RunServiceOptions {
  rpcUrl: string
  backendUrl: string
  pythUrl: string
  privateKey: string
  pythConnectionTimeoutSec: number
  pollIntervalMs: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

program
  .command('run-service')
  .requiredOption(
    '--rpc-url <string>',
    'Sui RPC URL',
    'https://fullnode.mainnet.sui.io:443'
  )
  .requiredOption(
    '--backend-url <string>',
    'Backend URL',
    LIQUIDATION_BACKEND_CLIENT_BASE_URL
  )
  .requiredOption(
    '--pyth-url <string>',
    'Pyth URL',
    'https://hermes.pyth.network'
  )
  .option(
    '--pyth-connection-timeout-sec <number>',
    'Pyth connection timeout in seconds',
    parseInt,
    15
  )
  .option(
    '--poll-interval-ms <number>',
    'Monitor poll interval in milliseconds',
    parseInt,
    1000
  )
  .option(
    '--log-level <string>',
    'Log level',
    value => {
      if (!['debug', 'info', 'warn', 'error'].includes(value)) {
        throw new Error('Invalid log level')
      }
      return value
    },
    'info'
  )
  .action(async (options: RunServiceOptions) => {
    const logger = pino({
      level: options.logLevel,
    })

    logger.info('Starting liquidation bot')

    // Create Ed25519 keypair from private key for signing Sui transactions
    // https://sdk.mystenlabs.com/typescript/cryptography/keypairs
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY environment variable is required')
    }
    const signer = Ed25519Keypair.fromSecretKey(process.env.PRIVATE_KEY)

    const liquidationBackendClient = new LiqudationBackendClient(
      options.backendUrl
    )

    const suiClient = new SuiClient({
      url: options.rpcUrl,
    })

    const pythConnection = new SuiPriceServiceConnection(options.pythUrl, {
      timeout: options.pythConnectionTimeoutSec * 1000,
    })

    const positionMonitor = new RpcPositionMonitor(
      options.pollIntervalMs,
      logger,
      liquidationBackendClient,
      suiClient,
      pythConnection
    )

    await positionMonitor.start()

    const liquidationExecutor = new FlashSwapExecutor(suiClient, signer, logger)

    const liquidationController = new LiquidationController(
      logger,
      liquidationExecutor
    )

    positionMonitor.onLiquidationNeeded(async positions => {
      await liquidationController.handleNewPositions(positions)
    })

    await startMetricsServer()
  })

async function startMetricsServer() {
  const port = '9284'

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: SERVICE_NAME,
  })

  const exporter = new PrometheusExporter({
    port: parseInt(port, 10),
    endpoint: '/metrics',
  })

  const meterProvider = new MeterProvider({
    readers: [exporter],
    resource,
  })

  const meter = meterProvider.getMeter(SERVICE_NAME)
  Metrics.registerAll(meter)
}

program.parse(process.argv)
