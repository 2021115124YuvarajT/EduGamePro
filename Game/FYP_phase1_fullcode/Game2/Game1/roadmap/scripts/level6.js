document.getElementById('next').addEventListener('click', function() {
  incrementScore();
  window.location.href = '../levels/completed.html';
});

let currentIndex = 0;
const token = localStorage.getItem('token'); // Assuming the JWT token is stored in local storage
const rollNumber = localStorage.getItem('username'); // Assuming the roll number is stored in local storage
console.log(rollNumber);

async function incrementScore() {
  const experience = 10; // Increment score by 10

  const data = { rollNumber: rollNumber, score: experience }; // Ensure roll number is a number

  console.log("Sending data to update score:", data); // Log the data being sent

  fetch('http://localhost:5000/api/students/update-score', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Failed to update score');
      }
      return response.json();
  })
  .then(data => {
      console.log('Score updated:', data);
  })
  .catch(error => {
      console.error('Error updating score:', error);
  });
}

function showSlide(index) {
  const slides = document.querySelector('.slides');
  const items = slides.querySelectorAll('img, iframe, button');

  items[currentIndex].style.display = 'none';

  if (index >= items.length) {
    currentIndex = 0;
  } else if (index < 0) {
    currentIndex = items.length - 1;
  } else {
    currentIndex = index;
  }

  items[currentIndex].style.display = 'block';
}

function changeSlide(n) {
  animateClouds();
  setTimeout(() => {
    showSlide(currentIndex + n);
  }, 3000);
}

// Cloud Animation Function
function animateClouds() {
  const cloud = document.getElementById('cloud');
  const cloud1 = document.getElementById('cloud1');
  const cloud2 = document.getElementById('cloud2');
  const cloud3 = document.getElementById('cloud3');

  cloud.style.opacity = '1';
  cloud1.style.opacity = '1';
  cloud2.style.opacity = '1';
  cloud3.style.opacity = '1';
  cloud.classList.add('center');
  cloud1.classList.add('center1');
  cloud2.classList.add('center2');
  cloud3.classList.add('center3');

  setTimeout(() => {
    cloud.style.opacity = '0';
    cloud1.style.opacity = '0';
    cloud2.style.opacity = '0';
    cloud3.style.opacity = '0';
    cloud.classList.remove('center');
    cloud1.classList.remove('center1');
    cloud2.classList.remove('center2');
    cloud3.classList.remove('center3');
  }, 3000); // Adjust as needed
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
