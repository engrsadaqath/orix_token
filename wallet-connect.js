import { createAppKit } from '@reown/appkit'
import { mainnet, arbitrum, bsc } from '@reown/appkit/networks'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { ethers } from 'ethers'

// ChatSign contract information
const CHAT_SIGN_ADDRESS = '0xF201800833c4823650Da0bC474d21fFf562Ce897';
const CHAT_SIGN_ABI = [
  "function chatSign() external",
  "function checkSignStatus(address user) external view returns (bool)"
];

// Global variables for wallet state
let walletConnected = false;
let walletAddress = null;
let appkitModal = null;
let hasSignedChat = false;
let chatSignContract = null;

// AI Platform functionality variables
const promptInput = document.getElementById('promptInput');
const sendButton = document.getElementById('sendButton');
const clearButton = document.getElementById('clearButton');
const chatMessages = document.getElementById('chatMessages');
const modelSelect = document.getElementById('modelSelect');

// Create sign button for chat access
function createSignButton() {
  console.log('Creating sign button...');
  
  // Remove existing sign button if any
  const existingSignButton = document.getElementById('sign-chat-button');
  if (existingSignButton) existingSignButton.remove();
  
  // Create sign button
  const signButton = document.createElement('button');
  signButton.id = 'sign-chat-button';
  signButton.className = 'sign-button';
  signButton.textContent = 'Sign to Access Chat';
  signButton.style.display = 'block';
  signButton.style.width = '100%';
  signButton.style.padding = '12px';
  signButton.style.margin = '10px 0';
  signButton.style.backgroundColor = '#4CAF50';
  signButton.style.color = 'white';
  signButton.style.border = 'none';
  signButton.style.borderRadius = '4px';
  signButton.style.cursor = 'pointer';
  signButton.style.fontWeight = 'bold';
  signButton.style.fontSize = '16px';
  signButton.style.position = 'relative';
  signButton.style.zIndex = '1000';
  signButton.style.pointerEvents = 'auto';
  
  // Add click event to sign using onclick for maximum compatibility
  signButton.onclick = async function() {
    console.log('Sign button clicked via onclick');
    this.disabled = true;
    this.textContent = 'Signing...';
    this.style.backgroundColor = '#cccccc';
    
    try {
      const success = await requestChatSignature();
      
      if (success) {
        this.remove();
        if (sendButton) {
          sendButton.disabled = false;
          sendButton.textContent = 'Send';
        }
        // Update button state after successful signature
        updateSendButtonState();
      } else {
        this.disabled = false;
        this.textContent = 'Click to Sign Again';
        this.style.backgroundColor = '#4CAF50';
      }
    } catch (error) {
      console.error('Error in sign button click handler:', error);
      this.disabled = false;
      this.textContent = 'Click to Sign Again';
      this.style.backgroundColor = '#4CAF50';
    }
  };
  
  // Also add addEventListener as a backup
  signButton.addEventListener('click', function() {
    console.log('Sign button clicked via addEventListener');
  });
  
  // Insert at the most visible location - directly before chat messages
  if (chatMessages && chatMessages.parentNode) {
    console.log('Adding sign button before chatMessages');
    chatMessages.parentNode.insertBefore(signButton, chatMessages);
  } else if (document.querySelector('.chat-input-container')) {
    console.log('Adding sign button to chat-input-container');
    const container = document.querySelector('.chat-input-container');
    container.prepend(signButton);
  } else {
    console.log('Adding sign button to body');
    // As a last resort, add to body
    document.body.appendChild(signButton);
  }
  
  // Make sure the button is visible by logging its dimensions and position
  setTimeout(() => {
    const rect = signButton.getBoundingClientRect();
    console.log('Sign button dimensions:', rect);
    console.log('Sign button visible:', rect.width > 0 && rect.height > 0);
    console.log('Sign button style.display:', window.getComputedStyle(signButton).display);
  }, 100);
  
  console.log('Sign button created and added to DOM');
  return signButton;
}

