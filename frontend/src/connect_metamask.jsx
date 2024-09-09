import detectEthereumProvider from '@metamask/detect-provider'
import Web3 from 'web3'
import { useState, useEffect, useRef } from 'react'
import WrongNetwork from './wrongNetwork'
import './App.css'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from 'react-modal';

function Connect_metamask() {
    const [wallet, setWallet] = useState(null)
    const [contract, setContract] = useState(null)
    const [count, setCount] = useState(0)
    const [products, setProducts] = useState([])
    const [soldProducts, setSoldProducts] = useState([]) // New state for sold products
    const [showAddProduct, setShowAddProduct] = useState(false)
    const [isWrongNetwork, setIsWrongNetwork] = useState(false); // New state for network status
    const listenerSet = useRef(false); // Ref to track if listener is set
    const listenerwallet = useRef(false); // Ref to track if wallet is connected
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [transactionLink, setTransactionLink] = useState('');
    const [buyModalIsOpen, setBuyModalIsOpen] = useState(false); // New state for buy modal
    const [loading, setLoading] = useState(false);

    Modal.setAppElement('#root');
    /*this function is used to connect to the metamask wallet but if you refresh the page you lose the values but still connected */
    /*The issue you're encountering is due to the fact that the state in React (wallet in this case) is not persisted across page refreshes.
    When you refresh the page, all React state is reset,
    including the wallet state.
    This is why the button reverts to its initial state even though MetaMask is still connected.*/
    /*To fix this, you can use the useEffect hook to persist the wallet state across page refreshes.*/

    //handle the add product button
    const handleAddProduct = () => {
        setShowAddProduct(!showAddProduct)
    }
    

    useEffect(()=>{
        /*know the problem is when you disconnect are the accounts the button still show an address
        to fix this we need an event listner which is accountsChanged ,it gives the accounts variable each time it changes*/
        const getCurrentWalletConnected = async () => {
            if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
                    if (accounts.length > 0) {
                        setWallet(accounts[0])
                    }
                } catch (err) {
                    console.log(err.message)
                }
            } else {
                toast.error('Please install Metamask', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
            }
        }
        getCurrentWalletConnected()
        addWalletlistener()
    }, [])

    const connectWallet = async () => {
        if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
                setWallet(accounts[0])
            } catch (err) {
                console.log(err)
            }
        } else {
            toast.error('Please install Metamask', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: "light",
            });

        }
    }

    const addWalletlistener = () => {
        if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
            if (!listenerwallet.current) {
                listenerwallet.current = true;
                window.ethereum.on('accountsChanged', (accounts) => {
                    setWallet(accounts[0])
                    if (accounts.length > 0) {
                        toast.success('Connected to wallet successfully!', {
                            position: "top-left",
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: false,
                            draggable: true,
                            progress: undefined,
                            theme: "light",
                        });
                    } else {
                        setWallet(null); // Clear wallet state when disconnected
                        toast.error('Please connect to your wallet first', {
                            position: "top-left",
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: false,
                            draggable: true,
                            progress: undefined,
                            theme: "light",
                        });
                    }
                });
            }
        }
    }

    useEffect(() => {
        const loadContract = async () => {
            setLoading(true);
            const web3 = new Web3(window.ethereum)
            const contractFile = await fetch('/abis/Shop.json')
            const contractJson = await contractFile.json()
            const abi = contractJson.abi
            const networkId = await web3.eth.net.getId()
            const networkObject = contractJson.networks[networkId]
            if (networkObject) {
                const contractAddress = networkObject.address
                const contract = new web3.eth.Contract(abi, contractAddress)
                setContract(contract)
                setIsWrongNetwork(false); // Set network status to correct
            }
            else {
                setIsWrongNetwork(true); // Set network status to wrong
            }
            setLoading(false);
        }
        const addNetworkListener = async () => {
            if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
                window.ethereum.on('chainChanged', (chainId) => {
                    window.location.reload()
                })
            }
        }
        loadContract(); // Load contract regardless of wallet connection
        addNetworkListener();
    }, [])

    //add Product
    const [productInputs, setProductInputs] = useState({
        name: '',
        price: 0,
        description: ''
    })
    const addProduct = async () => {
        try {
            if (!wallet) {
                toast.error('please connect to your wallet first', {
                    position: "top-left",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
                return
            }
            if (!contract) {
                toast.error('please select the right network first', {
                    position: "top-left",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
                return;
            }
            // Validation
            if (!productInputs.name || !productInputs.price || !productInputs.description) {
                toast.error('All fields are required', {
                    position: "top-left",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
                return;
            }
            if (isNaN(productInputs.price) || Number(productInputs.price) <= 0) {
                toast.error('Please enter a valid price', {
                    position: "top-left",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
                return;
            }
            const gasEstimate = await contract.methods.createProduct(
                productInputs.name,
                Web3.utils.toWei(productInputs.price.toString(), 'ether'),
                productInputs.description
            ).estimateGas({ from: wallet });


            const transaction = await contract.methods.createProduct(
                productInputs.name,
                Web3.utils.toWei(productInputs.price.toString(), 'ether'),
                productInputs.description
            ).send({ from: wallet, gas: gasEstimate });
            toast.success('Product added successfully!', {
                position: "top-left",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: "light",

            });

            // Clear the input fields and open the modal
            setProductInputs({
                name: '',
                price: 0,
                description: ''
            })
            setShowAddProduct(false)
            setModalIsOpen(true);
            setTransactionLink(`https://sepolia.etherscan.io/tx/${transaction.transactionHash}`);


        } catch (error) {
            console.error('Error adding product:', error);
            toast.error('Error adding product', {
                position: "top-left",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
        }
    };
    // Instead, call addProduct when the "Add Product" button is clicked

    //buy product

    const buyProduct = async (productId, price, owner) => {
        try {
            if (!wallet) {
                toast.error('Please connect to your wallet first', {
                    position: "top-left",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
                return;
            }
            if (!contract) {
                toast.error('Please select the right network first', {
                    position: "top-left",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
                return;
            }
            if (wallet.toLowerCase() === owner.toLowerCase()) {
                toast.error("You can't buy your own product!", {
                    position: "top-left",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
                return;
            }

            const gasEstimate = await contract.methods.purchaseProduct(productId).estimateGas({ from: wallet, value: price });

            const transaction = await contract.methods.purchaseProduct(productId).send({ from: wallet, value: price, gas: gasEstimate });
            
            toast.success('Product purchased successfully!', {
                position: "top-left",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: "light",
            });

            // Set transaction link and open modal
            setTransactionLink(`https://sepolia.etherscan.io/tx/${transaction.transactionHash}`);
            setBuyModalIsOpen(true);

        } catch (error) {
            toast.error('Error buying product', {
                position: "top-left",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
        }
    };


    //load the existing products

    useEffect(() => {
        let eventSubscription;

        const loadExistingProducts = async () => {
            if (contract) {
                try {
                    setLoading(true);
                    const productCount = await contract.methods.count().call();
                    const loadedProducts = [];
                    const loadedSoldProducts = [];
                    for (let i = 1; i <= productCount; i++) {
                        const product = await contract.methods.shopProducts(i).call();
                        if (product.sold) {
                            loadedSoldProducts.push(product);
                        } else {
                            loadedProducts.push(product);
                        }
                    }
                    setProducts(loadedProducts);
                    setSoldProducts(loadedSoldProducts);
                    setLoading(false);
                } catch (error) {
                    console.error("Error loading existing products:", error);
                }
            }
        };

        const setupProductListener = async () => {
            if (contract && !listenerSet.current) {
                listenerSet.current = true; // Mark listener as set

                eventSubscription = await contract.events.createdProduct({})
                    .on('data', async (event) => {
                        const newProduct = event.returnValues;
                        setProducts(prevProducts => {
                            if(prevProducts.some(product => product.id === newProduct.id)){
                                return prevProducts
                            }
                            return [...prevProducts, newProduct]});
                    });

                await contract.events.purshasedProduct({})
                    .on('data', async (event) => {
                        const soldProduct = event.returnValues;
                        setSoldProducts(prevSoldProducts => [...prevSoldProducts, soldProduct]);
                        setProducts(prevProducts => prevProducts.filter(product => product.id !== soldProduct.id)); // Filter out the sold product from products
                    });
            }
        };

        loadExistingProducts();
        setupProductListener();

        return () => {
            if (eventSubscription) {
                eventSubscription.unsubscribe();
                console.log('Product listener unsubscribed');
            }
        };
    }, [contract]);

    return (
        <>
            <ToastContainer />
            {isWrongNetwork ? (
                <WrongNetwork />
            ) : (
                <div className="App">
                    {loading ? (
                        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '100vh' }}>
                            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3">Loading products, please wait...</p>
                        </div>
                    ) : (
                        <>
                    <nav className="navbar bg-dark fixed-top">
                        <div className="container-fluid">
                            <div className="d-flex align-items-center">
                                <a className="navbar-brand text-white me-1">
                                    <img src="src/assets/final_logo.png" alt="Logo" style={{height: '30px', width: 'auto', borderRadius: '50%'}}/>
                                </a>
                                <a className="navbar-brand ms-0">
                                    <span style={{ color: 'white' }}>avito</span>
                                    <span style={{ color: '#00DDFF' }}>W3</span>
                                </a>
                            </div>
                            <button 
                                onClick={connectWallet} 
                                disabled={!!wallet} 
                                className={`btn ${wallet ? 'btn-success' : 'btn-light'}`}
                            >
                                {wallet ? `Connected: ${wallet.slice(0, 6)}...${wallet.slice(-4)}` : 'Connect Metamask'}
                            </button>
                        </div>
                    </nav>
                    
                    {!showAddProduct && (
                        <div className='text-center mt-5 mb-3 px-5'>
                            <h4>Click the button below to add a product to the shop</h4>
                            <button onClick={handleAddProduct} className="btn btn-success">Add Product</button>
                           <Modal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)} 
                                style={{
                                    content: {
                                        top: '50%',
                                        left: '50%',
                                        right: 'auto',
                                        bottom: 'auto',
                                        transform: 'translate(-50%, -50%)',
                                        padding: '30px',
                                        textAlign: 'center',
                                        border: 'none',
                                        borderRadius: '10px',
                                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                                        width: '80%',
                                        maxWidth: '600px',
                                        height: 'auto',
                                        maxHeight: '80vh',
                                        overflowY: 'auto',
                                        backgroundColor: '#e0e0e0',
                                    },
                                    overlay: {
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    }
                                }}
                            > 
                                <h2 style={{ color: '#333', marginBottom: '20px' }}>you can check the transaction on etherscan</h2>
                                <a
                                    href={transactionLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: 'none' }}
                                >
                                    <button 
                                        style={{
                                            backgroundColor: '#4CAF50',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            marginRight: '10px',
                                            fontSize: '16px',
                                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                        }}
                                        onClick={() => setModalIsOpen(false)}
                                    >
                                        Go to Transaction
                                    </button>
                                </a>
                                <button 
                                    style={{
                                        backgroundColor: '#f44336',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                    }}
                                    onClick={() => setModalIsOpen(false)}
                                >
                                    Close
                                </button>
                            </Modal>
                        </div>
                    )}
                    
                    {showAddProduct && (
                        <div className="productInput container">
                            <h1 className='text-center mt-5 mb-3 px-5'>Add Product to the Shop</h1>
                            <div className="input-group mb-3">
                                <span className="input-group-text">Product Name</span>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={productInputs.name} 
                                    onChange={(e) => setProductInputs({...productInputs, name: e.target.value})}
                                />
                            </div>
                            <div className="input-group mb-3">
                                <span className="input-group-text">ETH</span>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    value={productInputs.price}
                                    onChange={(e) => setProductInputs({...productInputs, price: e.target.value})}
                                />
                            </div>
                            <div className="input-group mb-3">
                                <span className="input-group-text">Product Description</span>
                                <textarea 
                                    className="form-control" 
                                    value={productInputs.description}
                                    onChange={(e) => setProductInputs({...productInputs, description: e.target.value})}
                                ></textarea>
                            </div>
                            <button type="button" className="btn btn-success mt-3" onClick={addProduct}>Add Product</button>
                        
                        </div>
                    )}
                    
                    <div className="container">
                        {products.length > 0 && <h3 className='text-center mt-5 mb-3 px-5'>Existing Products</h3>}
                        <div className="row justify-content-center">
                            {products.map((product, index) => (
                                <div className="card m-2 p-0 text-center" style={{ maxWidth: '18rem' }} key={product.id}>
                                    <div className="card-header">
                                        Product number: {index + 1}
                                    </div>
                                    <div className="card-body">
                                        <h5 className="card-title">{product.name}</h5>
                                        <p className="card-text small">{product.description}</p>
                                        <p className="card-text">Price: {Web3.utils.fromWei(product.price, 'ether')} ETH</p>
                                        <p className="card-text small">Seller: {product.owner.slice(0, 6)}...{product.owner.slice(-4)}</p>
                                        <button className="btn btn-primary btn-sm" onClick={() => buyProduct(product.id, product.price, product.owner)}>Buy product</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="container">
                        {soldProducts.length > 0 && <h3 className='text-center mt-5 mb-3 px-5'>Sold Products</h3>}
                        <div className="row justify-content-center">
                            {soldProducts.map((product, index) => (
                                <div className="card m-2 p-0 text-center" style={{ maxWidth: '18rem' }} key={product.id}>
                                    <div className="card-header">
                                        Sold Product number: {index + 1}
                                    </div>
                                    <div className="card-body">
                                        <h5 className="card-title">{product.name}</h5>
                                        <p className="card-text small">{product.description}</p>
                                        <p className="card-text">Price: {Web3.utils.fromWei(product.price, 'ether')} ETH</p>
                                        <p className="card-text small">Owner: {product.owner.slice(0, 6)}...{product.owner.slice(-4)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Modal isOpen={buyModalIsOpen} onRequestClose={() => setBuyModalIsOpen(false)} 
                        style={{
                            content: {
                                top: '50%',
                                left: '50%',
                                right: 'auto',
                                bottom: 'auto',
                                transform: 'translate(-50%, -50%)',
                                padding: '30px',
                                textAlign: 'center',
                                border: 'none',
                                borderRadius: '10px',
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                                width: '80%',
                                maxWidth: '600px',
                                height: 'auto',
                                maxHeight: '80vh',
                                overflowY: 'auto',
                                backgroundColor: '#e0e0e0',
                            },
                            overlay: {
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            }
                        }}
                    >
                        <h2 style={{ color: '#333', marginBottom: '20px' }}>You can check the transaction on Etherscan</h2>
                        <a
                            href={transactionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                        >
                            <button 
                                style={{
                                    backgroundColor: '#4CAF50',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    marginRight: '10px',
                                    fontSize: '16px',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                }}
                                onClick={() => setBuyModalIsOpen(false)}
                            >
                                Go to Transaction
                            </button>
                        </a>
                        <button 
                            style={{
                                backgroundColor: '#f44336',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                            }}
                            onClick={() => setBuyModalIsOpen(false)}
                        >
                            Close
                        </button>
                    </Modal>
                    </>
                    )}
                </div>
            )}
        </>
    );
}
export default Connect_metamask;
