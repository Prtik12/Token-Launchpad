import './App.css'
import { useMemo } from 'react';
import {
    ConnectionProvider,
    WalletProvider,
} from '@solana/wallet-adapter-react';
import { TokenLaunchpad } from './components/TokenLaunchpad'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
    const endpoint = useMemo(() => 'https://api.devnet.solana.com', []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={[]} autoConnect>
                <WalletModalProvider>
                    <TokenLaunchpad />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default App
