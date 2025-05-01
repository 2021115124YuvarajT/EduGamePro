const previewButton = document.getElementById('previewButton');
function nextpage() {
  window.location.href = "preview.html";
}

function back() {
  window.location.href = "home.html";
}

previewButton.addEventListener('click', () => {
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const diagram = document.getElementById('diagram').files[0];
  const gif = document.getElementById('gif').files[0];
  const audio = document.getElementById('audio').files[0];

  if (!title || !description.trim() || !diagram) {
    alert('Title, description, and diagram are mandatory!');
    return;
  }

  // Prepare form data for backend submission
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('diagram', diagram);
  if (gif) formData.append('gif', gif);
  if (audio) formData.append('audio', audio);

  // Send data to the backend API
  fetch('http://localhost:5001/api/save-elements', {
    method: 'POST',
    body: formData,
  })
    .then(response => response.json())
    .then(data => {
      console.log('Backend Response:', data); // Debugging
  
      const pageData = {
        title: data.title || 'Missing Title',
        description: data.description || 'Missing Description',
        diagram: data.diagramUrl || 'Missing Diagram',
        gif: data.gifUrl || null,
        audio: data.audioUrl || null,
      };
      console.log('Stored Data:', pageData); // Debugging
      localStorage.setItem('previewPage', JSON.stringify(pageData));
  
      alert('Data saved successfully!');
      setTimeout(() => {
        location.href = 'preview.html';
      }, 100);
    })
    .catch(error => {
      console.error('Error saving data:', error);
      alert('Failed to save data to the backend.');
    });
});  