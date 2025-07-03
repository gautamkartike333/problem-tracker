// const bookmarkImgURL = chrome.runtime.getURL("assets/bookmark.png")
const AZ_PROBLEM_KEY = "AZ_PROBLEM_KEY";

const observer = new MutationObserver(()=>{
    addBookmarkButton();
})

observer.observe(document.body, {childList:true, subtree:true});

addBookmarkButton();

// window.addEventListener("load", addBookmarkButton);

function onProblemsPage(){
    return window.location.pathname.startsWith('/problems/')
}

function addBookmarkButton(){
    console.log("triggering");
    

    if(!onProblemsPage() || (document.getElementById("add_bookmark_btn"))) return;

    const bookmarkbtn = document.createElement('div');
    bookmarkbtn.id = "add_bookmark_btn"
    // bookmarkbtn.src = bookmarkImgURL;

    
    bookmarkbtn.style.color = "grey"
    bookmarkbtn.style.backgroundColor = "#36454F"
    bookmarkbtn.textContent = "Bookmark Problem"

    bookmarkbtn.style.border = "1px solid #ccc";
    bookmarkbtn.style.padding = "5px 10px"; 
    bookmarkbtn.style.borderRadius = "4px"; 
    bookmarkbtn.style.cursor = "pointer"; 
    bookmarkbtn.style.display = "inline-block"; 

    const y = document.getElementsByClassName("coding_problem_info_heading__G9ueL");
    y[0].parentNode.insertAdjacentElement("beforeend", bookmarkbtn);

    bookmarkbtn.addEventListener("click", addNewBookMarkHandler);
}

async function addNewBookMarkHandler(){
    const cr = await getCurrentBookmarks();
    
    const azProblemUrl = window.location.href;
    const uniqueId = extractUniqueId(azProblemUrl);
    const problemName = document.getElementsByClassName("coding_problem_info_heading__G9ueL")[0].innerText;
    if(cr.some((bookmark) => bookmark.id == uniqueId)) return;

    const bookmarkObj = {
        id: uniqueId,
        name: problemName,
        url: azProblemUrl
    }
    
    const updatedBookmarks = [...cr,bookmarkObj];

    chrome.storage.sync.set({AZ_PROBLEM_KEY: updatedBookmarks}, () => {
        console.log('Bookmarks updated',updatedBookmarks);
    })

}

function extractUniqueId(url){
    const x = url.indexOf("problems/") + "problems/".length;
    const y = url.indexOf("?",x);
    return y == -1 ? url.substring(x) : url.substring(start,end);
}

function getCurrentBookmarks(){
    return new Promise ((resolve,reject) => {
        chrome.storage.sync.get([AZ_PROBLEM_KEY],(results)=>{
            resolve(results[AZ_PROBLEM_KEY]|| []);
        });
    });
}