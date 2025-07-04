// const AZ_PROBLEM_KEY = "AZ_PROBLEM_KEY";

// const assetsURLMap = {
//     "play": chrome.runtime.getURL("assets/play.png"),
//     "delete": chrome.runtime.getURL("assets/delete.png")
// }

// const bookmarkSection = document.getElementById("bookmarks");


// document.addEventListener("DOMContentLoaded", () => {
//     chrome.storage.sync.get([AZ_PROBLEM_KEY], (data) => {
//         const currentBookmarks = data[AZ_PROBLEM_KEY] || [];
//         viewBookmarks(currentBookmarks);
//     })

// })


// function viewBookmarks(bookmarks) {
//     bookmarkSection.innerHTML = "";

//     if(bookmarks.length === 0){
//     bookmarkSection.innerHTML = "<i>No Bookmarks to Show</i>";
//     return;
//     }

//     bookmarks.forEach(bookmark => addNewBookmark(bookmark));
// }

// function addNewBookmark(bookmark){
//     const newBookmark = document.createElement('div');
//     const bookmarkTitle = document.createElement('div');
//     const bookmarkControls = document.createElement('div');
    
//     bookmarkTitle.textContent = bookmark.name;
//     // bookmarkTitle.textContent = bookmark.name;
//     bookmarkTitle.classList.add("bookmark-title");

//     setControlAttributes(assetsURLMap["play"],onPlay,bookmarkControls);
//     setControlAttributes(assetsURLMap["delete"],onDelete,bookmarkControls);
//     bookmarkControls.classList.add("bookmark-controls");

//     newBookmark.classList.add("bookmark");

//     newBookmark.append(bookmarkTitle);
//     newBookmark.append(bookmarkControls);

//     newBookmark.setAttribute("url", bookmark.url);
//     newBookmark.setAttribute("bookmark-id", bookmark.id);

//     bookmarkSection.appendChild(newBookmark);

// }

// function setControlAttributes(src,handler,parentDiv){
//     const controlElement = document.createElement("img");
//     controlElement.src = src;
//     controlElement.addEventListener("click",handler);
//     parentDiv.appendChild(controlElement);

// }

// function onPlay(event){
//     const problemURL = event.target.parentNode.parentNode.getAttribute("url");
//     window.open(problemURL,"_blank");
// }

// function onDelete(){
//     const bookmarkItem = event.target.parentNode.parentNode;
//     const idtoremove = bookmarkItem.getAttribute("bookmark-id");
//     bookmarkItem.remove();

//     deleteItemFromStorage(idtoremove);    
// }

// function deleteItemFromStorage(idtoremove){
//     chrome.storage.sync.get([AZ_PROBLEM_KEY], (data) => {
//         const currentBookmarks = data[AZ_PROBLEM_KEY] || [];
//         const updatedBookmarks = currentBookmarks.filter((bookmark) => bookmark.id !== idtoremove);
//         chrome.storage.sync.set({AZ_PROBLEM_KEY:updatedBookmarks});
//     })
// }



////////////////////






const AZ_PROBLEM_KEY = "AZ_PROBLEM_KEY";

const assetsURLMap = {
    "play": chrome.runtime.getURL("assets/play.png"),
    "delete": chrome.runtime.getURL("assets/delete.png")
}

const bookmarkSection = document.getElementById("bookmarks");
const searchInput = document.getElementById("searchInput"); // Get reference to the new search input

document.addEventListener("DOMContentLoaded", () => {
    // Attach an event listener to the search input for real-time filtering
    searchInput.addEventListener("input", filterAndDisplayBookmarks);

    // Initial display of all bookmarks when the popup loads
    filterAndDisplayBookmarks();
});

/**
 * Fetches all bookmarks and then filters and displays them based on the current search input.
 */
