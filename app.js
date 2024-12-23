// Function to log messages to the debug window
function logDebug(message) {
  const debugWindow = document.getElementById('debug-window');
  debugWindow.value += `${message}\n`; // Append the message
  debugWindow.scrollTop = debugWindow.scrollHeight; // Auto-scroll to the bottom
}

function createImageBox(name, url) {
  const imgElement = document.createElement('img');
  imgElement.src = url;
  imgElement.alt = name;
  return imgElement;
}

function getCardList() {
  return document.getElementById('card-list').value.split('\n').map(card => card.trim()).filter(Boolean);
}

async function generateCardImages(cardList) {
  const cardGrid = document.getElementById('card-grid');
  cardGrid.innerHTML = ''; // Clear previous results

  for (const cardName of cardList) {
    logDebug(`Fetching card: ${cardName}`);
    const imageUrl = await fetchCardImage(cardName);
    if (imageUrl) {
      logDebug(`- Successfully fetched image for: ${cardName}`);
      cardGrid.appendChild(createImageBox(cardName, imageUrl));
    } else {
      logDebug(`- Failed to fetch image for: ${cardName}`);
    }
  }
}

document.getElementById('generate-proxies').addEventListener('click', async () => {
  logDebug("# Starting to generate proxies...");
  generateCardImages(getCardList());
  logDebug("# Finished generating proxies. \n");
});

async function fetchCardImage(cardName) {
  try {
    const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
    if (!response.ok) throw new Error(`Error fetching card: ${response.statusText}`);
    const cardData = await response.json();
    return cardData.image_uris.normal;
  } catch (error) {
    logDebug(`Error fetching card "${cardName}": ${error.message}`);
    return null;
  }
}
