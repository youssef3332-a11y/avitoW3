import React, { useState, useEffect } from 'react';
import './wrongNetworkCss.css';

function WrongNetwork({isMetamaskInstalled}) {
    const [metamask, setMetamask] = useState(false);

    const handleWatchDemo = () => {
        window.open('https://www.youtube.com/watch?v=A7sbpFvkEe0', '_blank');
    };
    const handleIReadDemo = () => {
        window.open('https://support.metamask.io/getting-started/getting-started-with-metamask/', '_blank');
    };
    const handleWrongNetwork = () => {
        window.open('https://www.youtube.com/watch?v=H8aL1yXPVho', '_blank');
    };

    useEffect(() => {
        setMetamask(isMetamaskInstalled);
    }, [isMetamaskInstalled]);

    return (
        <>
        {!metamask ? (
        <div className="wrong-network">
            <h1>Metamask is not installed</h1>
            <p>Please install Metamask to enter the store or see the demo.</p>
            <button className="demo-button" onClick={handleWatchDemo}>Watch Demo Video</button>
            <button className="demo-button" onClick={handleIReadDemo}>I Read the Demo</button>
        </div>
    ) : (
        <div className="wrong-network">
            <h1>Wrong Network</h1>
            <p>Please connect to the correct network which is <strong>Sepolia Testnet</strong> to enter the store or watch the demo video.</p>
            <button className="demo-button" onClick={handleWrongNetwork}>Watch Demo</button>
        </div>
    )}
    </>
    );
}

export default WrongNetwork;