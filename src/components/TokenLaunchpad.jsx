import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_2022_PROGRAM_ID, getMintLen, createInitializeMetadataPointerInstruction, createInitializeMintInstruction, TYPE_SIZE, LENGTH_SIZE, ExtensionType } from "@solana/spl-token"
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, createMintToInstruction } from '@solana/spl-token';
import { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import './TokenLaunchpad.css';

export function TokenLaunchpad() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [tokenName, setTokenName] = useState('KIRA');
    const [tokenSymbol, setTokenSymbol] = useState('KIR');
    const [tokenImageUrl, setTokenImageUrl] = useState('https://cdn.100xdevs.com/metadata.json');
    const [initialSupply, setInitialSupply] = useState('1000000000');
    const [isCreating, setIsCreating] = useState(false);
    const [message, setMessage] = useState('');
    const [txProgress, setTxProgress] = useState(0);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    const [particles, setParticles] = useState([]);
    const [stars, setStars] = useState([]);

    // Generate random particles and stars for background effect
    useEffect(() => {
        // Generate particles
        const newParticles = [];
        for (let i = 0; i < 25; i++) {
            newParticles.push({
                id: i,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                size: 2 + Math.random() * 4,
                duration: 10 + Math.random() * 20,
                delay: Math.random() * 5
            });
        }
        setParticles(newParticles);
        
        // Generate stars
        const newStars = [];
        for (let i = 0; i < 50; i++) {
            newStars.push({
                id: i,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                size: 1 + Math.random() * 2,
                animation: `twinkle ${2 + Math.random() * 4}s infinite ${Math.random() * 2}s`
            });
        }
        setStars(newStars);
    }, []);

    async function createToken() {
        if (!wallet.connected) {
            setMessage('Please connect your wallet first');
            return;
        }
        
        try {
            setIsCreating(true);
            setMessage('Creating token...');
            setTxProgress(10);
            
            const mintKeypair = Keypair.generate();
            const metadata = {
                mint: mintKeypair.publicKey,
                name: tokenName,
                symbol: tokenSymbol.padEnd(10),
                uri: tokenImageUrl,
                additionalMetadata: [],
            };

            const mintLen = getMintLen([ExtensionType.MetadataPointer]);
            const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

            const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);
            setTxProgress(25);

            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: mintLen,
                    lamports,
                    programId: TOKEN_2022_PROGRAM_ID,
                }),
                createInitializeMetadataPointerInstruction(mintKeypair.publicKey, wallet.publicKey, mintKeypair.publicKey, TOKEN_2022_PROGRAM_ID),
                createInitializeMintInstruction(mintKeypair.publicKey, 9, wallet.publicKey, null, TOKEN_2022_PROGRAM_ID),
                createInitializeInstruction({
                    programId: TOKEN_2022_PROGRAM_ID,
                    mint: mintKeypair.publicKey,
                    metadata: mintKeypair.publicKey,
                    name: metadata.name,
                    symbol: metadata.symbol,
                    uri: metadata.uri,
                    mintAuthority: wallet.publicKey,
                    updateAuthority: wallet.publicKey,
                }),
            );
                
            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            transaction.partialSign(mintKeypair);

            setTxProgress(40);
            await wallet.sendTransaction(transaction, connection);
            setTxProgress(60);
            setMessage(`Token mint created at ${mintKeypair.publicKey.toBase58()}`);

            const associatedToken = getAssociatedTokenAddressSync(
                mintKeypair.publicKey,
                wallet.publicKey,
                false,
                TOKEN_2022_PROGRAM_ID,
            );
            
            setMessage(prev => `${prev}\nCreating token account...`);
            
            const transaction2 = new Transaction().add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    associatedToken,
                    wallet.publicKey,
                    mintKeypair.publicKey,
                    TOKEN_2022_PROGRAM_ID,
                ),
            );
            
            setTxProgress(75);
            await wallet.sendTransaction(transaction2, connection);
            setMessage(prev => `${prev}\nMinting tokens...`);
            
            const transaction3 = new Transaction().add(
                createMintToInstruction(mintKeypair.publicKey, associatedToken, wallet.publicKey, parseInt(initialSupply), [], TOKEN_2022_PROGRAM_ID)
            );
            
            setTxProgress(90);
            await wallet.sendTransaction(transaction3, connection);
            setTxProgress(100);
            
            setMessage(prev => `${prev}\nToken created successfully!\nToken Address: ${mintKeypair.publicKey.toBase58()}\nToken Account: ${associatedToken.toBase58()}`);
            setShowSuccessAnimation(true);
            
            // Reset success animation after 3 seconds
            setTimeout(() => {
                setShowSuccessAnimation(false);
            }, 3000);
            
        } catch (error) {
            console.error(error);
            setMessage(`Error: ${error.message}`);
            setTxProgress(0);
        } finally {
            setTimeout(() => {
                setIsCreating(false);
            }, 1000);
        }
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="launchpad-container">
            {/* Stars in background */}
            {stars.map(star => (
                <div 
                    key={`star-${star.id}`}
                    className="star"
                    style={{
                        left: star.left,
                        top: star.top,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        animation: star.animation
                    }}
                />
            ))}
            
            {/* Floating particles */}
            {particles.map(particle => (
                <div 
                    key={`particle-${particle.id}`}
                    className="particle"
                    style={{
                        left: particle.left,
                        top: particle.top,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        animationDuration: `${particle.duration}s`,
                        animationDelay: `${particle.delay}s`
                    }}
                />
            ))}
            
            {/* Header */}
            <div className="launchpad-header">
                <div className="logo">
                    <span className="logo-icon">⬡</span>
                    <span className="logo-text">Solana Token Launchpad</span>
                </div>
                <div className="wallet-section">
                    <WalletMultiButton />
                </div>
            </div>
            
            <div className="launchpad-content">
                <div className={`launchpad-card ${showSuccessAnimation ? 'success-animation' : ''}`}>
                    <h1 className="launchpad-title">Create Your Token</h1>
                    
                    <div className="input-group">
                        <label>Token Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g., KIRA" 
                            value={tokenName}
                            onChange={(e) => setTokenName(e.target.value)}
                            disabled={isCreating}
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>Token Symbol</label>
                        <input 
                            type="text" 
                            placeholder="e.g., KIR" 
                            value={tokenSymbol}
                            onChange={(e) => setTokenSymbol(e.target.value)}
                            disabled={isCreating}
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>Image URL</label>
                        <input 
                            type="text" 
                            placeholder="Metadata URI" 
                            value={tokenImageUrl}
                            onChange={(e) => setTokenImageUrl(e.target.value)}
                            disabled={isCreating}
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>Initial Supply</label>
                        <input 
                            type="text" 
                            placeholder="e.g., 1000000000" 
                            value={initialSupply}
                            onChange={(e) => setInitialSupply(e.target.value)}
                            disabled={isCreating}
                        />
                    </div>
                    
                    {txProgress > 0 && txProgress < 100 && (
                        <div className="progress-container">
                            <div 
                                className="progress-bar" 
                                style={{ width: `${txProgress}%` }}
                            />
                            <span className="progress-text">{txProgress}%</span>
                        </div>
                    )}
                    
                    <button 
                        className={`create-button ${isCreating ? 'loading' : ''} ${showSuccessAnimation ? 'success' : ''}`} 
                        onClick={createToken}
                        disabled={isCreating || !wallet.connected}
                    >
                        {isCreating ? 'Creating...' : showSuccessAnimation ? 'Success!' : 'Create Token'}
                        <span className="button-shine"></span>
                        {showSuccessAnimation && (
                            <span className="success-icon">✓</span>
                        )}
                    </button>
                    
                    {message && (
                        <div className="message-box">
                            {message.split('\n').map((line, i) => {
                                // Check if line contains a token address
                                const isAddress = line.includes('Token Address:') || line.includes('Token Account:') || line.includes('Token mint created at');
                                return (
                                    <p key={i} className={isAddress ? 'address-line' : ''}>
                                        {line}
                                        {isAddress && (
                                            <button 
                                                className="copy-button"
                                                onClick={() => copyToClipboard(line.split(': ')[1] || line.split('at ')[1])}
                                                title="Copy to clipboard"
                                            >
                                                <span>📋</span>
                                            </button>
                                        )}
                                    </p>
                                );
                            })}
                        </div>
                    )}
                    
                    {!wallet.connected && (
                        <div className="connect-wallet-notice">
                            <p>Connect your wallet to create a token</p>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="tech-bubbles">
                <div className="tech-bubble">Solana</div>
                <div className="tech-bubble">Token-2022</div>
                <div className="tech-bubble">Web3</div>
            </div>
            
            <footer className="launchpad-footer">
                <div className="powered-by">Powered by <span className="highlight">Solana</span></div>
            </footer>
        </div>
    );
}