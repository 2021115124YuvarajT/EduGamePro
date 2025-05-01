document.addEventListener('DOMContentLoaded', () => {
  const titleElement = document.getElementById('preview-title');
  const descriptionsContainer = document.getElementById('preview-descriptions');
  const diagramElement = document.getElementById('preview-diagram');
  const gifElement = document.getElementById('preview-gif');
  const audioElement = document.getElementById('preview-audio');
  const saveButton = document.getElementById('save-button');

  // Load data from localStorage
  const pageData = JSON.parse(localStorage.getItem('previewPage'));

  if (pageData) {
    // Set title
    titleElement.textContent = pageData.title || 'Untitled';

    // Set description text and TTS button
    if (pageData.description) {
      descriptionsContainer.innerHTML = `
        <p id="preview-description">${pageData.description}</p>
        <button class="tts-button" onclick="speakText()">🔊</button>
      `;
    } else {
      descriptionsContainer.innerHTML = '<p>No description provided.</p>';
    }

    // Set diagram image
    if (pageData.diagram) {
      diagramElement.src = pageData.diagram;  // Use backend URL
      diagramElement.style.display = 'block';
    } else {
      diagramElement.style.display = 'none';
    }

    // Set GIF preview
    if (pageData.gif) {
      gifElement.src = pageData.gif;  // Use backend URL
      gifElement.style.display = 'block';
    } else {
      gifElement.style.display = 'none';
    }

    // Set audio preview
    if (pageData.audio) {
      audioElement.src = pageData.audio;  // Use backend URL
      audioElement.style.display = 'block';
    } else {
      audioElement.style.display = 'none';
    }
  } else {
    alert('No preview data found. Please add elements first.');
    location.href = 'add_elements.html'; // Redirect if no data found
  }

  // Save functionality
  saveButton.addEventListener('click', () => {
    const savedPages = JSON.parse(localStorage.getItem('savedPages')) || [];
    savedPages.push(pageData);
    localStorage.setItem('savedPages', JSON.stringify(savedPages));

    alert('Page saved successfully!');
    location.href = 'home.html'; // Redirect to home after saving
  });
});

function speakText() {
  const description = document.getElementById('preview-description').innerText;
  console.log(description);
  if (!description.trim()) return;
  
  const speech = new SpeechSynthesisUtterance(description);
  speech.lang = 'en-US';
  speech.rate = 1;
  speechSynthesis.speak(speech);
}