// Create logout dropdown
const createLogoutDropdown = () => {
  // Remove existing dropdown if any
  const existingDropdown = document.getElementById('wallet-dropdown');
  if (existingDropdown) existingDropdown.remove();
  
  // Create dropdown
  const dropdown = document.createElement('div');
  dropdown.id = 'wallet-dropdown';
  dropdown.className = 'wallet-dropdown';
  dropdown.innerHTML = `<div class="dropdown-item">Logout</div>`;
  dropdown.style.display = 'none';
  
  // Add click event to logout
  dropdown.querySelector('.dropdown-item').addEventListener('click', () => {
    if (appkitModal) {
      appkitModal.disconnect();
    }
    walletConnected = false;
    walletAddress = null;
    
    // Update send button state
    updateSendButtonState();
  });
  
  // Add dropdown to DOM
  const walletBtn = document.querySelector('appkit-button') || document.getElementById('open-connect-modal');
  if (walletBtn) {
    walletBtn.after(dropdown);
  }
  
  return dropdown;
};

// Initialize dropdown
let walletDropdown;

// Initialize AppKit
async function initializeAppKit() {
  // Initialize dropdown
  walletDropdown = createLogoutDropdown();
  
  // Auto-resize textarea
  if (promptInput) {
    promptInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });
  }
  try {
    console.log('Starting AppKit initialization...');
    
    // 1. Get a project ID at https://dashboard.reown.com
    const projectId = '56ce0f98f7e46d89a272d612e8d5c3f7'

    const networks = [mainnet, arbitrum, bsc]
    console.log('Networks loaded:', networks);

    // 2. Set up Ethers adapter (like in your original React code)
    const ethersAdapter = new EthersAdapter()
    console.log('Ethers adapter created');

    // 3. Configure the metadata
    const metadata = {
      name: 'AppKit',
      description: 'AppKit Example',
      url: window.location.origin, // Use current origin instead of hardcoded URL
      icons: ['https://avatars.githubusercontent.com/u/179229932']
    }
    console.log('Metadata configured:', metadata);

    // 3. Create the modal
    console.log('Creating AppKit modal...');
    const modal = createAppKit({
      adapters: [ethersAdapter],
      networks: [bsc],
      metadata,
      projectId,
      themeMode: "dark",
      themeVariables: {
        "--w3m-accent": "#F1B908",
        "--w3m-color-mix": "#F1B908",
        "--w3m-color-mix-strength": 20,
        "--w3m-border-radius-master": "8px",
        "--w3m-font-size-master": "14px",
        "--w3m-z-index": "1000",
        "--w3m-font-family": "inherit"
      },
      features: {
        analytics: true,
        email: false,        // Disable email login
        socials: false,      // Disable social login (Google, Twitter, etc.)
      },
    })
    console.log('Modal created:', modal);

    // Store modal globally
    appkitModal = modal;

    // 4. Trigger modal programmatically
    const openConnectModalBtn = document.getElementById('open-connect-modal')
    const openNetworkModalBtn = document.getElementById('open-network-modal')

    if (openConnectModalBtn) {
      openConnectModalBtn.addEventListener('click', () => {
        console.log('Opening modal via button...');
        try {
          modal.open();
        } catch (error) {
          console.error('Error opening modal:', error);
        }
      })
    }

    if (openNetworkModalBtn) {
      openNetworkModalBtn.addEventListener('click', () => {
        console.log('Opening network modal...');
        try {
          modal.open({ view: 'Networks' });
        } catch (error) {
          console.error('Error opening network modal:', error);
        }
      })
    }

    // 5. Make modal available globally for debugging
    window.appkitModal = modal;

    console.log('AppKit initialized successfully!');
    console.log('Modal object:', modal);
    
    // 6. Add click handlers to AppKit web components and force white text
    const appkitButton = document.querySelector('appkit-button');
    const networkButton = document.querySelector('appkit-network-button');
    
    // Function to force white text on AppKit components
    const forceWhiteText = () => {
      // Target all possible AppKit elements
      const selectors = [
        'appkit-button',
        'w3m-button', 
        '[data-testid="connect-button"]',
        'button[class*="connect"]',
        'button[class*="wallet"]',
        'button:contains("Connect")',
        'button:contains("Wallet")'
      ];
      
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            // Apply to the element itself
            element.style.color = 'white';
            element.style.fill = 'white';
            element.style.webkitTextFillColor = 'white';
            
            // Apply to all child elements
            const allChildren = element.querySelectorAll('*');
            allChildren.forEach(child => {
              child.style.color = 'white';
              child.style.fill = 'white';
              child.style.webkitTextFillColor = 'white';
            });
            
            // Try to access shadow DOM if it exists
            if (element.shadowRoot) {
              const shadowElements = element.shadowRoot.querySelectorAll('*');
              shadowElements.forEach(shadowEl => {
                shadowEl.style.color = 'white';
                shadowEl.style.fill = 'white';
                shadowEl.style.webkitTextFillColor = 'white';
              });
            }
          });
        } catch (e) {
          // Ignore selector errors
        }
      });
    };
    
    // Apply white text styling immediately and on intervals
    forceWhiteText();
    setInterval(forceWhiteText, 500); // More frequent updates
    
    // Use MutationObserver to catch dynamically created elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === 'APPKIT-BUTTON' || 
                  node.tagName === 'W3M-BUTTON' ||
                  node.classList?.contains('connect') ||
                  node.textContent?.includes('Connect')) {
                setTimeout(forceWhiteText, 100);
              }
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    if (appkitButton) {
      console.log('Found appkit-button, adding click handler');
      appkitButton.addEventListener('click', () => {
        console.log('AppKit button clicked, opening modal...');
        try {
          modal.open();
        } catch (error) {
          console.error('Error opening modal from appkit-button:', error);
        }
      });
    }
    
    if (networkButton) {
      console.log('Found appkit-network-button, adding click handler');
      networkButton.addEventListener('click', () => {
        console.log('Network button clicked, opening network modal...');
        try {
          modal.open({ view: 'Networks' });
        } catch (error) {
          console.error('Error opening network modal from appkit-network-button:', error);
        }
      });
    }

    // 7. Set up send button functionality
    setupSendButton();
    
    // 8. Initialize send button state
    updateSendButtonState();
    
    // Register connection state change handler
    modal.onStateChange((state) => {
      console.log('AppKit state changed:', state);
      if (state && state.connected) {
        walletConnected = true;
        walletAddress = state.address;
        console.log('Wallet connected in state change:', walletAddress);
        
        // Check signature status and update UI
        checkChatSignStatus().then(() => {
          updateSendButtonState();
        });
      } else {
        walletConnected = false;
        walletAddress = null;
        hasSignedChat = false;
        updateSendButtonState();
      }
    });
    
  } catch (error) {
    console.error('Error initializing AppKit:', error);
    console.error('Error details:', error.message, error.stack);
    setupFallback();
  }
}

