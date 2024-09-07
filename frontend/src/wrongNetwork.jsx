import React from 'react';
import './wrongNetworkCss.css';

function WrongNetwork() {
    const handleWatchDemo = () => {
        window.open('https://example.com/demo-video', '_blank');
    };

    return (
        <div className="wrong-network">
            <h1>Wrong Network</h1>
            <p>Please connect to the correct network to enter the store or watch the demo video.</p>
            <button className="demo-button" onClick={handleWatchDemo}>Watch Demo Video</button>
        </div>
    );
}

export default WrongNetwork;