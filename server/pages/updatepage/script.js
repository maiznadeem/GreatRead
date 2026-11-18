document.addEventListener("DOMContentLoaded", function () {
    const addNotesButton = document.getElementById("addNotesButton");
    const addButton = document.getElementById("addButton");
    const logoutButton = document.getElementById("logoutButton");
    const getInfoButton = document.getElementById("getInfoButton");
    const updateButton = document.getElementById("updateButton");
    const deleteButton = document.getElementById("deleteButton");
    const changeButton = document.getElementById("changeButton");
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const searchResults = document.getElementById("searchResults");
    const responseMessage = document.getElementById("responseMessage");
    const publishingYearInput = document.getElementById('updatePublishingYear');
    const updateTopPicksButton = document.getElementById("updateTopPicks");
    const updateStatus = document.getElementById("updateStatus");

    updateButton.disabled = true;
    deleteButton.disabled = true;
    changeButton.disabled = true;

    updateButton.style.backgroundColor = 'lightgray';
    deleteButton.style.backgroundColor = 'lightgray';
    changeButton.style.backgroundColor = 'lightgray';

    let notesArray = [];

    function displayNotes() {
        const notesList = document.querySelector('#notesList');
        notesList.innerHTML = "";
        notesArray.forEach(note => {
            const listItem = document.createElement('li');
            listItem.textContent = note;
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.addEventListener('click', () => {
                const index = notesArray.indexOf(note);
                if (index !== -1) {
                    notesArray.splice(index, 1);
                    displayNotes();
                }
            });
            listItem.appendChild(removeButton);
            notesList.appendChild(listItem);
        });
    }

    addNotesButton.addEventListener('click', () => {
        const notes = document.querySelector('#notes').value.trim();
        if (notes !== "" && !notesArray.includes(notes)) {
            notesArray.push(notes);
            displayNotes();
            document.querySelector('#notes').value = "";
        }
    });

    function resetBookFields() {
        document.getElementById("bookId").value = '';
        document.getElementById("updateTitle").value = '';
        document.getElementById("updateAuthor").value = '';
        document.getElementById("updatePublishingYear").value = '2023';
        document.getElementById("amazon").value = '';
        document.getElementById("perlego").value = '';
        document.getElementById("quote").value = '';
        document.getElementById("notes").value = '';
        notesArray = [];
        displayNotes();
        const categoryCheckboxes = document.querySelectorAll('input[name="categories"]');
        categoryCheckboxes.forEach((checkbox) => {
            checkbox.checked = false;
            const categoryItem = checkbox.closest('.category-item');
            if (categoryItem) {
                categoryItem.classList.remove('selected');
            }
        });
        const fileInput = document.getElementById("image");
        fileInput.value = '';
    }
    

    function enableButtonsAndSetEditable(book) {
        updateButton.disabled = false;
        deleteButton.disabled = false;
        changeButton.disabled = false;
        updateButton.style.backgroundColor = '';
        deleteButton.style.backgroundColor = '';
        changeButton.style.backgroundColor = '';
        getInfoButton.disabled = true;
        getInfoButton.style.backgroundColor = 'lightgray';
        document.getElementById("bookId").readOnly = true;
        document.getElementById("updateTitle").value = book.title;
        document.getElementById("updateAuthor").value = book.author;
        document.getElementById("updatePublishingYear").value = book.publishingYear;
        document.getElementById("amazon").value = book.amazon;
        document.getElementById("perlego").value = book.perlego;
        document.getElementById("quote").value = book.quote;
        const categoryItems = document.querySelectorAll('.category-item');
        categoryItems.forEach((categoryItem) => {
            categoryItem.classList.remove('selected');
        });
        book.categories.forEach((category) => {
            const checkbox = document.querySelector(`input[value="${category}"]`);
            if (checkbox) {
                checkbox.checked = true;
                const categoryItem = checkbox.closest('.category-item');
                if (categoryItem) {
                    categoryItem.classList.add('selected');
                }
            }
        });
        notesArray = book.notes && book.notes.content ? book.notes.content : [];
        displayNotes();
    }

    getInfoButton.addEventListener("click", function (e) {
        e.preventDefault();
        resetResponseMessage();
        document.getElementById("updateTitle").value = '';
        document.getElementById("updateAuthor").value = '';
        document.getElementById("updatePublishingYear").value = '2023';
        document.getElementById("amazon").value = '';
        document.getElementById("perlego").value = '';
        document.getElementById("quote").value = '';
        const categoryCheckboxes = document.querySelectorAll('input[name="categories"]');
        categoryCheckboxes.forEach((checkbox) => {
            checkbox.checked = false;
            const categoryItem = checkbox.closest('.category-item');
            if (categoryItem) {
                categoryItem.classList.remove('selected');
            }
        });
        const fileInput = document.getElementById("image");
        fileInput.value = '';
        const bookId = document.getElementById("bookId").value.trim();
        if (!isValidBookId(bookId)) {
            handleResponseMessage("Invalid book ID. Please use only letters and numbers.", true);
            return;
        }
        axios.get(`/admin/getbook/${bookId}`)
            .then((response) => {
                const book = response.data;
                enableButtonsAndSetEditable(book);
                handleResponseMessage("Book info fetched successfully.", false);
            })
            .catch((error) => {
                console.error("Error fetching book info:", error);
                handleResponseMessage("Book info not found. Please check the book ID.", true);
            });
    });

    changeButton.addEventListener("click", function (e) {
        e.preventDefault()
        updateButton.disabled = true;
        deleteButton.disabled = true;
        changeButton.disabled = true;
        updateButton.style.backgroundColor = 'lightgray';
        deleteButton.style.backgroundColor = 'lightgray';
        changeButton.style.backgroundColor = 'lightgray';
        getInfoButton.disabled = false;
        getInfoButton.style.backgroundColor = '';
        document.getElementById("bookId").readOnly = false;
        resetBookFields();
    })

    const currentYear = new Date().getFullYear();
    publishingYearInput.setAttribute('max', currentYear);

    function fetchTopPicks() {
        fetch('/get/toppicks')
            .then((response) => response.json())
            .then((data) => {
                if (data && data.date && data.books && data.books.length === 3) {
                    const topPickMonthInput = document.getElementById('topPickMonth');
                    const topPickYearInput = document.getElementById('topPickYear');
                    const book1IdInput = document.getElementById('book1Id');
                    const book2IdInput = document.getElementById('book2Id');
                    const book3IdInput = document.getElementById('book3Id');
                    topPickMonthInput.value = data.date.month;
                    topPickYearInput.value = data.date.year;
                    book1IdInput.value = data.books[0]._id;
                    book2IdInput.value = data.books[1]._id;
                    book3IdInput.value = data.books[2]._id;
                } else {
                    handleError('Invalid top picks data received from the server.');
                }
            })
            .catch((error) => {
                console.error('Error fetching top picks:', error);
            });
    }

    fetchTopPicks();

    function isValidBookId(value) {
        return /^[a-zA-Z0-9]+$/.test(value);
    }

    function isValidMonth(value) {
        const month = parseInt(value, 10);
        return !isNaN(month) && month >= 1 && month <= 12;
    }

    function isValidYear(value) {
        const year = parseInt(value, 10);
        return !isNaN(year) && year >= 1200 && year <= 3000;
    }

    function isURL(str) {
        const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i;
        return urlPattern.test(str);
    }

    function handleUpdateStatus(message, isError) {
        updateStatus.innerText = message;
        updateStatus.style.color = isError ? 'red' : 'green';
    }

    function handleResponseMessage(message, isError) {
        responseMessage.innerText = message;
        responseMessage.style.color = isError ? 'red' : 'green';
    }

    function resetUpdateStatus() {
        updateStatus.innerText = '';
    }

    function resetResponseMessage() {
        responseMessage.innerText = '';
    }

    function handleUpdateTopPicks(e) {
        e.preventDefault();

        resetUpdateStatus();
    
        const topPickMonthInput = document.getElementById('topPickMonth');
        const topPickYearInput = document.getElementById('topPickYear');
        const book1IdInput = document.getElementById('book1Id');
        const book2IdInput = document.getElementById('book2Id');
        const book3IdInput = document.getElementById('book3Id');
    
        const month = topPickMonthInput.value.trim();
        const year = topPickYearInput.value.trim();
        const book1Id = book1IdInput.value.trim();
        const book2Id = book2IdInput.value.trim();
        const book3Id = book3IdInput.value.trim();
    
        if (!isValidMonth(month)) {
            handleUpdateStatus('Invalid month. Please enter a number between 1 and 12.', true);
            return;
        }
        if (!isValidYear(year)) {
            handleUpdateStatus('Invalid year. Please enter a number between 1200 and 3000.', true);
            return;
        }
        if (!isValidBookId(book1Id) || !isValidBookId(book2Id) || !isValidBookId(book3Id)) {
            handleUpdateStatus('Invalid book IDs. Please use only letters and numbers.', true);
            return;
        }
        updateTopPicksButton.disabled = true;
        updateTopPicksButton.innerText = 'Loading...';
        const requestData = {
            month: parseInt(month),
            year: parseInt(year),
            book1Id,
            book2Id,
            book3Id,
        };
        axios.post('/admin/updatetoppicks', requestData)
            .then((response) => {
                const success = response.status === 200;
                updateTopPicksButton.disabled = false;
                updateTopPicksButton.innerText = 'Update Top Picks';
                if (success) {
                    handleUpdateStatus('Top picks updated successfully.', false);
                } else {
                    handleUpdateStatus('Failed to update top picks. Please try again.', true);
                }
            })
            .catch((error) => {
                console.error('Error updating Top Picks:', error);
                updateTopPicksButton.disabled = false;
                updateTopPicksButton.innerText = 'Update Top Picks';
                handleUpdateStatus('An error occurred while updating top picks. Please try again.', true);
            });
    }
    updateTopPicksButton.addEventListener('click', handleUpdateTopPicks);

    searchButton.addEventListener("click", function () {
        const searchTerm = searchInput.value.trim();
        axios.get(`/admin/searchbook?term=${encodeURIComponent(searchTerm)}`)
            .then((response) => {
                const books = response.data;
                searchResults.innerHTML = "";
                if (books.length > 0) {
                    books.forEach((book) => {
                        const bookDiv = document.createElement("div");
                        bookDiv.classList.add("book");
                        [['ID:', book._id], ['Title:', book.title], ['Author:', book.author]].forEach(([label, value]) => {
                            const line = document.createElement("p");
                            const strong = document.createElement("strong");
                            strong.textContent = label;
                            line.append(strong, ` ${value}`);
                            bookDiv.appendChild(line);
                        });
                        searchResults.appendChild(bookDiv);
                    });
                } else {
                    searchResults.innerHTML = "<p>No matching books found.</p>";
                }
            })
            .catch((error) => {
                console.error("Error searching books:", error);
            });
    });

    const categoryGrid = document.getElementById('categoryCheckboxes');
    
    fetch('/get/categories')
        .then((response) => response.json())
        .then((categories) => {
            categories.forEach((category) => {
                const categoryItem = document.createElement('div');
                categoryItem.classList.add('category-item');

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = 'categories';
                checkbox.value = category.name;

                const label = document.createElement('label');
                label.textContent = category.name;

                categoryItem.appendChild(checkbox);
                categoryItem.appendChild(label);

                categoryItem.addEventListener('click', () => {
                    if (checkbox.checked) {
                        checkbox.checked = false;
                        categoryItem.classList.remove('selected');
                    } else {
                        checkbox.checked = true;
                        categoryItem.classList.add('selected');
                    }
                });

                categoryGrid.appendChild(categoryItem);
            });
        })
        .catch((error) => {
            console.error('Error fetching categories:', error);
        });

    updateButton.addEventListener("click", function (e) {
        e.preventDefault();
        resetResponseMessage();
        const bookId = document.getElementById("bookId").value.trim();
        const updateTitle = document.getElementById("updateTitle").value.trim();
        const updateAuthor = document.getElementById("updateAuthor").value.trim();
        const updatePublishingYear = document.getElementById("updatePublishingYear").value.trim();
        const amazon = document.getElementById("amazon").value.trim();
        const perlego = document.getElementById("perlego").value.trim();
        const quote = document.getElementById("quote").value.trim();
        const categoryCheckboxes = document.querySelectorAll('input[name="categories"]');
        const selectedCategories = [];
        categoryCheckboxes.forEach((checkbox) => {
            if (checkbox.checked) {
                selectedCategories.push(checkbox.value);
            }
        });
        if (!isValidBookId(bookId)) {
            handleResponseMessage("Invalid book ID. Please use only letters and numbers.", true);
            return;
        }
        if (!updateTitle || !updateAuthor || !updatePublishingYear || selectedCategories.length === 0) {
            handleResponseMessage("Please fill in all mandatory fields (Title, Author, Publishing Year, Categories).", true);
            return;
        }
        if (!(isURL(amazon) || isURL(perlego))) {
            handleError('Please provide valid Amazon / Perlego link.');
            return;
        }
        const formData = new FormData();
        formData.append("bookId", bookId);
        formData.append("updateTitle", updateTitle);
        formData.append("updateAuthor", updateAuthor);
        formData.append("updatePublishingYear", updatePublishingYear);
        formData.append("amazon", amazon);
        formData.append("perlego", perlego);
        formData.append("quote", quote);
        formData.append("categories", JSON.stringify(selectedCategories));
        notesArray.forEach(note => {
            formData.append('notesArray[]', note);
        });
        const imageInput = document.getElementById("image");
        if (imageInput.files.length > 0) {
            formData.append("image", imageInput.files[0]);
        }
        axios.post("/admin/updatebook", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        })
        .then((response) => {
            const success = response.status === 200;
            if (success) {
                handleResponseMessage("Book updated successfully.", false);

                resetBookFields();
                updateButton.disabled = true;
                deleteButton.disabled = true;
                changeButton.disabled = true;
                updateButton.style.backgroundColor = 'lightgray';
                deleteButton.style.backgroundColor = 'lightgray';
                changeButton.style.backgroundColor = 'lightgray';
                getInfoButton.disabled = false;
                getInfoButton.style.backgroundColor = '';
                document.getElementById("bookId").readOnly = false;

            } else {
                handleResponseMessage("Failed to update the book. Please try again.", true);
            }
        })
        .catch((error) => {
            console.error("Error updating book:", error);
            handleResponseMessage("An error occurred while updating the book. Please try again.", true);
        });
    });
    
    deleteButton.addEventListener("click", function (e) {
        e.preventDefault();
        resetResponseMessage();
        const bookId = document.getElementById("bookId").value.trim();
        if (!isValidBookId(bookId)) {
            handleResponseMessage("Invalid book ID. Please use only letters and numbers.", true);
            return;
        }
        axios.delete(`/admin/deletebook/${bookId}`)
            .then((response) => {
                const success = response.status === 200;
                if (success) {
                    handleResponseMessage("Book deleted successfully.", false);
                    resetBookFields();
                    updateButton.disabled = true;
                    deleteButton.disabled = true;
                    changeButton.disabled = true;
                    updateButton.style.backgroundColor = 'lightgray';
                    deleteButton.style.backgroundColor = 'lightgray';
                    changeButton.style.backgroundColor = 'lightgray';
                    getInfoButton.disabled = false;
                    getInfoButton.style.backgroundColor = '';
                    document.getElementById("bookId").readOnly = false;
                } else {
                    handleResponseMessage("Could not delete the book. Check ID again.", true);
                }
            })
            .catch((error) => {
                console.error("Error deleting book:", error);
                handleResponseMessage("An error occurred while deleting the book. Please try again", true);
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

    addButton.addEventListener('click', function (e) {
        e.preventDefault();
        window.history.back();
    });
});
