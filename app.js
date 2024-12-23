// Function to log debug messages (optional, but useful for testing)
function logDebug(message) {
  const debugWindow = document.getElementById('debug-window');
  debugWindow.value += `${message}\n`; // Append the message
  debugWindow.scrollTop = debugWindow.scrollHeight; // Auto-scroll to the bottom
  console.log(message);
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

function createGrid() {
  const kCardGrid = "card-grid";
  const grid = document.createElement('div');
  grid.classList.add(kCardGrid);
  return grid;
}

async function generateCardImages(cardList) {
  const kCardImages = "card-images";

  const cardImages = document.getElementById(kCardImages);
  const kCardsPerPage = 6;

  let count = 0;
  
  cardImages.innerHTML = ''; // Clear previous results

  // <div class="card-grid" id="card-grid"></div>

  let grid = createGrid();
  cardImages.appendChild(grid);
  for (const cardName of cardList) {
    logDebug(`Fetching card: ${cardName}`);

    if (count != 0 && count % kCardsPerPage == 0) {
      grid = createGrid();
      cardImages.appendChild(grid);
    }
    
    const imageUrl = await fetchCardImage(cardName);
    if (imageUrl) {
      logDebug(`- Successfully fetched image for: ${cardName}`);
      grid.appendChild(createImageBox(cardName, imageUrl));
    } else {
      logDebug(`- Failed to fetch image for: ${cardName}`);
    }

    count = count + 1;
  }
}

document.getElementById('generate-proxies').addEventListener('click', async () => {
  logDebug("# Starting to generate proxies...");
  await generateCardImages(getCardList());
  logDebug("# Finished generating proxies.");
});

document.getElementById('print-proxies').addEventListener('click', () => {
  logDebug("Preparing print view...");
  window.print();
});
