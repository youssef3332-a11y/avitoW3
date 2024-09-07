import detectEthereumProvider from '@metamask/detect-provider'
import Web3 from 'web3'
import { useState, useEffect } from 'react'
import WrongNetwork from './wrongNetwork'
import './App.css'

function Connect_metamask() {
    const [wallet, setWallet] = useState(null)
    const [contract, setContract] = useState(null)
    const [count, setCount] = useState(0)
    const [products, setProducts] = useState([])
    const [soldProducts, setSoldProducts] = useState([]) // New state for sold products
    //const [showAddProduct, setShowAddProduct] = useState(false)

    /*this function is used to connect to the metamask wallet but if you refresh the page you lose the values but still connected */
    /*The issue you're encountering is due to the fact that the state in React (wallet in this case) is not persisted across page refreshes.
    When you refresh the page, all React state is reset,
    including the wallet state.
    This is why the button reverts to its initial state even though MetaMask is still connected.*/
    /*To fix this, you can use the useEffect hook to persist the wallet state across page refreshes.*/

    //handle the add product button
    //const handleAddProduct = () => {
    //    setShowAddProduct(!showAddProduct)
    //}


    useEffect(()=>{
        /*know the problem is when you disconnect are the accounts the button still show an address
        to fix this we need an event listner which is accountsChanged ,it gives the accounts variable each time it changes*/
        const getCurrentWalletConnected = async () => {
            if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
                try{
                    const accounts = await window.ethereum.request({method:'eth_accounts'})
                    if (accounts.length > 0){
                        setWallet(accounts[0])
                    }
                }catch(err){
                    console.log(err.message)
                }
            }
            else{
                alert('please install metamask')
            }
        }
        getCurrentWalletConnected()
        addWalletlistener()
    },[])

    const connectWallet = async () => {
        if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
            try{
                const accounts = await window.ethereum.request({method: 'eth_requestAccounts'})
                setWallet(accounts[0])
            }catch(err){
                console.log(err)
            }
        }else{
            alert('please install metamask')
        }
    }

    const addWalletlistener = () => {
        if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', (accounts) => {
                setWallet(accounts[0])
            })
        }
        else{
            alert('please install metamask')
        }
    }

    useEffect(()=>{
        const loadContract = async () => {
            const web3 = new Web3(window.ethereum)
            const contractFile = await fetch('/abis/Shop.json')
            const contractJson = await contractFile.json()
            const abi = contractJson.abi
            const networkId = await web3.eth.net.getId()
            const networkObject = contractJson.networks[networkId]
            if (networkObject){
                const contractAddress = networkObject.address
                const contract = new web3.eth.Contract(abi, contractAddress)
                setContract(contract)
                
            }
            else{
                alert('please connect to the correct network')
            }
        }
        const addNetworkListener = async () =>{
            if(typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'){
                window.ethereum.on('chainChanged', (chainId) => {
                    window.location.reload()
                })
            }
        }
        if(wallet){
            loadContract()
            addNetworkListener()
        }
    },[wallet])

    //add Product
    const [productInputs, setProductInputs] = useState({
        name: '',
        price: 0,
        description: ''
    })
    const addProduct = async () => {
        try {
            if (!wallet){alert("please connect to your wallet first")
                return
            }
            if (!contract) {
                alert('please select the right network first');
                return;
            }
            // Validation
            if (!productInputs.name || !productInputs.price || !productInputs.description) {
                alert("All fields are required");
                return;
            }
            if (isNaN(productInputs.price) || Number(productInputs.price) <= 0) {
                alert("Please enter a valid price");
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

            console.log('Transaction Hash:', transaction.transactionHash);

            
             
            //clear the input fields
          
            //setShowAddProduct(false)
            //setProductInputs({
            //    name: '',
            //    price: 0,
            //    description: ''
            //})

            
        } catch (error) {
            console.error('Error adding product:', error);
        }
    };
    // Instead, call addProduct when the "Add Product" button is clicked
    
    //buy product

    const buyProduct = async (productId, price, owner) => {
        try {
            if (!wallet) {
                alert("Please connect to your wallet first");
                return;
            }
            if (!contract) {
                alert('Please select the right network first');
                return;
            }
            if (wallet.toLowerCase() === owner.toLowerCase()) {
                alert("You can't buy your own product!");
                return;
            }

            const gasEstimate = await contract.methods.purchaseProduct(productId).estimateGas({ from: wallet, value: price });

            const transaction = await contract.methods.purchaseProduct(productId).send({ from: wallet, value: price, gas: gasEstimate });
            
            console.log('Transaction Hash:', transaction.transactionHash);
            
            
        } catch (error) {
            console.error('Error buying product:', error);
        }
    };


    //load the existing products
    
    useEffect(() => {
        let eventSubscription;

        const loadExistingProducts = async () => {
            if (contract) {
                try {
                    const productCount = await contract.methods.count().call();
                    const loadedProducts = [];
                    const loadedSoldProducts = []; 
                    for (let i = 1; i <= productCount; i++) {
                        const product = await contract.methods.shopProducts(i).call();
                        if (product.sold) {
                            if (!loadedSoldProducts.some(p => p.id === product.id)) {
                                loadedSoldProducts.push(product);
                            }
                        } else {
                            if (!loadedProducts.some(p => p.id === product.id)) {
                                loadedProducts.push(product);
                            }
                        }
                    }
                    setProducts(loadedProducts);
                    setSoldProducts(loadedSoldProducts); 
                } catch (error) {
                    console.error("Error loading existing products:", error);
                }
            }
        };

        const setupProductListener = async () => {
            if (contract && !eventSubscription) { // Check if eventSubscription is not already set
                eventSubscription = await contract.events.createdProduct({})
                    .on('data', async (event) => {
                        const newProduct = event.returnValues;
                        setProducts(prevProducts => [...prevProducts, newProduct]);
                        console.log('New product added:', newProduct);
                    });

                await contract.events.purshasedProduct({})
                    .on('data', async (event) => {
                        const soldProduct = event.returnValues;
                        if (!soldProducts.some(p => p.id === soldProduct.id)) {
                            setSoldProducts(prevSoldProducts => [...prevSoldProducts, soldProduct]);
                        }
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
            {!contract ? (
                <WrongNetwork />
            ) : (
                <div className="App">
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
                    
                    
                        {/* <div className='text-center mt-5 mb-3 px-5'>
                            <h4>Click the button below to add a product to the shop</h4>
                            <button  className="btn btn-success">Add Product</button>
                        </div> */}
                    
                    
                    
                        <div className="productInput container">
                            <h1 className='text-center mt-5 mb-3 px-5'>Add Product to the Shop</h1>
                            <div className="input-group mb-3">
                                <span className="input-group-text">Product Name</span>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                     
                                    onChange={(e) => setProductInputs({...productInputs, name: e.target.value})}
                                />
                            </div>
                            <div className="input-group mb-3">
                                <span className="input-group-text">ETH</span>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    
                                    onChange={(e) => setProductInputs({...productInputs, price: e.target.value})}
                                />
                            </div>
                            <div className="input-group mb-3">
                                <span className="input-group-text">Product Description</span>
                                <textarea 
                                    className="form-control" 
                                    
                                    onChange={(e) => setProductInputs({...productInputs, description: e.target.value})}
                                ></textarea>
                            </div>
                            <button type="button" className="btn btn-success mt-3" onClick={addProduct}>Add Product</button>
                        </div>
                    
                    
                    <div className="container">
                        {products.length > 0 && <h3 className='text-center mt-5 mb-3 px-5'>Existing Products</h3>}
                        <div className="row justify-content-center">
                            {products.map((product, index) => (
                                <div className="card m-2 p-0 text-center" style={{ maxWidth: '18rem' }} key={product.id || index} >
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
                                <div className="card m-2 p-0 text-center" style={{ maxWidth: '18rem' }} key={product.id || index}>
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
                </div>
            )}
        </>
    );
}
export default Connect_metamask;
