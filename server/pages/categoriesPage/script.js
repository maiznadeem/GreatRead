document.addEventListener('DOMContentLoaded', function () {

    const logoutButton = document.getElementById("logoutButton");
    const addBook = document.getElementById("addBook");

    const addCategoryButton = document.getElementById("addCategoryButton");
    const deleteCategoryButton = document.getElementById("deleteCategoryButton");
    const categorySearchButton = document.getElementById("categorySearchButton");
    const categorySearchInput = document.getElementById("categorySearchInput");
    const categorySearchResults = document.getElementById("categorySearchResults");
    const categoryResponseMessage = document.getElementById("categoryResponseMessage");

    function resetCategoryResponseMessage() {
        categoryResponseMessage.innerText = '';
        categoryResponseMessage.classList.remove('error', 'success');
    }

    addCategoryButton.addEventListener('click', function (e) {
        e.preventDefault();
    
        const categoryName = document.getElementById("category").value.trim();
        const categoryImageFile = document.getElementById("categoryImage").files[0];
        const isBestSeller = false;
    
        resetCategoryResponseMessage();
    
        if (categoryName === "") {
            categoryResponseMessage.innerText = "Category name cannot be empty.";
            categoryResponseMessage.classList.add('error');
            return;
        }
    
        if (!categoryImageFile) {
            categoryResponseMessage.innerText = "Please select an image.";
            categoryResponseMessage.classList.add('error');
            return;
        }
    
        addCategoryButton.disabled = true;
        addCategoryButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    
        const confirmation = confirm("Are you sure you want to add this category?");
        if (confirmation) {
            const formData = new FormData();
            formData.append('categoryName', categoryName);
            formData.append('categoryImage', categoryImageFile);
            formData.append('isBestSeller', isBestSeller);
    
            fetch('/admin/addcategory', {
                method: 'POST',
                body: formData
            })
                .then((response) => {
                    if (response.status === 200) {
                        categoryResponseMessage.innerText = "Category added successfully!";
                        categoryResponseMessage.classList.add('success');
                        document.getElementById("category").value = "";
                    } else {
                        categoryResponseMessage.innerText = "Error: " + response.statusText;
                        categoryResponseMessage.classList.add('error');
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                    categoryResponseMessage.innerText = "An error occurred while adding the category.";
                    categoryResponseMessage.classList.add('error');
                })
                .finally(() => {
                    addCategoryButton.disabled = false;
                    addCategoryButton.innerHTML = 'Add Category';
                });
        } else {
            addCategoryButton.disabled = false;
            addCategoryButton.innerHTML = 'Add Category';
        }
    });
    

    deleteCategoryButton.addEventListener('click', function (e) {
        e.preventDefault();
        resetCategoryResponseMessage();

        const categoryId = document.getElementById("categoryId").value;

        if (!categoryId || categoryId.trim() === "") {
            categoryResponseMessage.innerText = "Error: Enter Valid Category ID";
            categoryResponseMessage.classList.add('error');
            return;
        }

        const confirmation = confirm("Are you sure you want to delete this category?");
        if (confirmation) {

            deleteCategoryButton.disabled = true;
            deleteCategoryButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

            fetch(`/admin/deletecategory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ categoryId: categoryId })
            })
                .then((response) => {
                    if (response.status === 200) {
                        categoryResponseMessage.innerText = "Category deleted successfully!";
                        categoryResponseMessage.classList.add('success');
                        document.getElementById("categoryId").value = "";
                    } else {
                        categoryResponseMessage.innerText = "Error: " + response.statusText;
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                })
                .finally(() => {
                    deleteCategoryButton.disabled = false;
                    deleteCategoryButton.innerHTML = 'Delete Category';
                });
        }
    });

    categorySearchButton.addEventListener('click', function (e) {
        e.preventDefault();

        categorySearchButton.disabled = true;
        categorySearchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';

        const searchTerm = categorySearchInput.value;
        fetch(`/admin/searchcategory?term=${encodeURIComponent(searchTerm)}`)
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw new Error('Error fetching categories');
                }
            })
            .then((data) => {
                categorySearchResults.innerHTML = '';
                if (data && data.length > 0) {
                    data.forEach((category) => {
                        const categoryItem = document.createElement('div');
                        categoryItem.classList.add('category-item');
                        const details = document.createElement('p');
                        const idLabel = document.createElement('strong');
                        idLabel.textContent = 'ID:';
                        const nameLabel = document.createElement('strong');
                        nameLabel.textContent = 'Name:';
                        details.append(idLabel, ` ${category._id}`, document.createElement('br'), nameLabel, ` ${category.name}`);
                        categoryItem.appendChild(details);
                        categorySearchResults.appendChild(categoryItem);
                    });
                } else {
                    categorySearchResults.innerText = 'No categories found.';
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            })
            .finally(() => {
                categorySearchButton.disabled = false;
                categorySearchButton.innerHTML = 'Search Categories';
            });
    });

    logoutButton.addEventListener('click', function () {
        fetch('/logout', {
            method: 'POST',
        })
            .then((response) => {
                if (response.status === 200) {
                    window.location.href = '/authpage';
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    });

    addBook.addEventListener('click', function () {
        window.history.back();
    })

});