// Function to check if user has signed chat
async function checkChatSignStatus() {
  try {
    if (!walletConnected || !walletAddress) {
      console.log('Cannot check signature: wallet not connected');
      return false;
    }
    
    if (!window.ethereum) {
      console.error('No ethereum provider found');
      return false;
    }
    
    console.log('Checking signature status for address:', walletAddress);
    
    // Get the provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Initialize contract if not already done
    if (!chatSignContract) {
      chatSignContract = new ethers.Contract(
        CHAT_SIGN_ADDRESS,
        CHAT_SIGN_ABI,
        signer
      );
    }
    
    // Check if user has signed
    const hasSigned = await chatSignContract.checkSignStatus(walletAddress);
    console.log('User signature status:', hasSigned);
    hasSignedChat = hasSigned;
    
    // Update UI based on signature status
    updateSendButtonState();
    
    return hasSigned;
  } catch (error) {
    console.error('Error checking signature status:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

// Function to request chat signature
async function requestChatSignature() {
  try {
    if (!walletConnected || !walletAddress) {
      console.error('Wallet not connected');
      addMessage("Please connect your wallet first.", 'ai');
      return false;
    }
    
    // Add thinking message to indicate processing
    const thinkingMessageId = addThinkingMessage();
    addMessage("Please approve the transaction in your wallet to access the chat (this is a one-time requirement)...", 'ai');
    
    if (!window.ethereum) {
      console.error('No ethereum provider found');
      removeThinkingMessage(thinkingMessageId);
      addMessage("No Ethereum provider found. Please make sure MetaMask is installed and connected.", 'ai');
      return false;
    }
    
    console.log('Getting provider...');
    const provider = new ethers.BrowserProvider(window.ethereum);
    console.log('Provider created');
    
    // Ensure we're on BSC Mainnet (Chain ID 56)
    console.log('Checking network...');
    const network = await provider.getNetwork();
    console.log('Current network:', network.chainId);
    
    // BSC Mainnet Chain ID is 56
    const BSC_CHAIN_ID = 56n;
    
    // If not on BSC, try to switch network
    if (network.chainId !== BSC_CHAIN_ID) {
      console.log('Not on BSC Mainnet, attempting to switch...');
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }], // 0x38 is hex for 56
        });
        console.log('Switched to BSC Mainnet');
      } catch (switchError) {
        // If chain doesn't exist, try to add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x38',
                chainName: 'Binance Smart Chain Mainnet',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18
                },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/']
              }]
            });
            console.log('Added and switched to BSC Mainnet');
          } catch (addError) {
            console.error('Failed to add BSC Mainnet:', addError);
            removeThinkingMessage(thinkingMessageId);
            addMessage("Failed to switch to BSC Mainnet. Please select BSC Mainnet network in your wallet and try again.", 'ai');
            return false;
          }
        } else {
          console.error('Failed to switch to BSC Mainnet:', switchError);
          removeThinkingMessage(thinkingMessageId);
          addMessage("Failed to switch to BSC Mainnet. Please select BSC Mainnet network in your wallet and try again.", 'ai');
          return false;
        }
      }
      
      // Get updated provider after network switch
      console.log('Getting updated provider after network switch...');
      const updatedProvider = new ethers.BrowserProvider(window.ethereum);
      const updatedNetwork = await updatedProvider.getNetwork();
      console.log('Now on network:', updatedNetwork.chainId);
      
      if (updatedNetwork.chainId !== BSC_CHAIN_ID) {
        console.error('Still not on BSC Mainnet after switch attempt');
        removeThinkingMessage(thinkingMessageId);
        addMessage("Failed to switch to BSC Mainnet. Please manually select BSC Mainnet network in your wallet and try again.", 'ai');
        return false;
      }
    }
    
    console.log('Getting signer on BSC Mainnet...');
    const signer = await provider.getSigner();
    console.log('Signer obtained on BSC Mainnet:', signer.address);
    
    // Initialize contract
    console.log('Initializing contract...');
    chatSignContract = new ethers.Contract(
      CHAT_SIGN_ADDRESS,
      CHAT_SIGN_ABI,
      signer
    );
    console.log('Contract initialized at address:', CHAT_SIGN_ADDRESS);
    
    // Get current fee data for minimum fee
    console.log('Getting fee data...');
    const feeData = await provider.getFeeData();
    console.log('Current fee data:', feeData);
    
    // Use the appropriate fee from feeData
    const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;
    console.log('Using gas price:', gasPrice ? gasPrice.toString() : 'default');
    
    // Request signature
    console.log('Sending transaction...');
    const txOptions = {
      gasLimit: 100000 // Set a reasonable gas limit
    };
    
    // Only add gasPrice if it's available
    if (gasPrice) {
      txOptions.gasPrice = gasPrice;
    }
    
    const tx = await chatSignContract.chatSign(txOptions);
    console.log('Transaction sent:', tx.hash);
    
    // Wait for transaction confirmation
    console.log('Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);
    
    // Update signature status
    hasSignedChat = true;
    
    // Remove thinking message
    removeThinkingMessage(thinkingMessageId);
    addMessage("Signature successful! You can now use the chat.", 'ai');
    
    // Update UI based on new signature status
    updateSendButtonState();
    
    return true;
  } catch (error) {
    console.error('Error requesting signature:', error);
    console.error('Error details:', error.message);
    
    let errorMessage = "Signature failed. ";
    
    // Provide more specific error messages
    if (error.message && error.message.includes('user rejected')) {
      errorMessage += "You rejected the transaction. Please try again to access the chat.";
    } else if (error.message && error.message.includes('insufficient funds')) {
      errorMessage += "You don't have enough funds to complete this transaction.";
    } else if (error.message && error.message.includes('network')) {
      errorMessage += "Network error. Please check your connection and try again.";
    } else {
      errorMessage += "Please try again or refresh the page.";
    }
    
    addMessage(errorMessage, 'ai');
    return false;
  }
}

