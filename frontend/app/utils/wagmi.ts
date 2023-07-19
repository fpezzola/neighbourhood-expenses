import { configureChains, createConfig } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { publicProvider } from 'wagmi/providers/public'

const localhost = {
	id: 31337,
	name: 'Localhost',
	network: 'localhost',
	nativeCurrency: {
		name: 'ETH',
		/** 2-6 characters long */
		symbol: 'ETH',
		decimals: 18,
	},
	rpcUrls: {
		default: {
			http: ['http://127.0.0.1:8545'],
		},
		public: {
			http: ['http://127.0.0.1:8545'],
		},
	},
}
const { publicClient, chains } = configureChains(
	[localhost],
	[publicProvider()],
)

export default createConfig({
	autoConnect: true,
	publicClient: publicClient,
	connectors: [
		new MetaMaskConnector({ chains: chains }),
		new InjectedConnector({
			options: {
				name: 'Injected',
				shimDisconnect: true,
			},
		}),
	],
})
