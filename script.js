// // Connect wallet functionality
// let walletConnected = false;
// let walletAddress = '';

// // Create logout dropdown


// // Initialize dropdown




// // Close dropdown when clicking outside
// document.addEventListener('click', (event) => {
//   if (walletDropdown && !event.target.closest('.connect-wallet') && !event.target.closest('#wallet-dropdown')) {
//     walletDropdown.style.display = 'none';
//   }
// });

// // AI Platform functionality
// const promptInput = document.getElementById('promptInput');
// const sendButton = document.getElementById('sendButton');
// const clearButton = document.getElementById('clearButton');
// const chatMessages = document.getElementById('chatMessages');
// const modelSelect = document.getElementById('modelSelect');

// // Auto-resize textarea
// promptInput.addEventListener('input', function() {
//   this.style.height = 'auto';
//   this.style.height = Math.min(this.scrollHeight, 200) + 'px';
// });

// // Function to update send button state based on wallet connection
// function updateSendButtonState() {
//   if (walletConnected) {
//     sendButton.textContent = 'Send';
//     sendButton.disabled = false;
//     clearButton.style.display = 'block'; // Show clear button when wallet is connected
//   } else {
//     sendButton.textContent = 'Connect Wallet First';
//     sendButton.disabled = false;
//     clearButton.style.display = 'none'; // Hide clear button when wallet is not connected
//   }
// }

// // Send prompt function
// function sendPrompt() {
//   // If wallet is not connected, trigger wallet connection instead
//   if (!walletConnected) {
//     document.querySelector('.connect-wallet').click();
//     return;
//   }
  
//   const prompt = promptInput.value.trim();
//   const selectedModel = modelSelect.value;
  
//   if (!prompt) return;

//   // Create user message content
//   let userMessage = prompt;

//   // Add user message
//   addMessage(userMessage, 'user');
  
//   // Clear input
//   promptInput.value = '';
//   promptInput.style.height = 'auto';
  
//   // Disable send button while processing
//   sendButton.disabled = true;
  
//   // Add AI Thinking message
//   const thinkingMessageId = addThinkingMessage();
  
//   // Call the PHP API
//   const formData = new FormData();
//   formData.append('message', userMessage);
//   formData.append('wallet_address', walletAddress);
//   formData.append('model', selectedModel);
  
//   fetch('chat.php', {
//     method: 'POST',
//     headers: {
//       'X-Requested-With': 'XMLHttpRequest'
//     },
//     body: formData
//   })
//   .then(response => response.text())
//   .then(data => {
//     // Remove thinking message
//     removeThinkingMessage(thinkingMessageId);
    
//     // Add AI response to chat
//     addMessage(data, 'ai');
//     // Re-enable send button
//     sendButton.disabled = false;
//   })
//   .catch(error => {
//     // Remove thinking message
//     removeThinkingMessage(thinkingMessageId);
    
//     console.error('Error sending message:', error);
//     addMessage('Sorry, there was an error processing your request.', 'ai');
//     sendButton.disabled = false;
//   });
// }

// // Clear function
// function clearAll() {
//   promptInput.value = '';
//   promptInput.style.height = 'auto';
// }

// // Add message to chat
// function addMessage(text, sender) {
//   const messageDiv = document.createElement('div');
//   messageDiv.className = `message ${sender}`;
  
//   const avatar = document.createElement('div');
//   avatar.className = `message-avatar ${sender}`;
//   avatar.textContent = sender === 'user' ? 'U' : 'AI';
  
//   const content = document.createElement('div');
//   content.className = 'message-content';
//   content.textContent = text;
  
//   messageDiv.appendChild(avatar);
//   messageDiv.appendChild(content);
  
//   chatMessages.appendChild(messageDiv);
//   chatMessages.scrollTop = chatMessages.scrollHeight;
  
//   return messageDiv.id;
// }

// // Add AI thinking message
// function addThinkingMessage() {
//   const messageDiv = document.createElement('div');
//   messageDiv.className = 'message ai thinking';
//   messageDiv.id = 'thinking-' + Date.now();
  
//   const avatar = document.createElement('div');
//   avatar.className = 'message-avatar ai';
//   avatar.textContent = 'AI';
  
//   const content = document.createElement('div');
//   content.className = 'message-content';
//   content.innerHTML = '<span class="thinking-text">AI Thinking...</span>';
  
//   messageDiv.appendChild(avatar);
//   messageDiv.appendChild(content);
  
//   chatMessages.appendChild(messageDiv);
//   chatMessages.scrollTop = chatMessages.scrollHeight;
  
//   return messageDiv.id;
// }

// // Remove thinking message
// function removeThinkingMessage(messageId) {
//   const thinkingMessage = document.getElementById(messageId);
//   if (thinkingMessage) {
//     thinkingMessage.remove();
//   }
// }

// // Event listeners
// sendButton.addEventListener('click', function() {
//   if (!walletConnected) {
//     // If wallet is not connected, trigger wallet connection
//     document.querySelector('.connect-wallet').click();
//   } else {
//     // If wallet is connected, send the prompt
//     sendPrompt();
//   }
// });
// clearButton.addEventListener('click', clearAll);

// promptInput.addEventListener('keypress', function(e) {
//   if (e.key === 'Enter' && !e.shiftKey) {
//     e.preventDefault();
//     sendPrompt();
//   }
// });

// // Initialize send button state on page load

// // Initialize send button state on page load
// document.addEventListener('DOMContentLoaded', function() {
//   updateSendButtonState();
  
//   // Check if Metamask is already connected
//   if (typeof window.ethereum !== 'undefined') {
//     window.ethereum.request({ method: 'eth_accounts' })
//       .then(accounts => {
//         if (accounts.length > 0) {
//           walletAddress = accounts[0];
//           walletConnected = true;
          
//           // Update connect wallet button text
//           const connectWalletBtn = document.querySelector('.connect-wallet');
//           connectWalletBtn.textContent = `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
          
//           // Update send button state
//           updateSendButtonState();
//         }
//       })
//       .catch(error => console.error('Error checking Metamask connection:', error));
//   }
// });


import { BrowserProvider, Contract, parseEther } from "ethers";

// FUNCTION TO CHECK WALLET CONNECTION



const provider = await modal.subscribeProviders((state) => {
  return state["eip155"];
});



async function checkConnection() {
 
  const ethersProvider = new BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();

  console.log("signer:", signer);

}