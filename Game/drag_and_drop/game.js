document.addEventListener('DOMContentLoaded', () => {
    const itemsContainer = document.getElementById('itemsContainer');
    const categoriesContainer = document.getElementById('categoriesContainer');

    if (!itemsContainer || !categoriesContainer) {
        console.error('Game containers not found!');
        return;
    }
    const taskId = 1;

    fetch(`http://localhost:5105/items/${taskId}`)
        .then(response => response.json())
        .then(items => {
            itemsContainer.innerHTML = '';
            categoriesContainer.innerHTML = ''; 

            const categories = {};

            items.forEach(item => {
                if (!categories[item.categoryId]) {
                    categories[item.categoryId] = {
                        name: `Category ${item.categoryId}`,
                        items: []
                    };
                }
                categories[item.categoryId].items.push(item);
            });

            // Create categories
            Object.entries(categories).forEach(([categoryId, category]) => {
                const categoryDiv = document.createElement('div');
                categoryDiv.classList.add('category');
                categoryDiv.setAttribute('data-category', categoryId);
                categoryDiv.innerHTML = `<strong>${category.name}</strong>`;
                categoryDiv.ondragover = (event) => event.preventDefault();
                categoryDiv.ondrop = function (event) {
                    event.preventDefault();
                    const itemId = event.dataTransfer.getData("text");
                    const itemElement = document.getElementById(itemId);
                    if (itemElement) {
                        categoryDiv.appendChild(itemElement);
                    }
                };
                categoriesContainer.appendChild(categoryDiv);
            });

            // Create items
            items.forEach(item => {
                const itemDiv = document.createElement('img');
                itemDiv.src = `http://localhost:5105${item.imageUrl}`;
                itemDiv.alt = item.itemName;
                itemDiv.classList.add('item');
                itemDiv.id = `item-${item._id}`;
                itemDiv.draggable = true;
                itemDiv.ondragstart = function (event) {
                    event.dataTransfer.setData("text", event.target.id);
                };
                itemsContainer.appendChild(itemDiv);
            });
        })
        .catch(error => console.error('Error fetching items:', error));
});