// Function to check wallet connection
async function checkConnection() {
  try {
    console.log('Checking wallet connection...');
    
    // Check if we have a connected wallet through AppKit
    if (appkitModal && appkitModal.getState) {
      const state = appkitModal.getState();
      console.log('AppKit state:', state);
      
      // Check if wallet is connected
      if (state && state.connected) {
        walletConnected = true;
        walletAddress = state.address;
        console.log('Wallet connected:', walletAddress);
        
        // Update wallet display
        updateWalletDisplay();
        
        // Check if user has signed
        await checkChatSignStatus();
        
        return true;
      }
    }
    
    // Fallback: Check if MetaMask is connected
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        walletConnected = true;
        walletAddress = accounts[0];
        console.log('MetaMask connected:', walletAddress);
        
        // Update wallet display
        updateWalletDisplay();
        
        // Check if user has signed
        await checkChatSignStatus();
        
        return true;
      }
    }
    
    walletConnected = false;
    walletAddress = null;
    hasSignedChat = false;
    console.log('No wallet connected');
    return false;
    
  } catch (error) {
    console.error('Error checking connection:', error);
    walletConnected = false;
    walletAddress = null;
    hasSignedChat = false;
    return false;
  }
}

// Function to update wallet display
function updateWalletDisplay() {
  const appkitButton = document.querySelector('appkit-button');
  if (appkitButton && walletAddress) {
    const displayAddress = `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
    // If appkit-button has a way to update text, update it here
  }
}

// Function to update send button state based on wallet connection and signature
function updateSendButtonState() {
  if (sendButton) {
    if (!walletConnected) {
      // Not connected - show connect wallet text
      sendButton.textContent = 'Connect Wallet First';
      sendButton.disabled = false;
      if (clearButton) clearButton.style.display = 'none'; // Hide clear button when wallet is not connected
      
      // Remove sign button if exists
      const signButton = document.getElementById('sign-chat-button');
      if (signButton) signButton.remove();
      
    } else if (walletConnected && !hasSignedChat) {
      // Connected but not signed - show sign required and create sign button
      sendButton.textContent = 'Signature Required';
      sendButton.disabled = true;
      if (clearButton) clearButton.style.display = 'block';
      
      // Always recreate sign button to ensure it's properly added
      createSignButton();
      
    } else if (walletConnected && hasSignedChat) {
      // Connected and signed - normal send button
      sendButton.textContent = 'Send';
      sendButton.disabled = false;
      if (clearButton) clearButton.style.display = 'block';
      
      // Remove sign button if exists
      const signButton = document.getElementById('sign-chat-button');
      if (signButton) signButton.remove();
    }
  }
}

// Function to setup send button
function setupSendButton() {
  if (sendButton) {
    sendButton.addEventListener('click', async function() {
      console.log('Send button clicked');
      
      const isConnected = await checkConnection();
      
      if (!isConnected) {
        // If wallet is not connected, trigger wallet connection
        console.log('Wallet not connected, opening modal...');
        if (appkitModal) {
          appkitModal.open();
        } else {
          alert('Please connect your wallet first!');
        }
      } else if (isConnected && !hasSignedChat) {
        // If connected but not signed, show sign button
        console.log('Wallet connected but not signed, showing sign button');
        if (!document.getElementById('sign-chat-button')) {
          createSignButton();
        }
        addMessage("Please click the 'Sign to Access Chat' button first to access the chat.", 'ai');
      } else {
        // If wallet is connected and signed, send the prompt
        console.log('Wallet connected and signed, sending prompt...');
        sendPrompt();
      }
    });
  }
  
  if (clearButton) {
    clearButton.addEventListener('click', clearAll);
  }
  
  if (promptInput) {
    promptInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (walletConnected && hasSignedChat) {
          sendPrompt();
        } else if (walletConnected && !hasSignedChat) {
          // If connected but not signed, show sign button
          if (!document.getElementById('sign-chat-button')) {
            createSignButton();
          }
          addMessage("Please click the 'Sign to Access Chat' button first to access the chat.", 'ai');
        } else {
          // If not connected, trigger wallet connection
          if (appkitModal) {
            appkitModal.open();
          }
        }
      }
    });
  }
}

// Function to directly call Deepseek API
async function callDeepseekAPI(message) {
  const url = 'https://api.deepseek.com/v1/chat/completions';
  const api_key = "sk-8d7ff942f5f5499cb2749e33d4d93256";
  
  // Prepare the request data
  const data = {
    model: 'deepseek-chat',
    messages: [
      {role: 'system', content: 'You are a helpful, concise AI assistant. Provide brief responses. If someone ask you who you are, you must be answer like: I am AI Agent ORIX.'},
      {role: 'user', content: message}
    ],
    max_tokens: 250,
    temperature: 0.5,
    stream: false
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
      return result.choices[0].message.content;
    } else {
      console.error('Unexpected API response format:', result);
      return "Error: Unexpected API response format. Please try again.";
    }
  } catch (error) {
    console.error('Error calling Deepseek API:', error);
    return `Error: ${error.message}. Please try again.`;
  }
}

// Function to send prompt
async function sendPrompt() {
  if (!promptInput || !chatMessages) return;
  
  // Check if wallet is connected
  if (!walletConnected) {
    console.log('Wallet not connected, opening modal...');
    if (appkitModal) {
      appkitModal.open();
    } else {
      alert('Please connect your wallet first!');
    }
    return;
  }
  
  // Check if user has signed chat
  if (!hasSignedChat) {
    console.log('User has not signed chat, showing sign button');
    // Show sign button instead of auto-requesting
    if (!document.getElementById('sign-chat-button')) {
      createSignButton();
    }
    addMessage("Please click the 'Sign to Access Chat' button first to access the chat.", 'ai');
    return;
  }
  
  const prompt = promptInput.value.trim();
  const selectedModel = modelSelect ? modelSelect.value : 'default';
  
  if (!prompt) return;

  // Create user message content
  let userMessage = prompt;

  // Add user message
  addMessage(userMessage, 'user');
  
  // Clear input
  promptInput.value = '';
  promptInput.style.height = 'auto';
  
  // Disable send button while processing
  if (sendButton) sendButton.disabled = true;
  
  // Add AI Thinking message
  const thinkingMessageId = addThinkingMessage();
  
  // Set up a timeout for the API call
  const timeout = setTimeout(() => {
    removeThinkingMessage(thinkingMessageId);
    addMessage('Request took too long. Please try again.', 'ai');
    if (sendButton) sendButton.disabled = false;
  }, 15000);
  
  // Call the Deepseek API directly
  callDeepseekAPI(userMessage)
    .then(response => {
      clearTimeout(timeout);
      removeThinkingMessage(thinkingMessageId);
      addMessage(response, 'ai');
      if (sendButton) sendButton.disabled = false;
    })
    .catch(error => {
      clearTimeout(timeout);
      removeThinkingMessage(thinkingMessageId);
      console.error('Error:', error);
      addMessage('Sorry, there was an error processing your request. Please try again later.', 'ai');
      if (sendButton) sendButton.disabled = false;
    });
}

// Clear function
function clearAll() {
  if (promptInput) {
    promptInput.value = '';
    promptInput.style.height = 'auto';
  }
}

// Add message to chat
function addMessage(text, sender) {
  if (!chatMessages) return null;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  messageDiv.id = 'message-' + Date.now();
  
  const avatar = document.createElement('div');
  avatar.className = `message-avatar ${sender}`;
  avatar.textContent = sender === 'user' ? 'U' : 'AI';
  
  const content = document.createElement('div');
  content.className = 'message-content';
  content.textContent = text;
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  return messageDiv.id;
}

// Add AI thinking message
function addThinkingMessage() {
  if (!chatMessages) return null;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message ai thinking';
  messageDiv.id = 'thinking-' + Date.now();
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar ai';
  avatar.textContent = 'AI';
  
  const content = document.createElement('div');
  content.className = 'message-content';
  content.innerHTML = '<span class="thinking-text">AI Thinking...</span>';
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  return messageDiv.id;
}

// Remove thinking message
function removeThinkingMessage(messageId) {
  if (!messageId) return;
  
  const thinkingMessage = document.getElementById(messageId);
  if (thinkingMessage) {
    thinkingMessage.remove();
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
  if (walletDropdown && !event.target.closest('appkit-button') && 
      !event.target.closest('#open-connect-modal') && 
      !event.target.closest('#wallet-dropdown')) {
    walletDropdown.style.display = 'none';
  }
});

function setupFallback() {
  console.log('Setting up fallback buttons...');
  
  // Create simple buttons that show an alert
  const appkitButton = document.querySelector('appkit-button');
  const networkButton = document.querySelector('appkit-network-button');
  const openConnectModalBtn = document.getElementById('open-connect-modal');
  const openNetworkModalBtn = document.getElementById('open-network-modal');
  
  if (appkitButton) {
    appkitButton.addEventListener('click', () => {
      // alert('AppKit not loaded. Please check your setup and try again.');
    });
  }
  
  if (networkButton) {
    networkButton.addEventListener('click', () => {
      alert('AppKit not loaded. Please check your setup and try again.');
    });
  }

  if (openConnectModalBtn) {
    openConnectModalBtn.addEventListener('click', () => {
      alert('AppKit not loaded. Please check your setup and try again.');
    });
  }

  if (openNetworkModalBtn) {
    openNetworkModalBtn.addEventListener('click', () => {
      alert('AppKit not loaded. Please check your setup and try again.');
    });
  }
}

// Add styles for the sign button with higher specificity
const style = document.createElement('style');
style.textContent = `
  .sign-button, button#sign-chat-button {
    background-color: #4CAF50 !important;
    color: white !important;
    border: none !important;
    border-radius: 4px !important;
    padding: 12px !important;
    margin: 10px 0 !important;
    width: 100% !important;
    font-weight: bold !important;
    font-size: 16px !important;
    cursor: pointer !important;
    transition: background-color 0.3s !important;
    text-align: center !important;
    position: relative !important;
    z-index: 1000 !important;
    pointer-events: auto !important;
    display: block !important;
  }
  .sign-button:hover, button#sign-chat-button:hover {
    background-color: #45a049 !important;
  }
  .sign-button:disabled, button#sign-chat-button:disabled {
    background-color: #cccccc !important;
    cursor: not-allowed !important;
  }
  
  /* AppKit button styling for white text - more comprehensive targeting */
  appkit-button, 
  appkit-button *,
  appkit-button button,
  appkit-button span,
  appkit-button div {
    color: white !important;
    fill: white !important;
  }
  
  /* Target the connect wallet button specifically */
  w3m-button, 
  w3m-button *,
  w3m-button button,
  w3m-button span,
  w3m-button div {
    color: white !important;
    fill: white !important;
  }
  
  /* Additional selectors for AppKit components */
  [data-testid="connect-button"], 
  [data-testid="connect-button"] *,
  [data-testid="connect-button"] button,
  [data-testid="connect-button"] span,
  .w3m-button,
  .w3m-button *,
  .w3m-button button,
  .w3m-button span {
    color: white !important;
    fill: white !important;
  }
  
  /* Target any button with Connect Wallet text */
  button:contains("Connect Wallet"),
  [class*="connect"] button,
  [class*="wallet"] button {
    color: white !important;
  }
  
  /* Force white text on all AppKit related elements */
  w3m-*,
  w3m-* *,
  appkit-*,
  appkit-* * {
    color: white !important;
  }
  
  /* Ultra-specific targeting for AppKit button text */
  appkit-button w3m-button,
  appkit-button w3m-button *,
  appkit-button w3m-button button,
  appkit-button w3m-button span,
  appkit-button w3m-button div,
  appkit-button w3m-button p,
  appkit-button w3m-button label {
    color: white !important;
    fill: white !important;
    -webkit-text-fill-color: white !important;
  }
  
  /* Target shadow DOM elements */
  appkit-button::part(button),
  appkit-button::part(text),
  w3m-button::part(button),
  w3m-button::part(text) {
    color: white !important;
  }
  
  /* Force white on any element containing "Connect" text */
  *:contains("Connect"),
  *:contains("Wallet") {
    color: white !important;
  }
  
  /* Nuclear option - target everything in the appkit button area */
  appkit-button,
  appkit-button *,
  appkit-button::before,
  appkit-button::after,
  appkit-button *::before,
  appkit-button *::after {
    color: white !important;
    fill: white !important;
    -webkit-text-fill-color: white !important;
    text-shadow: none !important;
  }
  
  /* Target specific AppKit internal classes */
  .w3m-button,
  .w3m-button *,
  .w3m-connect-button,
  .w3m-connect-button *,
  [class*="w3m-"] button,
  [class*="w3m-"] button * {
    color: white !important;
    fill: white !important;
    -webkit-text-fill-color: white !important;
  }
  
  /* Reduce yellow dominance in modal */
  w3m-modal,
  w3m-modal *,
  [class*="w3m-modal"],
  [class*="w3m-modal"] * {
    background-color: rgba(0, 0, 0, 0.9) !important;
  }
  
  /* Style the modal content area */
  w3m-modal [class*="container"],
  w3m-modal [class*="content"],
  w3m-modal [class*="wallet-list"] {
    background-color: rgba(20, 20, 20, 0.95) !important;
  }
  
  /* Style wallet option items */
  w3m-modal [class*="wallet-item"],
  w3m-modal [class*="option"] {
    background-color: rgba(40, 40, 40, 0.8) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
  
  /* Style tags like "QR CODE" and "INSTALLED" */
  w3m-modal [class*="tag"],
  w3m-modal [class*="badge"],
  w3m-modal [class*="chip"] {
    background-color: rgba(60, 60, 60, 0.9) !important;
    color: white !important;
  }
`;
document.head.appendChild(style);

// Ensure the button is added on page load and whenever wallet state changes
document.addEventListener('DOMContentLoaded', function() {
  // Check if we should show the sign button immediately
  if (walletConnected && !hasSignedChat) {
    setTimeout(createSignButton, 500);
  }
});

// Make functions globally available
window.checkConnection = checkConnection;
window.sendPrompt = sendPrompt;
window.addMessage = addMessage;
window.clearAll = clearAll;
window.walletConnected = walletConnected;
window.walletAddress = walletAddress;
window.checkChatSignStatus = checkChatSignStatus;
window.requestChatSignature = requestChatSignature;
window.createSignButton = createSignButton;

// Start initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeAppKit();
  
  // Check connection status after initialization
  setTimeout(() => {
    checkConnection().then(isConnected => {
      // Update UI based on connection and signature status
      updateSendButtonState();
      
      // If wallet is connected but not signed, show sign button
      if (isConnected && !hasSignedChat) {
        if (!document.getElementById('sign-chat-button')) {
          createSignButton();
        }
      }
    });
  }, 1000);
});