document.getElementById('backButton').addEventListener('click', function() {
  incrementScore();
  window.location.href = '../index.html';
  localStorage.setItem('targetLevel', 3);
});

let currentIndex = 0;
const token = localStorage.getItem('token'); // JWT token for authentication
const rollNumber = localStorage.getItem('username'); // Roll number
console.log(rollNumber);

async function incrementScore() {
  const experience = 10; // Increment score by 10
  const data = { rollNumber: rollNumber, score: experience };

  console.log("Sending data to update score:", data);

  try {
    const response = await fetch('http://localhost:5000/api/students/update-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to update score');
    }

    const result = await response.json();
    console.log('Score updated:', result);
  } catch (error) {
    console.error('Error updating score:', error);
  }
}

function showSlide(index) {
  const slides = document.querySelector('.slides');
  const items = slides.querySelectorAll('img, iframe, button');

  // Hide the current slide
  items[currentIndex].style.display = 'none';

  // Update current index
  if (index >= items.length) {
    currentIndex = 0;
  } else if (index < 0) {
    currentIndex = items.length - 1;
  } else {
    currentIndex = index;
  }

  // Show the new current slide
  items[currentIndex].style.display = 'block';
}  

function changeSlide(n) {
  // Trigger cloud animation
  animateClouds();

  // Change slide after animation
  setTimeout(() => {
    showSlide(currentIndex + n);
  }, 3000); // Delay for cloud animation to finish
}

// Cloud Animation for 4 clouds
function animateClouds() {
  const cloud = document.getElementById('cloud');
  const cloud1 = document.getElementById('cloud1');
  const cloud2 = document.getElementById('cloud2');
  const cloud3 = document.getElementById('cloud3');

  // Show clouds and move them to center over slide
  cloud.style.opacity = '1';
  cloud1.style.opacity = '1';
  cloud2.style.opacity = '1';
  cloud3.style.opacity = '1';
  cloud.classList.add('center');
  cloud1.classList.add('center1');
  cloud2.classList.add('center2');
  cloud3.classList.add('center3');

  // Hide clouds after animation duration
  setTimeout(() => {
    cloud.style.opacity = '0';
    cloud1.style.opacity = '0';
    cloud2.style.opacity = '0';
    cloud3.style.opacity = '0';
    cloud.classList.remove('center');
    cloud1.classList.remove('center1');
    cloud2.classList.remove('center2');
    cloud3.classList.remove('center3');
  }, 3000); // Adjust as needed for animation timing
}

// Modal Logic
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  const iframe = modal.querySelector('.modal-iframe');

  // Reset iframe src to force reload
  iframe.src = iframe.src;

  // Display the modal
  modal.style.display = 'block';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = 'none';
}

// Initial display
showSlide(currentIndex);
