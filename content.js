const AZ_PROBLEM_KEY = "AZ_PROBLEM_KEY";

let currentProblemUrl = null; 

let addBookmarkButtonTimeout;
const DEBOUNCE_DELAY = 100; 

const observer = new MutationObserver(() => {
    clearTimeout(addBookmarkButtonTimeout);
    addBookmarkButtonTimeout = setTimeout(() => {
        addBookmarkButton();
    }, DEBOUNCE_DELAY);
});

observer.observe(document.body, { childList: true, subtree: true });

addBookmarkButton();

function getPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('maang.in')) return 'maang';
    if (hostname.includes('leetcode.com')) return 'leetcode';
    return null;
}

function onProblemsPage() {
    const platform = getPlatform();
    if (platform === 'maang') {
        return window.location.pathname.startsWith('/problems/');
    } else if (platform === 'leetcode') {
        return window.location.pathname.startsWith('/problems/');
    }
    return false;
}

function getProblemSelector() {
    const platform = getPlatform();
    if (platform === 'maang') {
        return 'coding_problem_info_heading__G9ueL';
    } else if (platform === 'leetcode') {
        return 'text-title-large'; 
    }
    return null;
}

function getInsertionPoint() {
    const platform = getPlatform();
    if (platform === 'maang') {
        const elements = document.getElementsByClassName("coding_problem_info_heading__G9ueL");
        return elements[0]?.parentNode;
    } else if (platform === 'leetcode') {
        const titleElement = document.querySelector('[data-cy="question-title"]') ||
                             document.querySelector('.text-title-large') ||
                             document.querySelector('h1');
        return titleElement?.parentNode;
    }
    return null;
}

function addBookmarkButton() {
    console.log("addBookmarkButton triggered");

    const currentUrl = window.location.href;
    const isCurrentlyOnProblemPage = onProblemsPage();
    const existingButton = document.getElementById("add_bookmark_btn");

    if (existingButton && (currentUrl !== currentProblemUrl || !isCurrentlyOnProblemPage)) {
        console.log("Removing old bookmark button or button for a different URL.");
        existingButton.remove();
        currentProblemUrl = null; 
    }

    if (!isCurrentlyOnProblemPage || (existingButton && currentUrl === currentProblemUrl)) {
        return;
    }

    const platform = getPlatform();
    if (!platform) {
        console.log("Platform not detected.");
        return;
    }

    const bookmarkbtn = document.createElement('div');
    bookmarkbtn.id = "add_bookmark_btn"

    bookmarkbtn.style.color = "white"
    bookmarkbtn.style.backgroundColor = "#36454F"; 

    bookmarkbtn.textContent = `Bookmark ${platform === 'maang' ? 'Problem' : 'LeetCode Problem'}`

    bookmarkbtn.style.border = "1px solid #ccc";
    bookmarkbtn.style.padding = "8px 12px";
    bookmarkbtn.style.borderRadius = "6px";
    bookmarkbtn.style.cursor = "pointer";
    bookmarkbtn.style.display = "inline-block";
    bookmarkbtn.style.marginTop = "10px";
    bookmarkbtn.style.fontSize = "14px";
    bookmarkbtn.style.fontWeight = "500";
    bookmarkbtn.style.userSelect = "none"; 

    const insertionPoint = getInsertionPoint();
    if (insertionPoint) {
        insertionPoint.insertAdjacentElement("afterend", bookmarkbtn);
        bookmarkbtn.addEventListener("click", addNewBookMarkHandler);
        currentProblemUrl = currentUrl; 
        console.log("Bookmark button added for:", currentProblemUrl);
    } else {
        console.log("Insertion point not found.");
    }
}

async function addNewBookMarkHandler() {
    const cr = await getCurrentBookmarks();

    const problemUrl = window.location.href;
    const uniqueId = extractUniqueId(problemUrl);
    const problemName = getProblemName(); 

    if (!problemName || !uniqueId) {
        console.error("Could not extract problem name or ID");
        return;
    }

    const platform = getPlatform();
    const btn = document.getElementById("add_bookmark_btn");
    const originalText = `Bookmark ${platform === 'maang' ? 'Problem' : 'LeetCode Problem'}`;
    const originalColor = "#36454F"; 

    if (cr.some((bookmark) => bookmark.id == uniqueId)) {
        console.log("Problem already bookmarked");
        if (btn) {
            btn.textContent = "Already Bookmarked!";
            btn.style.backgroundColor = "#FFC107"; 
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = originalColor;
            }, 2000); 
        }
        return; 
    }

    const bookmarkObj = {
        id: uniqueId,
        name: problemName, 
        url: problemUrl,
        platform: platform
    }

    const updatedBookmarks = [...cr, bookmarkObj];

    chrome.storage.sync.set({ AZ_PROBLEM_KEY: updatedBookmarks }, () => {
        console.log('Bookmarks updated', updatedBookmarks);

        if (btn) {
            btn.textContent = "✓ Bookmarked!";
            btn.style.backgroundColor = "#4CAF50"; 
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = originalColor;
            }, 2000);
        }
    })
}

function getProblemName() {
    const platform = getPlatform();
    if (platform === 'maang') {
        const element = document.getElementsByClassName("coding_problem_info_heading__G9ueL")[0];
        return element?.innerText?.trim();
    } else if (platform === 'leetcode') {
        const titleElement = document.querySelector('[data-cy="question-title"]') ||
                             document.querySelector('.text-title-large') ||
                             document.querySelector('h1');
        let problemName = titleElement?.innerText?.trim();
        
        if (problemName) {
            problemName = problemName.replace(/^\d+\.\s*/, '');
        }
        return problemName;
    }
    return null;
}

function extractUniqueId(url) {
    const platform = getPlatform();

    if (platform === 'maang') {
        const x = url.indexOf("problems/") + "problems/".length;
        const y = url.indexOf("?", x);
        return y == -1 ? url.substring(x) : url.substring(x, y);
    } else if (platform === 'leetcode') {
        const x = url.indexOf("problems/") + "problems/".length;
        const y = url.indexOf("/", x);
        const z = url.indexOf("?", x);

        let endIndex = url.length;
        if (y > x && (z === -1 || y < z)) endIndex = y;
        if (z > x && (y === -1 || z < y)) endIndex = z;

        return url.substring(x, endIndex);
    }
    return null;
}

function getCurrentBookmarks() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get([AZ_PROBLEM_KEY], (results) => {
            resolve(results[AZ_PROBLEM_KEY] || []);
        });
    });
}