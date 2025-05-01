const bins = {
  organic: ['apple', 'banana', 'leaves', 'plant-waste', 'eggshells'],
  toxic: ['battery', 'chemical', 'mercury_thermometer', 'light_bulbs'],
  recyclable: ['plastic', 'paper', 'bottle', 'cardboard', 'glass_bottles'],
  soiled: ['diapers', 'tissue', 'gloves', 'face_mask', 'bandages'],
  ewaste: ['phone', 'laptop', 'tv', 'circuit_board', 'charger_cable']
};

let currentWaste = '';
let points = {
  organic: 0,
  toxic: 0,
  recyclable: 0,
  soiled: 0,
  ewaste: 0
};

// Function to show the custom alert
function showAlert(message) {
  const alertBox = document.getElementById('custom-alert');
  const alertMessage = document.getElementById('alert-message');
  alertMessage.textContent = message; // Set the custom message
  alertBox.style.display = 'flex'; // Show the alert box
}

// Function to close the custom alert
function closeAlert() {
  document.getElementById('custom-alert').style.display = 'none'; // Hide the alert box
}

// Function to generate a new random waste item
function generateRandomWaste() {
  const categories = Object.keys(bins);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const items = bins[category];
  const item = items[Math.floor(Math.random() * items.length)];

  currentWaste = item; // Store the waste item (not just the category)

  const wasteItem = document.getElementById('waste-item');
  wasteItem.src = `/pics/${item}.png`; // Use actual images of the waste items
  wasteItem.setAttribute('data-category', category); // Set the category for matching
  wasteItem.setAttribute('data-item', item); // Set the waste item itself
}

function checkMatch(event) {
  event.preventDefault();

  const binCategory = event.currentTarget.id;
  const draggedWasteCategory = document.getElementById('waste-item').getAttribute('data-category');
  const draggedWasteItem = document.getElementById('waste-item').getAttribute('data-item');

  if (binCategory === draggedWasteCategory && bins[binCategory].includes(draggedWasteItem)) {
      points[binCategory]++;
      document.querySelector(`#${binCategory} .points`).textContent = points[binCategory];
      generateRandomWaste();
  } else {
      // Show custom alert when the condition is not met
      showAlert("Incorrect");
  }
}

// Set up drag and drop event listeners
document.getElementById('waste-item').addEventListener('dragstart', (event) => {
  event.dataTransfer.setData('text/plain', event.target.id); // Set the ID of the dragged element
});

// Allow bins to accept waste by preventing default behavior in the dragover event
document.querySelectorAll('.bin').forEach(bin => {
  bin.addEventListener('dragover', (event) => {
    event.preventDefault(); // Allow drop on this bin
  });

  // Call checkMatch when waste is dropped on a bin
  bin.addEventListener('drop', checkMatch);
});

// Generate the initial waste item
generateRandomWaste();
