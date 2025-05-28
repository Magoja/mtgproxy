// Function to log debug messages (optional, but useful for testing)
function logDebug(message) {
  const debugWindow = document.getElementById('debug-window');
  debugWindow.value += `${message}\n`; // Append the message
  debugWindow.scrollTop = debugWindow.scrollHeight; // Auto-scroll to the bottom
  console.log(message);
}

function createPreviewModalImageBox(imgElement, name, url) {
  const modalImg = document.createElement('img');
  modalImg.src = url;
  modalImg.alt = name;
  modalImg.classList.add('modal-image');
  return modalImg;
}

function createPreviewModalPopup(imgElement, name, urls) {
  const modalContent = document.createElement('div');
  modalContent.classList.add('modal-content');

  // Add all images to the modal
  urls.forEach((url) => {
    const modalImg = createPreviewModalImageBox(imgElement, name, url);
    modalContent.appendChild(modalImg);
    modalImg.addEventListener('click', () => {
      imgElement.src = url; // Update the main image
      modal.style.display = 'none'; // Close the modal
    });
  });

  const modal = document.createElement('div');
  modal.classList.add('modal');
  modal.style.display = 'none'; // Initially hidden
  modal.appendChild(modalContent);

  return modal;
}

function createImageBoxForPrint(name, url) {
  const imgElement = document.createElement('img');
  imgElement.src = url;
  imgElement.alt = name;
  imgElement.classList.add('main-image');
  return imgElement;
}

function attachPopupEventListeners(modal) {
  // Close modal when pressing the Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.style.display === 'block') {
      modal.style.display = 'none';
    }
  });

  // Close modal when clicking outside the content
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

function createImageBox(name, urls) {
  const container = document.createElement('div');
  container.classList.add('image-box');

  // Create the main image element
  const imgElement = createImageBoxForPrint(name, urls[0]);
  imgElement.addEventListener('click', () => {
    modal.style.display = 'block';
  });
  container.appendChild(imgElement);

  const modal = createPreviewModalPopup(imgElement, name, urls);
  attachPopupEventListeners(modal);
  document.body.appendChild(modal);
  return container;
}

function splitCardList(text) {
  return text.split('\n').map(card => card.trim()).filter(Boolean);
}

function getCardList() {
  let cardListString = document.getElementById('card-list').value;
  if (cardListString.trim() === "") {
    const debugCardList = "Necropotence\n".repeat(9);
    logDebug("No card list provided. Use debug list.");
    cardListString = debugCardList;
  }
  return splitCardList(cardListString);
}

function getListOfCardImageOnly(cardList) {
  let listOfCardImages = [];
  for (const card of cardList) {
    if (card.image_uris && card.image_uris.normal) {
      listOfCardImages.push(card.image_uris.normal);
    } else {
      logDebug(`No image found for card: ${card.name}`);
    }
  }
  return listOfCardImages;
}

async function fetchCardImageFromScryfall(cardName) {
  // Document: https://scryfall.com/docs/api/cards/search
  // Example: https://api.scryfall.com/cards/search?q=!%22Necropotence%22&pretty=true&unique=art
  let escapedCardNameExactMatch = encodeURIComponent("!\"" + cardName + "\"");
  const response = await fetch(`https://api.scryfall.com/cards/search?&unique=art&q=${escapedCardNameExactMatch}`);
  if (!response.ok) {
    throw new Error(`Error fetching card: ${response.statusText}`);
  }

  const cardData = await response.json();
  let imageLists = getListOfCardImageOnly(cardData.data);
  logDebug(`Fetched card data for "${cardName}": ${JSON.stringify(imageLists)}`);
  return imageLists;
}

function createGrid() {
  const kCardGrid = "card-grid";
  const grid = document.createElement('div');
  grid.classList.add(kCardGrid);
  return grid;
}

function getCardImageElementBlockAndClear() {
  const kCardImages = "card-images";
  const cardImages = document.getElementById(kCardImages);
  cardImages.innerHTML = ''; // Clear previous results
  return cardImages;
}

async function generateCardImages(cardList) {
  const kCardsPerPage = 9;

  let cardImages = getCardImageElementBlockAndClear();

  if (cardList.length == 0) {
    logDebug(" - No card is selected. Abort");
    return;
  }

  function startNewGrid() {
    let grid = createGrid();
    cardImages.appendChild(grid);
    return grid;
  }

  let grid = startNewGrid();

  for (const [index, cardName] of cardList.entries()) {
    logDebug(`Fetching card: ${cardName}`);

    // Create a new grid for every kCardsPerPage cards
    if (index > 0 && index % kCardsPerPage === 0) {
      grid = startNewGrid();
    }

    // Fetch the card image and add it to the current grid
    const imageUrls = await fetchCardImageFromScryfall(cardName);
    if (imageUrls.length > 0) {
      logDebug(`- Successfully fetched image for: ${cardName}`);
      grid.appendChild(createImageBox(cardName, imageUrls));
    } else {
      logDebug(`- Failed to fetch image for: ${cardName}`);
    }
  }
}

function unittest() {
  logDebug("## Unittest: Start");

  let testCoverages = {
    "[Test name template]": function () { /* do something here */ return true; },
    "Test splitCardList()": function () {
      function compare(input, expectedOutput) {
        let inputResult = JSON.stringify(input);
        let expectedResult = JSON.stringify(expectedOutput);
        if (inputResult != expectedResult) {
          logDebug(`- Test failed: Expected ${expectedResult}, got ${inputResult}`);
          return false;
        }
        return true;
      }

      if (!compare(splitCardList("Card1\nCard2\nCard3"), ["Card1", "Card2", "Card3"])) {
        return false;
      }
      if (!compare(splitCardList(" Card1 \n Card2 \n Card3 "), ["Card1", "Card2", "Card3"])) {
        return false;
      }
      if (!compare(splitCardList("Card1\n\nCard2\nCard3"), ["Card1", "Card2", "Card3"])) {
        return false;
      }
      if (!compare(splitCardList(""), [])) {
        return false;
      }
      if (!compare(splitCardList("   "), [])) {
        return false;
      }
      return true;
    }
  }

  function safeExecute(testName, testFunction) {
    try {
      if (!testFunction()) {
        logDebug(`- Test "${testName}" failed.`);
        return false;
      }
      return true;
    } catch (error) {
      logDebug(`- Test "${testName}" encountered an error: ${error.message}`);
      return false;
    }
  }

  let listFailedTests = [];

  for (const [testName, testFunction] of Object.entries(testCoverages)) {
    logDebug(`Running test: ${testName}`);
    if (!safeExecute(testName, testFunction)) {
      listFailedTests.push(testName);
    }
  }

  if (listFailedTests.length > 0) {
    logDebug("## Unittest: Failed tests:");
    for (const failedTest of listFailedTests) {
      logDebug(`- ${failedTest}`);
    }
  } else {
    logDebug("## Unittest: All tests passed.");
  }
}

document.getElementById('generate-proxies').addEventListener('click', async () => {
  logDebug("# Starting to generate proxies...");
  await generateCardImages(getCardList());
  logDebug("# Finished generating proxies.");
});

document.getElementById('print-proxies').addEventListener('click', () => {
  logDebug("# Preparing print view...");
  window.print();
});

document.addEventListener('DOMContentLoaded', () => {
  unittest();

  logDebug("# Tool is ready.");
});