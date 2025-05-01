document.addEventListener('DOMContentLoaded', () => {
    const pagesContainer = document.getElementById('pages-container');
    let savedPages = JSON.parse(localStorage.getItem('savedPages')) || [];

    if (!pagesContainer) {
        console.error('Error: pages-container element not found.');
        return;
    }

    const renderPages = () => {
        pagesContainer.innerHTML = '';
        savedPages.forEach((pageData, index) => {
            const pageDiv = document.createElement('div');
            pageDiv.style.display = 'flex';
            pageDiv.style.alignItems = 'center';
            pageDiv.style.justifyContent = 'space-between';
            pageDiv.style.flexWrap = 'wrap';
            pageDiv.style.padding = '15px';
            pageDiv.style.border = '1px solid #ccc';
            pageDiv.style.marginBottom = '10px';
            pageDiv.style.borderRadius = '10px';
            pageDiv.style.background = '#fff';
            pageDiv.style.boxShadow = '0px 2px 5px rgba(0, 0, 0, 0.1)';

            const title = document.createElement('h3');
            title.textContent = `Page ${index + 1}: ${pageData.title || 'Untitled'}`;
            pageDiv.appendChild(title);

            if (pageData.description && pageData.description.trim() !== '') {
                const descriptionPara = document.createElement('div');
                descriptionPara.textContent = pageData.description;
                descriptionPara.style.whiteSpace = 'pre-wrap';
                descriptionPara.style.wordWrap = 'break-word';
                descriptionPara.style.maxWidth = '100%';
                descriptionPara.style.overflow = 'hidden';
                descriptionPara.style.padding = '5px';
                descriptionPara.style.background = '#f8f8f8';
                descriptionPara.style.borderRadius = '5px';
                descriptionPara.style.border = '1px solid #ddd';
                pageDiv.appendChild(descriptionPara);
            } else {
                const noDescription = document.createElement('p');
                noDescription.textContent = 'No descriptions available.';
                pageDiv.appendChild(noDescription);
            }            

            if (pageData.diagram) {
                const diagramImage = document.createElement('img');
                diagramImage.src = pageData.diagram;
                diagramImage.alt = 'Diagram';
                diagramImage.style.maxWidth = '120px';
                diagramImage.style.height = 'auto';
                diagramImage.style.borderRadius = '5px';
                pageDiv.appendChild(diagramImage);
            }

            if (pageData.gif) {
                const gifImage = document.createElement('img');
                gifImage.src = pageData.gif;
                gifImage.alt = 'GIF';
                gifImage.style.maxWidth = '120px';
                gifImage.style.height = 'auto';
                gifImage.style.borderRadius = '5px';
                pageDiv.appendChild(gifImage);
            }

            if (pageData.audio) {
                const audioElement = document.createElement('audio');
                audioElement.src = pageData.audio;
                audioElement.controls = true;
                audioElement.style.width = '100%';
                audioElement.style.marginTop = '10px';
                pageDiv.appendChild(audioElement);
            }

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '🗑';
            deleteButton.style.background = 'tomato';
            deleteButton.style.color = 'white';
            deleteButton.style.border = 'none';
            deleteButton.style.padding = '5px 10px';
            deleteButton.style.borderRadius = '5px';
            deleteButton.style.cursor = 'pointer';
            deleteButton.style.marginLeft = '10px';
            deleteButton.style.fontSize = '16px';

            deleteButton.addEventListener('click', async () => {
                const page = savedPages[index];

                if (page._id) {
                    try {
                        await fetch(`http://localhost:5000/api/elements/${page._id}`, {
                            method: 'DELETE'
                        });
                    } catch (error) {
                        console.error('Error deleting element from backend:', error);
                    }
                }

                savedPages.splice(index, 1);
                localStorage.setItem('savedPages', JSON.stringify(savedPages));
                renderPages();
            });

            pageDiv.appendChild(deleteButton);
            pagesContainer.appendChild(pageDiv);
        });
    };

    renderPages();
});