async function filterAndDisplayBookmarks() {
    const searchTerm = searchInput.value.toLowerCase().trim(); // Get the search term and normalize it
    const allBookmarks = await getCurrentBookmarks(); // Fetch all bookmarks from storage

    let bookmarksToDisplay = allBookmarks;

    // If there's a search term, filter the bookmarks
    if (searchTerm) {
        bookmarksToDisplay = allBookmarks.filter(bookmark =>
            bookmark.name.toLowerCase().includes(searchTerm)
        );
    }

    viewBookmarks(bookmarksToDisplay); // Display the filtered (or unfiltered) bookmarks
}


function viewBookmarks(bookmarks) {
    bookmarkSection.innerHTML = ""; // Clear existing bookmarks

    if (bookmarks.length === 0) {
        // Display a message if no bookmarks are found or no results match the search
        bookmarkSection.innerHTML = "<i class='no-bookmarks-message'>No Bookmarks Found.</i>";
        return;
    }

    // Add each bookmark to the display
    bookmarks.forEach(bookmark => addNewBookmark(bookmark));
}

function addNewBookmark(bookmark) {
    const newBookmark = document.createElement('div');
    const bookmarkTitleDiv = document.createElement('div'); // This div will hold the clickable title
    const bookmarkControls = document.createElement('div');

    // Create an anchor tag for the problem name to make it clickable
    const problemLink = document.createElement('a');
    problemLink.href = bookmark.url;
    problemLink.textContent = bookmark.name;
    problemLink.target = "_blank"; // Opens the link in a new tab
    problemLink.title = `Go to ${bookmark.name} on ${bookmark.platform}`; // Add a tooltip

    bookmarkTitleDiv.appendChild(problemLink); // Append the link to the title div
    bookmarkTitleDiv.classList.add("bookmark-title"); // Apply existing title styles

    // Set up play and delete controls
    setControlAttributes(assetsURLMap["play"], onPlay, bookmarkControls);
    setControlAttributes(assetsURLMap["delete"], onDelete, bookmarkControls);
    bookmarkControls.classList.add("bookmark-controls"); // Apply existing controls styles

    newBookmark.classList.add("bookmark"); // Apply existing bookmark item styles

    newBookmark.append(bookmarkTitleDiv); // Add the title div
    newBookmark.append(bookmarkControls); // Add the controls

    // Store the bookmark ID for deletion purposes
    newBookmark.setAttribute("bookmark-id", bookmark.id);

    bookmarkSection.appendChild(newBookmark);
}

function setControlAttributes(src, handler, parentDiv) {
    const controlElement = document.createElement("img");
    controlElement.src = src;
    controlElement.addEventListener("click", handler);
    parentDiv.appendChild(controlElement);
}

function onPlay(event) {
    // Get the URL from the 'href' of the <a> tag inside the bookmark item
    const problemURL = event.target.closest('.bookmark').querySelector('.bookmark-title a').href;
    if (problemURL) {
        window.open(problemURL, "_blank");
    }
}

async function onDelete(event) {
    const bookmarkItem = event.target.closest('.bookmark'); // Use closest to reliably find the bookmark item
    if (!bookmarkItem) return;

    const idToRemove = bookmarkItem.getAttribute("bookmark-id");
    
    // Optimistically remove from UI immediately
    bookmarkItem.remove(); 

    // Delete from storage and then refresh the display based on current search
    await deleteItemFromStorage(idToRemove);
    filterAndDisplayBookmarks(); // Re-filter and display after deletion
}

function deleteItemFromStorage(idToRemove) {
    return new Promise((resolve) => {
        chrome.storage.sync.get([AZ_PROBLEM_KEY], (data) => {
            const currentBookmarks = data[AZ_PROBLEM_KEY] || [];
            const updatedBookmarks = currentBookmarks.filter((bookmark) => bookmark.id !== idToRemove);
            chrome.storage.sync.set({ AZ_PROBLEM_KEY: updatedBookmarks }, () => {
                resolve(); // Resolve the promise when storage update is complete
            });
        });
    });
}

// Helper function to get all current bookmarks from storage
function getCurrentBookmarks() {
    return new Promise((resolve) => {
        chrome.storage.sync.get([AZ_PROBLEM_KEY], (results) => {
            resolve(results[AZ_PROBLEM_KEY] || []);
        });
    });
}