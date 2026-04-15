/**
 * @version 1.0
 * @author coregtree
 * @license GPL-3.0
 * @date 2026-04-13
 * @github https://github.com/coregtree/cherrytree-notes-web-interface
 */


//------------------------------------------------------------------------------------------
// Adjust font size function for the tree side and page side panels.
var treeSectionStyles = null;
var pageSectionStyles = null;
var treeFontSize = null;
var pageFontSize = null;

// Used to adjust fonst sizes on the tree and page sides and rewrite the URL with the new values.
function adjustSectionFont(target, selector, action, variablename, newTreeFontSize = 0.6, newPageFontSize = 0.6) {
    const section = target.querySelector(selector);
    if (!section) return;

    // Get current value (default to 0.5 if not set).
    let current = parseFloat(parseFloat(getComputedStyle(section).getPropertyValue(variablename)).toFixed(1)) || 0.6;

    // Increase font up or down by 0.1 units.
    if (action === 'up' && current < 3) {
        current += 0.1;
    } else if (action === 'down' && current > 0.2) {
        current -= 0.1;
    }
    else if (action === 'settreefontsize' && newTreeFontSize >= 0.2 && newTreeFontSize <= 3) {
        current = newTreeFontSize;
    }
    else if (action === 'setpagefontsize' && newPageFontSize >= 0.2 && newPageFontSize <= 3) {
        current = newPageFontSize;
    }

    // Apply new font size only to this specific section.
    section.style.setProperty(variablename, `${current}rem`);

    // Update the new font size values in the URL.
    const url = new URL(window.location);

    // Get tree panel font size.
    treeSectionStyles = getComputedStyle(document.querySelector('.outermost'));
    treeFontSize = parseFloat(parseFloat(treeSectionStyles.getPropertyValue('--tree-font-modifier')).toFixed(1));

    // If an iFrame page is active retrieve its font size.
    if (pageSectionStyles) {
        pageFontSize = parseFloat(parseFloat(pageSectionStyles.getPropertyValue('--page-font-modifier')).toFixed(1));
    }

    if (treeFontSize) { url.searchParams.set('tf', treeFontSize); }
    if (pageFontSize) { url.searchParams.set('pf', pageFontSize); }

    // Update the address bar.
    window.history.replaceState({}, '', url.pathname + url.search);
}

//------------------------------------------------------------------------------------------
// In this section:
// Added adjust font size buttons for tree side.
// Added active page function to show user which they are on currently.

// Function to find a button by its text content.
function findButtonByText(text) {
    const buttons = document.querySelectorAll('button');
    return Array.from(buttons).find(btn => btn.textContent.trim() === text);
}

// Locate 'Collapse All' button.
const insertAfterButtonTreeside = findButtonByText('Collapse All');

if (insertAfterButtonTreeside) {
    // Create the container for font controls.
    const controls = document.createElement('span');
    controls.style.display = 'flex';
    controls.style.alignItems = 'center';
    controls.style.justifyContent = 'center';
    controls.style.marginLeft = '20px';
    controls.style.marginTop = '10px';
    controls.style.flexWrap = 'wrap';
    controls.style.columnGap = '70px';
    controls.style.rowGap = '8px';
    controls.innerHTML = `
        <button style="white-space:nowrap;" id="btn-reset-all">Reset View</button>
        <span style="display:inline-flex;">
            <button id="btn-decrease">A-</button>
            <button style="margin-left:5px;margin-right:20px;" id="btn-increase">A+</button>
        </span>
        <span>
            <div id="copy-link-message">Link copied!</div>
            <button style="margin-left: -55px;white-space: nowrap;" id="copy-url-button">Get Link to Current View</button>
            <button style="margin-left: -55px;margin-top:10px;" id="print-page-button">Print Page</button>
        </span>
    `;

    // Insert the controls immediately after the found button.
    insertAfterButtonTreeside.parentNode.insertBefore(controls, insertAfterButtonTreeside.nextSibling);

}

// Scale up event for Tree Side.
document.getElementById('btn-increase').onclick = () => adjustSectionFont(document, '.outermost', 'up', '--tree-font-modifier');

// Scale down event for Tree Side.
document.getElementById('btn-decrease').onclick = () => adjustSectionFont(document, '.outermost', 'down', '--tree-font-modifier');


// Get all the list items.
var listItems = document.querySelectorAll('li a'); // ALSO USED IN SEARCH SECTION TO SORT RESULTS AND HIGHLIGHT FOUND TITLES.

// Used to retrieve page numbers/pageindexes from the index.html files onclick attributes.
function getNodePageIndexNumber(node) {
    const match = node.getAttribute('onclick')?.match(/(\d+)\.html/);
    const n = Number(match[1]);
    return Number.isNaN(n) ? null : n;
}


// Used for rewriting URL for navigation to specific pages.
function rewriteURL(pageNumber) { // Rewrite the url witn the specified value.
    const url = new URL(window.location);

    // Clear ALL existing parameters.
    url.search = ""; 

    url.searchParams.set('page', pageNumber);

    // Get tree panel font size.
    treeSectionStyles = getComputedStyle(document.querySelector('.outermost'));
    treeFontSize = parseFloat(parseFloat(treeSectionStyles.getPropertyValue('--tree-font-modifier')).toFixed(1));

    // If an iFrame page is active retrieve its font size.
    if (pageSectionStyles) {
        pageFontSize = parseFloat(parseFloat(pageSectionStyles.getPropertyValue('--page-font-modifier')).toFixed(1));
    }

    // Also include font sizes in rewritten URL.
    if (treeFontSize) { url.searchParams.set('tf', treeFontSize); }
    if (pageFontSize) { url.searchParams.set('pf', pageFontSize); }

    // Update the address bar.
    window.history.replaceState({}, '', url.pathname + url.search);
}

// Loop through each item and add a click event listener.
listItems.forEach(function(element) {
    element.addEventListener('click', function(e) {
        // Prevent default anchor behavior if they link to the same page.
        e.preventDefault(); 
        
        // Remove the 'active' class from all items.
        listItems.forEach(function(item) {
            item.classList.remove('active');
        });

        rewriteURL(getNodePageIndexNumber(element)); // Setup URL rewrites to clicked pages.

        // Add the 'active' class to the clicked item.
        this.classList.add('active');
    });
});

//------------------------------------------------------------------------------------------
// This section is for working inside the dynamically added iFrame on the page side.
// This requires reaching into the dynamically added iframe by the scipt3.js script.
//
// In this section:
// Make printing target the iFrame.
// Dynamically scale the page container to the size of its largest image.
// Add adjust font size buttons for the page side, these have to be also injected
// into the DOM when caching the page for correct element location mapping.

// Used to inject CSS into the iFrame to print the iFrame instead of the entire page.
function printIframe() {
  const iframe = document.getElementById('page_frame');
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument || win.document;

  const style = doc.createElement('style');
  style.textContent = `
    @media print {
      html, body {
        display: block !important;
        visibility: visible !important;
        overflow: visible !important;
        height: auto !important;
      }

      * {
        visibility: visible !important;
      }

      body * {
        display: revert !important;
      }

      .page * {
        color: black !important; 
      }
        
      div.page * {
        color: black !important;
      }

      [style*="display:none"] {
        display: revert !important;
      }

      [style*="visibility:hidden"] {
        visibility: visible !important;
      }

      .no-print, .noprint {
        display: none !important;
      }

      #btn-decrease-page, #btn-increase-page  {
        display: none !important;
      }

      /* Prevent elements from breaking across pages */
      img,
      figure,
      .print-block,
      table,
      section,
      article {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      /* Make images scale nicely */
      img {
        display: block;
        max-width: 100%;
        height: auto;
      }

    }
  `;
  doc.head.appendChild(style);

  win.focus();
  setTimeout(() => {
    win.print();
  }, 250);
}

// Overrides the Ctrl - P shortcut print behavior to print the iFrame only.
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
    const iframe = document.getElementById('page_frame');

    if (iframe && iframe.contentWindow && iframe.src) {
      e.preventDefault();
      printIframe();
    }
  }
});

document.getElementById('print-page-button').addEventListener("click", (e) => {
    const iframe = document.getElementById('page_frame');

    if (iframe && iframe.contentWindow && iframe.src) {
      e.preventDefault();
      printIframe();
    }
    else {
        alert('No page selected.');
    }
});

const observer = new MutationObserver((mutations, obs) => {
    const iframe = document.querySelector('iframe');
    
    if (iframe) {
        console.log("Found the dynamic iframe!");
        obs.disconnect(); // Stop watching once found.
        
        // Now wait for the iframe's internal content to load.
        iframe.addEventListener('load', () => {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const container = iframeDoc.querySelector('.page');

			if (container) {

                // Set iFrame page font size from URL if present.
                let userURLforPageFontSize = new URLSearchParams(window.location.search); 
                if (pageFontSize || userURLforPageFontSize.get('pf')) {
                    
                    if (!pageFontSize) { pageFontSize = getSafeText(userURLforPageFontSize.get('pf')); } // Retrieve page font size from URL if it it missing in pageFontSize.
                    adjustSectionFont(iframeDoc, '.page', 'setpagefontsize', '--page-font-modifier', undefined, pageFontSize);
                }

                pageSectionStyles  = getComputedStyle(container); // Update iFrame reference for page styles and font sizes.

				const images = container.querySelectorAll('img');
				console.log(`Found ${images.length} images inside the iframe container. Page container resized to the largest image.`);
				let maxWidth = 0;

				images.forEach(img => {
				// Use naturalWidth to get the image's actual file size rather than its current rendered size.
				if (img.naturalWidth > maxWidth) {
					maxWidth = img.naturalWidth;
				}
				});

				// Apply the largest width to the container.
                if (maxWidth != 0) {
                    container.style.maxWidth = maxWidth + 'px';
                }
                else {
                    container.style.maxWidth = '70vw';
                }

                // ALL PAGE SIDE .HTML FILE MODIFICATIONS NEED TO BE SIMULATED IN retrievePageStructure.
                // THESE BUTTONS ARE INJECTED INTO THE DOM INSIDE THE retrievePageStructure FUNCTION BECAUSE THE PAGE STRUCTURE HAS TO REMAIN FOR SEARCH TO WORK PROPERLY.

                // Font size button code. 
                const insertBeforeTitlePageside = container.querySelector('.title');

                if (insertBeforeTitlePageside) {
                    // Create the container for your font controls
                    const controls = document.createElement('span');
                    controls.style.display = 'flex';
                    controls.style.alignItems = 'center';
                    controls.style.justifyContent = 'center';
                    controls.style.marginBottom = '10px';
                    controls.innerHTML = `
                        <button id="btn-decrease-page" style="margin-left:5px;">A-</button>
                        <button  id="btn-increase-page" style="margin-left:5px;">A+</button>
                    `;

                    // Insert the controls immediately after the found button.
                    insertBeforeTitlePageside.parentNode.prepend(controls, insertBeforeTitlePageside);

                }

                // Scale up event for Page Side.
                iframeDoc.getElementById('btn-increase-page').onclick = function() {adjustSectionFont(iframeDoc, '.page', 'up', '--page-font-modifier');}

                // Scale down event for Page Side.
                iframeDoc.getElementById('btn-decrease-page').onclick = () => adjustSectionFont(iframeDoc, '.page', 'down', '--page-font-modifier');
			} else {
				console.error("Could not find '.page' inside the iframe.");
			}
        });  
    }
});

// Start observing document.body updates for new iFrames.
observer.observe(document.body, { childList: true, subtree: true });


//------------------------------------------------------------------------------------------
// In this section:
// Drag logic for divider, this requires stopping the tree_panel_toggle_btn event from firing so
// the panel does not close when the mouse is released.
// Added new divider arrows.

function getSafeText(rawInput) {
    if (!rawInput) return "";

    // 1. Trim whitespace from both ends
    let clean = rawInput.trim();

    // 2. Remove potential HTML tags to prevent DOM XSS
    // This replaces anything like <script> or <img> with an empty string
    clean = clean.replace(/<[^>]*>?/gm, '');

    // 3. Limit the length (prevents "Buffer Overflow" style attacks or huge UI breaks).
    const maxLength = 1000;
    clean = clean.substring(0, maxLength);

    // 4. Escape HTML.
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return clean.replace(/[&<>"']/g, m => map[m]);
}

window.addEventListener('load', () => {

    // Set tree and page font sizes from URL if present.
    let userURLforFontSizes = new URLSearchParams(window.location.search); 
    // Setting the pageFontSize value needs to happen first before the treeFontSize value
    // so the value is not lost in URL rewrite in the adjustSectionFont function.
    if (userURLforFontSizes.get('pf')) { 
        pageFontSize = getSafeText(userURLforFontSizes.get('pf'));
    }
    if (userURLforFontSizes.get('tf')) {
        treeFontSize = getSafeText(userURLforFontSizes.get('tf'));
        adjustSectionFont(document, '.outermost', 'settreefontsize', '--tree-font-modifier', treeFontSize);
    }
    

    const leftPanel = document.querySelector('.tree-panel');
    const rightPanel = document.querySelector('.page-panel');
    const handle = document.getElementById('tree_panel_toggle_btn');

    if (!leftPanel || !rightPanel || !handle) return;

    let isResizing = false;
    let wasDragged = false;
    let startX, startLeftVw, startRightVw;
    let currentX = 0;
    let ticking = false; // Prevents over-calling rAF

    // New divider arrows injected for wider device compatibility.
    const leftArrowSvg =`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
        </svg>`;
    const rightArrowSvg = ` <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
        </svg>`;
    if (handle.innerHTML == '🡀') {
        handle.innerHTML = leftArrowSvg;
        Object.defineProperty(handle, 'innerHTML', {
            value: handle.innerHTML, // Lock current content
            writable: false,             // Prevent overwrites
            configurable: false          // Prevent other scripts from changing this setting
        });    
    }

    handle.addEventListener('pointerdown', (e) => { // Start pointer tracking.
        isResizing = true;
        wasDragged = false;
        startX = e.clientX;
        currentX = e.clientX;

        const vw = window.innerWidth / 100;
        startLeftVw = leftPanel.offsetWidth / vw;
        startRightVw = rightPanel.offsetWidth / vw;

        handle.setPointerCapture(e.pointerId);  
    });

    handle.addEventListener('pointermove', (e) => { // Continue pointer tracking on pointer move.
        if (!isResizing) return;
        
        currentX = e.clientX; // Just update the coordinate

        // Only request a frame if one isn't already pending
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateWidths();
                ticking = false;
            });
            ticking = true;
        }
    });

    function updateWidths() {
        const deltaPx = currentX - startX;
        if (Math.abs(deltaPx) > 5) wasDragged = true;

        if (wasDragged) {
            const vw = window.innerWidth / 100;
            const deltaVw = deltaPx / vw;
            
            // Updating styles in a single batch inside rAF
            leftPanel.style.flex = `${startLeftVw + deltaVw}vw`;
            rightPanel.style.flex = `${startRightVw - deltaVw}vw`;
        }
    }

    // Ensure the tree side does not close on drag.
    handle.addEventListener('click', (e) => {
        if (wasDragged) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    }, true);

    const stopResize = (e) => {
        isResizing = false;
        handle.releasePointerCapture(e.pointerId);
    };

    handle.addEventListener('pointerup', stopResize);  // Stop pointer tracking.
    handle.addEventListener('pointercancel', stopResize);
    
});

//------------------------------------------------------------------------------------------
// Search functionality implemented here for text and images.

const IMAGE_CACHE_FILE_PATH = './image-text-cache.json'; // File location for image text cache. Name changes need to be done in the download cache function argument.
const PAGE_STRUCTURE_CACHE_FILE_PATH = './page-structure-cache.json'; // File location for page text cache. Name changes need to be done in the download cache function argument.

window.addEventListener('load', () => {

    //// SECTION FOR EXTRACTING ALL FILE DATA FROM THE TREE SIDE.
    // Used to check if and object is null/undefined before accessing its properties.
    function isObjectEmpty(obj) {
        return obj && typeof obj === 'object' && Object.keys(obj).length === 0;
    }

    // Extract links data from the tree side on load for image and text search later.
    const linksData = Array.from(document.querySelectorAll('a[onclick]'))
    .map(a => {
        // Extract the filename using regex.
        const match_filename = a.getAttribute('onclick').match(/changeFrame\('(.*?)'\)/);
        const match_pageindex = a.getAttribute('onclick').match(/(\d+)\.html/);

        let dataFound = {};
 
        if (match_pageindex) {
            dataFound.pageindex = Number(match_pageindex[1]);  // The 'onclick' pageindex.
        }
        if (match_filename) {
            dataFound.filename = match_filename[1],   // The 'onclick' filename.
            dataFound.title = a.innerHTML    // The inner text/HTML.
        }
        
        // Return found index and filenames on match.
        if (!isObjectEmpty()) {
            return dataFound;
        }
        else {
            return null;
        }
        
    })
    .filter(Boolean); // Remove any nulls if the regex did not match.

    //// SECTION FOR INJECTING UI ELEMENTS.
    const allPageTreeElementsContainer = document.createElement("div");
    allPageTreeElementsContainer.classList.add('allPageTreeElementsContainer');

    const supportContainer = document.createElement("div");
    supportContainer.style.display = 'flex';
    supportContainer.style.alignItems = 'center';
    supportContainer.style.justifyContent = 'end';
    supportContainer.style.columnGap = '2px';
    supportContainer.style.fontSize = '10px';
    supportContainer.style.cursor = 'pointer';
    supportContainer.id = 'supportcontainer';
    supportContainer.innerHTML = 'Support';
    supportContainer.classList.add('onhover');
    supportContainer.classList.add('heart-icon');
    supportContainer.classList.add('no-select');

    const searchBoxContainer = document.createElement("div");
    searchBoxContainer.style.display = 'flex';
    searchBoxContainer.style.flexWrap = 'nowrap';
    searchBoxContainer.style.alignItems = 'center';
    searchBoxContainer.style.justifyContent = 'center';
    searchBoxContainer.id = 'searchboxcontainer';
    
    const searchbar = document.createElement('textarea');
    searchbar.style.position = 'relative';
    searchbar.style.display = 'inline-block';
    searchbar.style.marginLeft = '26px';
    searchbar.style.borderRadius = '30px';
    searchbar.style.width = '70%';
    searchbar.style.maxWidth = '300px';
    searchbar.style.minHeight = '20px';
    searchbar.style.maxHeight = '300px';
    searchbar.style.paddingLeft = '15px';
    searchbar.style.fontSize = 'clamp(0.6rem, 1vw + 0.6rem, 1rem)';
    searchbar.style.fieldSizing = 'content';
    searchbar.id = 'searchbox';

    const searchButton = document.createElement('span');
    searchButton.style.display = 'inline-block';
    searchButton.style.marginLeft = '5px';
    searchButton.id = 'searchButton';
    searchButton.classList.add('searchButton');

    const stopSearchButton = document.createElement('span');
    stopSearchButton.style.display = 'inline-block';
    stopSearchButton.style.marginLeft = '3px';
    stopSearchButton.style.display = 'none';
    stopSearchButton.classList.add('stopSearchButton');

    const searchSettingsButton = document.createElement('span');
    searchSettingsButton.style.display = 'inline-block';
    searchSettingsButton.style.paddingLeft = '20px';
    searchSettingsButton.classList.add('gear-icon');

    const searchStatusText = document.createElement('p');
    searchStatusText.style.color = 'white';
    searchStatusText.style.width = '50%';
    searchStatusText.style.margin = 'auto';
    searchStatusText.style.paddingTop = '10px';
    searchStatusText.innerHTML = 'Search Status';

    const imagesearchContainer = document.createElement("div");
    imagesearchContainer.style.display = 'flex';
    imagesearchContainer.style.flexWrap = 'wrap';
    imagesearchContainer.style.alignItems = 'center';
    imagesearchContainer.style.justifyContent = 'center';
    imagesearchContainer.style.marginTop = '10px';
    imagesearchContainer.style.marginLeft = '1vw';
    imagesearchContainer.style.rowGap = '10px';
    imagesearchContainer.style.columnGap = '5px';
    imagesearchContainer.classList.add('no-select');

    const searchimages_checkbox_div = document.createElement("div");

    const searchimages_checkbox = document.createElement('input');
    searchimages_checkbox.type = 'checkbox';
    searchimages_checkbox.checked = true;
    searchimages_checkbox.id = 'searchimages_checkbox';
    searchimages_checkbox.style.display = 'inline-block';
    searchimages_checkbox.style.cursor = 'pointer';

    const searchimages_checkbox_label = document.createElement('label');
    searchimages_checkbox_label.htmlFor = 'searchimages_checkbox';
    searchimages_checkbox_label.innerHTML = 'Search Image Text';
    searchimages_checkbox_label.style.display = 'inline-block';
    searchimages_checkbox_label.style.cursor = 'pointer';
    searchimages_checkbox_label.style.color = 'white';

    const searchall_pages_checkbox_div = document.createElement("div");

    const searchall_pages_checkbox = document.createElement('input');
    searchall_pages_checkbox.type = 'checkbox';
    searchall_pages_checkbox.checked = true;
    searchall_pages_checkbox.id = 'searchall_pages_checkbox';
    searchall_pages_checkbox.style.display = 'inline-block';
    searchall_pages_checkbox.style.cursor = 'pointer';

    const searchall_pages_label = document.createElement('label');
    searchall_pages_label.htmlFor = 'searchall_pages_checkbox';
    searchall_pages_label.innerHTML = 'Search All Pages';
    searchall_pages_label.style.display = 'inline-block';
    searchall_pages_label.style.cursor = 'pointer';
    searchall_pages_label.style.color = 'white';

    const navContainer = document.createElement("div");
    navContainer.className = "nav-container";
    navContainer.style.display = "none"; // flex

    const prevBtn = document.createElement("button");
    prevBtn.className = "nav-btn nav-prev";

    const navTextContainer = document.createElement("span");

    const goToInput = document.createElement("input");
    goToInput.type = "number";
    goToInput.id = "gotoinput";
    goToInput.style.textAlign = 'center';
    goToInput.style.borderRadius = '10px';

    const navText = document.createElement("span");
    navText.className = "nav-text";
    navText.innerText = " ";
    navText.classList.add('no-select');

    const nextBtn = document.createElement("button");
    nextBtn.className = "nav-btn nav-next";
    
    const downloadButtonContainer = document.createElement("div");
    downloadButtonContainer.style.flexBasis = '100%';
    downloadButtonContainer.style.textAlign = 'center';
    downloadButtonContainer.style.display = 'block';
    downloadButtonContainer.id = 'downloadbuttoncontainer';

    const statusLabelContainer = document.createElement("div");
    statusLabelContainer.style.flexBasis = '100%';
    statusLabelContainer.style.textAlign = 'center';
    statusLabelContainer.style.marginBottom = '10px';
    statusLabelContainer.style.visibility = 'hidden';
    statusLabelContainer.classList.add('no-select');

    const cacheDownloadButton = document.createElement('button');
    cacheDownloadButton.type = 'button';
    cacheDownloadButton.style.marginTop = '20px';
    cacheDownloadButton.textContent = 'Download Search Cache Files';
    cacheDownloadButton.style.maxWidth = 'fit-content';

    const showHintButton = document.createElement('p');
    showHintButton.style.marginTop = '20px';
    showHintButton.textContent = 'Learn More';
    showHintButton.style.maxWidth = 'fit-content';
    showHintButton.style.paddingTop = '10px';
    showHintButton.style.paddingBottom = '10px';
    showHintButton.style.color = 'white';
    showHintButton.style.width = '50%';
    showHintButton.style.margin = 'auto';
    showHintButton.style.cursor = 'pointer';
    showHintButton.id = 'showHintButton';
    showHintButton.classList.add('no-select');
    showHintButton.classList.add('onhover');

    const downloadHintText = document.createElement('p');
    downloadHintText.style.color = 'white';
    downloadHintText.style.width = '50%';
    downloadHintText.style.margin = 'auto';
    downloadHintText.style.paddingTop = '10px';
    downloadHintText.style.paddingBottom = '10px';
    downloadHintText.style.display = 'none';
    downloadHintText.style.cursor = 'pointer';
    downloadHintText.classList.add('no-select');
    downloadHintText.classList.add('onhover');
    downloadHintText.innerHTML = 'Place the cache files in the sites root folder to greatly improve search speed and eliminate the risk of throttling on hosted servers.';

    searchBoxContainer.appendChild(searchbar);
    searchBoxContainer.appendChild(searchButton);
    searchBoxContainer.appendChild(stopSearchButton);

    statusLabelContainer.appendChild(searchStatusText);

    searchimages_checkbox_div.appendChild(searchimages_checkbox);
    searchimages_checkbox_div.appendChild(searchimages_checkbox_label);
    imagesearchContainer.appendChild(searchimages_checkbox_div);

    searchall_pages_checkbox_div.appendChild(searchall_pages_checkbox);
    searchall_pages_checkbox_div.appendChild(searchall_pages_label);
    imagesearchContainer.appendChild(searchall_pages_checkbox_div);

    imagesearchContainer.appendChild(searchSettingsButton);

    navContainer.appendChild(prevBtn);
    navTextContainer.appendChild(goToInput);
    navTextContainer.appendChild(navText);
    navContainer.appendChild(navTextContainer);
    navContainer.appendChild(nextBtn);

    imagesearchContainer.appendChild(statusLabelContainer);

    downloadButtonContainer.appendChild(cacheDownloadButton);
    downloadButtonContainer.appendChild(showHintButton);
    downloadButtonContainer.appendChild(downloadHintText);
   
    // All new elements are inserted after "Index" header here.
    document.querySelector('.tree').prepend(supportContainer);

    const index_header = document.getElementById('index_header');
    if (index_header) {
        document.getElementById('index_header').after(allPageTreeElementsContainer);
    }
    else {
        document.querySelector(".tree").prepend(allPageTreeElementsContainer);
    }

    // Then everything else is injected to the main container.
    allPageTreeElementsContainer.appendChild(searchBoxContainer);
    searchBoxContainer.after(imagesearchContainer);
    imagesearchContainer.after(navContainer);
    allPageTreeElementsContainer.after(downloadButtonContainer);

    //// SECTION FOR UI INTERACTIONS.

    const searchbox = document.getElementById("searchbox"); // Reference to access search box later.

    function hideStatusLabel() {
        statusLabelContainer.style.visibility = 'hidden';
    }

    function updateStatusLabel(text) {
        statusLabelContainer.style.visibility = 'visible';
        searchStatusText.innerHTML = text;
    }

    function showCloseSearchButton() {
        searchButton.style.display = 'none';
        stopSearchButton.style.display = 'inline-block'; 
        downloadButtonContainer.style.display = 'none';
    }

    function showSearchButton() {
         setTimeout(() => { // Timeout to prevent simutanious clicks on search.
            stopSearchButton.style.display = 'none';
            searchButton.style.display = 'inline-block';
        }, 2000); 
    }

    function showNavigation() {
        navContainer.style.display = 'flex';
    }

    function hideNavigation() {
        navContainer.style.display = 'none';
    }

    function hideAllButtons() {
        searchButton.style.display = 'none';
        stopSearchButton.style.display = 'none';
        downloadButtonContainer.style.display = 'none';
        navContainer.style.display = 'none';
    }

    supportContainer.addEventListener("click", (event) => {
        supportContainer.style.flexDirection = 'column';
        supportContainer.style.alignItems = 'end';
        supportContainer.style.rowGap = '2px';
        supportContainer.innerHTML = `
        <a class="onhover link" href="https://github.com/coregtree/cherrytree-notes-web-interface" target="_blank">cherrytree Web Interface Github</a>
        <a class="onhover link" href="https://github.com/giuspen/cherrytree" target="_blank">cherrytree Notes Github</a>
        <a class="onhover link" href="https://ko-fi.com/coregtree" target="_blank">Support cherrytree Web Interface</a>
        <a class="onhover link" href="https://www.giuspen.net/cherrytree/" target="_blank">Support cherrytree Notes</a>
        `;
    });

    searchSettingsButton.addEventListener("click", async (event) => {
        event.preventDefault();   
        if (downloadButtonContainer.style.display == 'none') { 
            downloadButtonContainer.style.display = 'block';
            downloadButtonContainer.scrollIntoView({ // Scrolls download cache button into view when search settings button is clicked.
                behavior: 'smooth',
                block: 'center',    // This centers the range vertically.
                inline: 'nearest'   // This keeps it visible horizontally.
            });
        } 
        else {
            downloadButtonContainer.style.display = 'none';
        }  
    });

    showHintButton.addEventListener("click", (event) => {
        showHintButton.style.display = 'none';
        downloadHintText.style.display = 'block';
    });

    downloadHintText.addEventListener("click", (event) => {
        showHintButton.style.display = 'block';
        downloadHintText.style.display = 'none';
    });

    let currentSearchController = null; 
    
   // User clicked the download the image cache file button.
    cacheDownloadButton.addEventListener("click", (event) => {
        event.preventDefault();
        searchall_pages_checkbox.checked = true; // All pages need to be include in the cache generation.
        hideNavigation();
        updateStatusLabel('Starting search.');
        hideAllButtons();
        performSearch(true); // True means cache download requested.
    });

    // Used to highlight tree side titles when search starts instantly.
    const pageTreePanel = document.querySelector(".outermost");
    function updatePageTreeHighlights() {
        // Reset highlights.
        CSS.highlights.clear();

        const query = searchbox.value.trim().toLowerCase();
        if (!query) return;

        // Find all text nodes in the target area.
        const treeWalker = document.createTreeWalker(pageTreePanel, NodeFilter.SHOW_TEXT);
        const ranges = [];
        let currentNode;

        while (currentNode = treeWalker.nextNode()) {
            const text = currentNode.textContent.toLowerCase();
            let startPos = 0;

            // Find every occurrence of the query in this node.
            while ((startPos = text.indexOf(query, startPos)) !== -1) {
            const range = new Range();
            range.setStart(currentNode, startPos);
            range.setEnd(currentNode, startPos + query.length);
            ranges.push(range);
            startPos += query.length; // Move past current match.
            }
        }

        // Register the new set of ranges.
        if (ranges.length > 0) {
            const searchHighlight = new Highlight(...ranges);
            CSS.highlights.set("search-results", searchHighlight);
        }
    }

    searchButton.addEventListener("click", async (event) => {
        event.preventDefault();   
        hideNavigation();
        updatePageTreeHighlights();
        performSearch(false); // False means cache download not requested so this is a normal search.
    });

    searchbox.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        if (!event.shiftKey) { // Ignore Shift+Enter to allow blocks of text in the searchbox.
            event.preventDefault();   
            hideNavigation();
            updatePageTreeHighlights();
            performSearch(false);
        }
    }
    });

    stopSearchButton.addEventListener("click", async (event) => {
        event.preventDefault();   
        hideAllButtons();
        if (currentSearchController) { // Stops the current search using an abord signal to the currently active searches AbortController down below.
            currentSearchController.abort();
        }   
    });

    // Resets page to the default state.
    document.getElementById('btn-reset-all').addEventListener("click", async (event) => {
        event.preventDefault();  
        //Create a URL object based on the current location
        const url = new URL(window.location);

        // Clear ALL existing parameters.
        url.search = ""; 

        window.history.replaceState({}, '', url.pathname + url.search);
        window.location.reload();
    });

    function copyLink(text) {
        // Try the modern Clipboard API (Works on most mobile/desktop).
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                triggerCopyMessage();
            }).catch(err => {
                console.error('Clipboard API failed', err);
            });
        } 
        // Fallback for older browsers or non-secure contexts.
        else {
            let textArea = document.createElement("textarea");
            textArea.value = text;
            // Ensure the textarea is hidden but selectable
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                triggerCopyMessage();
            } catch (err) {
                alert('Unable to copy. Please copy URL manually.');
            }
            document.body.removeChild(textArea);
        }
    }

    function triggerCopyMessage() {
        const copyMessage = document.getElementById("copy-link-message");
        copyMessage.className = "show";
        // Hide after 2.5 seconds
        setTimeout(() => { 
            copyMessage.className = copyMessage.className.replace("show", ""); 
        }, 2500);
    }

    document.getElementById('copy-url-button').addEventListener("click", async (event) => {
        const currentUrl = window.location.href; 
        copyLink(currentUrl);
    });

    // Checks if cache files exist on the server by attempting to fetch the files to show or hide download cache button.
    // Also navigates to the page specified in the URL.
    async function hideDownloadCacheOnLoad() { 
        try {
            const pageFileResponse = await fetch(PAGE_STRUCTURE_CACHE_FILE_PATH);
            const imageFileResponse = await fetch(IMAGE_CACHE_FILE_PATH);
            if (pageFileResponse.ok && imageFileResponse.ok) { // Fetch success.
                console.log("Cache files found!");
                downloadButtonContainer.style.display = 'none';
                return true;
            }
            else { // No cache files exist.
                console.warn("Cache files not found!");
                return false;
            }
        } catch (e) { // Fetch error.
            console.log(e);
            console.warn("Cache file fetch error!");
            return false;
        }
    }

    //Navigate to a page specified in the clients URL.
    let userURLforPageNavigate = new URLSearchParams(window.location.search); 

    let urlPage = null;
    if (userURLforPageNavigate.get('page') && !userURLforPageNavigate.get('t') && !userURLforPageNavigate.get('q') ) {
        urlPage = userURLforPageNavigate.get('page');
        urlPage = parseInt(urlPage, 10);

        if (!isNaN(urlPage)) {
            // Targets the element corrent page tree panel element based on the client URL.
            const pageToVisit = Array.from(listItems).find(link => {
                const candidatePageIndex = getNodePageIndexNumber(link);  
                // If the page numbers match the correct page has been found.
                return candidatePageIndex && candidatePageIndex == urlPage;
            });
            pageToVisit.click();
            urlPage = null;
        }
    }

    
    

    // Hide download cache buttons onload if cache exists and then navigate to URL query if specified.
    let urlPageToken = null;
    let searchURLSuccess = null;

    hideDownloadCacheOnLoad().then(cacheExists => { 
        // Navigate to the URL search parameters if specified by the user.
        try {
            if (cacheExists && window.location.search !== '') { 
               
                let userURLforQuery = new URLSearchParams(window.location.search); 
                if (userURLforQuery.get('t') && userURLforQuery.get('q') && userURLforQuery.get('page')) {
                    
                    urlAllPages = userURLforQuery.get('all');
                    urlAllPages = parseInt(urlAllPages, 10);

                    urlPageToken = userURLforQuery.get('t');
                    urlPageToken = parseInt(urlPageToken, 10);

                    if (urlAllPages === 1) {
                        searchall_pages_checkbox.checked = true;
                    }
                    else {
                        let urlPageNumber = userURLforQuery.get('page');
                        urlPageNumber = parseInt(urlPageNumber, 10);
                        let targetPage = Array.from(listItems).find(link => {
                            const targetPageIndex = getNodePageIndexNumber(link);           
                            // If the page numbers match the correct page has been found.
                            return targetPageIndex && targetPageIndex == urlPageNumber;
                        });
                        targetPage.click();
                        searchall_pages_checkbox.checked = false;
                    }

                    urlQuery = normalizeSearchText(getSafeText(userURLforQuery.get('q')));
                    
                    if (!isNaN(urlPageToken)) {
                        searchbox.value = urlQuery;
                        searchURLSuccess = performSearch(false);
                    }
                }
            }
        } catch (e) {
            console.log(e);
            console.warn("URL Navigation error.");
            return false;
        }
    }); 

    //// SECTION FOR TOKENIZATION AND CLEANUP OF REGULAR TEXT (Not used directly on DOM elements...)

    // Used on strings to provide a consistent result between user search queries and tree titles or image extracted text.
    // Also, used in text normalization in DOM section before tokenizing it.
    function normalizeSearchText(text) {
        return text
        // Convert everything to lowercase so search is case-insensitive
        // Example: "Windows" → "windows"
        .toLowerCase()
        .replace(/[\/\\|]+/g, " ")
        .replace(/[_\-–—]+/g, " ")
        .replace(/[^\p{L}\p{N}#+.]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

        ```
        About Section:
        // Replace common separators like / \ | with spaces
        // Prevents words from being glued together
        // Example: "upgrading/installing" → "upgrading installing"
        .replace(/[\/\\|]+/g, " ")

        // Replace dashes and underscores with spaces
        // Handles cases like "real-time_system" → "real time system"
        .replace(/[_\-–—]+/g, " ")

        // Replace ANY sequence of characters that are NOT:
        // - letters (\p{L})
        // - numbers (\p{N})
        // - or useful symbols (+ . #)
        // with a space
        //
        // This prevents words from merging while still keeping:
        // "C++", "Node.js", "C#"
        //
        // Example:
        // "hello!!!world" → "hello world"
        // "node.js & express" → "node.js express"
        .replace(/[^\p{L}\p{N}#+.]+/gu, " ")

        // Collapse multiple spaces into a single space
        // Example: "hello    world" → "hello world"
        .replace(/\s+/g, " ")

        // Remove leading and trailing spaces
        // Example: "  hello world  " → "hello world"
        .trim();
        ```

    }

    // Used to tokenize strings of text so searching can behave the same across DOM token search and title and image text.
    function tokenizeMixedContent(input) {
        const tokens = [];

        // Matches either:
        // 1. an <img ... src="..."> tag.
        // 2. or any chunk of text outside tags.
        const regex = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>|([^<]+)/gi;

        let match;

        while ((match = regex.exec(input)) !== null) {
            const imgSrc = match[1];
            const textChunk = match[2];

            // If this match was an image, keep its src in order.
            if (imgSrc) {
                tokens.push(imgSrc);
                continue;
            }

            // If this match was plain text, split it into searchable tokens.
            if (textChunk) {
            const textTokens = textChunk
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim()
                // keep words like "obj." and numbers like "1.2"
                .match(/[a-z0-9]+(?:\.[a-z0-9]+)*\.?/gi);

            if (textTokens) {
                tokens.push(...textTokens);
            }
            }
        }

        return tokens;
    }

    //// SECTION FOR TOKEN SEARCHING THE REGULAR TOKENS AND TEXT
    function tokenizeQuery(query) {
        return normalizeSearchText(query)
            .split(" ")
            .filter(Boolean);
    }

    function tokenMatchesAt(tokens, queryTokens, startIndex) {
        if (queryTokens.length === 0) return false;
        if (startIndex + queryTokens.length > tokens.length) return false;

        for (let i = 0; i < queryTokens.length; i++) {
            if (!tokens[startIndex + i].startsWith(queryTokens[i])) {
            return false;
            }
        }

        return true;
    }

    function filterTextTokensByQuery(titleTokens, query) {
        const queryTokens = tokenizeQuery(query);
        const results = [];

        if (!Array.isArray(titleTokens) || titleTokens.length === 0) return results;
        if (queryTokens.length === 0) return results;

        for (let i = 0; i <= titleTokens.length - queryTokens.length; i++) {
            let matched = true;

            for (let j = 0; j < queryTokens.length; j++) {
                if (!titleTokens[i + j].startsWith(queryTokens[j])) {
                    matched = false;
                    break;
                }
            }

            if (matched) {
                results.push(...titleTokens.slice(i, i + queryTokens.length));
            }
        }

        return results;
    }

    //// TOKEN BUILDING FOR DOM (This is for page side/iFrame tokenezation for search).

    // Used to ignore hidden dom elements so they are not included in search.
    function isVisibleElement(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden";
    }

    // Used to retrieve the start and end postion of a token.
    function tokenizeTextWithPositions(text) {
        const tokens = [];
        const regex = /[a-z0-9]+(?:\.[a-z0-9]+)*\.?/gi;
        let match;

        while ((match = regex.exec(text)) !== null) {
            tokens.push({
            value: match[0].toLowerCase(),
            start: match.index,
            end: match.index + match[0].length
            });
        }

        return tokens;
    }
    
    // Used to build a path from the root of the document (in this case an iFrame) to the specified node/element.
    // The main value needed for locating live elements in the iFrame and highlighting them.
    function getNodePath(root, node) { // Build a path from the element to the root.
        const path = [];
        let current = node;

        while (current && current !== root) {
            const parent = current.parentNode;
            if (!parent) return null;

            const index = Array.prototype.indexOf.call(parent.childNodes, current);
            if (index < 0) return null;

            path.push(index);
            current = parent;
        }

        if (current !== root) return null;

        path.reverse();
        return path;
    }

    // The main tokenezation function for a specified document.
    // Used to build the cache of all the HTML pages and then to search page tokens.
    function buildDomTokenIndex(root) {
        const tokens = [];

        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
            {
            acceptNode(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                const parent = node.parentElement;
                if (!parent || !isVisibleElement(parent)) {
                    return NodeFilter.FILTER_REJECT;
                }

                if (["SCRIPT", "STYLE", "NOSCRIPT", "TITLE"].includes(parent.tagName)) {
                    return NodeFilter.FILTER_REJECT;
                }

                if (!node.nodeValue || !node.nodeValue.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
                }

                if (node.nodeType === Node.ELEMENT_NODE) {
                if (!isVisibleElement(node)) {
                    return NodeFilter.FILTER_REJECT;
                }

                if (node.tagName === "IMG") {
                    return NodeFilter.FILTER_ACCEPT;
                }

                return NodeFilter.FILTER_SKIP;
                }

                return NodeFilter.FILTER_SKIP;
            }
            }
        );

        let node;
        while ((node = walker.nextNode())) {
            if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue;
            const textTokens = tokenizeTextWithPositions(text);
            const pathToNode =  getNodePath(root, node);

            for (const t of textTokens) {
                tokens.push({
                type: "text",
                value: t.value,
                node, // The node reference does not survive caching so a live one is rebuilt later and the path value is used to locate it.
                s: t.start, //startOffset
                e: t.end, // endOffset
                path: pathToNode // Path to element from root.
                });
            }
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "IMG") {
            const pathToNode =  getNodePath(root, node);
            const src = node.getAttribute("src") || "";
            tokens.push({
                type: "image",
                value: src,
                element: node, // The node reference does not survive caching so a live one is rebuilt later and the path value is used to locate it.
                path: pathToNode // Path to element from root.
            });
            }
        }

        return tokens;
    }


    //// SECTION FOR TOKENIZING DOM ELEMENTS TO BULD PAGE STRUCTURE CACHE from iFrames

    // Saves the specified data as JSON in a file.
    function downloadCacheFile(data, filename) {

        // This puts each object on one line, but the array elements on separate lines leading to a large filesize. User for debugging.
        // const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' }); // Make it one block of text for greatly reduced file size.
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        console.log("Download complete. Upload cache file to your server root.");
    }

    // Used to tokenize all HTML elements to build the page structure of each HTML file located in the tree (from index.html).
    async function retrievePageStructure(linksData, cacheDownloadRequested, includeAllPagesInSearch, signal) {

        if (linksData.length == 0) { return {}; }

        if (!cacheDownloadRequested) { // If a cache file exists for the page structure it is fetched and the function returns here.
            try {
                const response = await fetch(PAGE_STRUCTURE_CACHE_FILE_PATH);
                if (response.ok) {  
                    if (includeAllPagesInSearch) { // Return all pages in cache response.
                        updateStatusLabel('Page structure cache found!');
                        console.log("Page structure cache found at site root.");    
                        return await response.json(); 
                    }
                    else {
                        let data = await response.json();
                        let filteredData = {
                            pagestructure: data.pagestructure.filter(item => item.pageindex === linksData[0].pageindex),
                            imagesearchurls: data.imagesearchurls // Image urls are left as is and will be filtered in the image ocr function.
                        };
                        return filteredData; 
                    }
                }
                else {
                    console.warn("No page structure cache found at site root or an error occured.");
                }
            } catch (e) {
                console.warn("No page structure cache found at site root or an error occured. ");
            }
        }
        
        // No cache file found. Continue building the page structures.

        updateStatusLabel('Page text search in progress.');

        const results = {pagestructure: [], imagesearchurls: [] };

        const allImageSrcs = []; // Used to create a record of every image which is later used by the OCR image search function (ocrWithServerCache).

        let i = 1;
        let dataSize = linksData.length;
        for (const item of linksData) { // Loop for each page to tokenize.

            if (signal?.aborted) { // Abort signals stop search execution at any point by signaling the AbortController initialized in performSearch.
                updateStatusLabel('Search ended early.');
                return null;
            }

            if (i % 10 === 0) { // Updates search status text in increments of 10.
                 updateStatusLabel(`Searching page ${i} of ${dataSize}.`);
            }
            
            const fileName = item.filename;

            try {
                const response = await fetch(fileName);
                const htmlText = await response.text();

                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, "text/html");

                const regex = /<img[^>]+src=["']([^"']+)["']/g;
                let match;
                while ((match = regex.exec(htmlText)) !== null) {
                    allImageSrcs.push(match[1]); // Record all images for OCR image search function (ocrWithServerCache).
                }
  
                // THESE BUTTONS ARE INSERTED HERE FOR PAGES BECAUSE THE PAGE STRUCTURE HAS TO REMAIN THE SAME FOR SEARCH TO WORK.
                // WE MODIFIED THE iFRAMES BY INSERTING HTML ELEMENTS SO ALL PAGE SIDE .HTML FILE MODIFICATIONS NEED TO BE SIMULATED HERE.
                // Font size button code is injected. 
                const container = doc.querySelector('.page');
                const insertBeforeTitlePageside = container.querySelector('.title');

                if (insertBeforeTitlePageside) { // Exact code we used previously to update the live iFrame with increase font size buttons.
                    const controls = document.createElement('span');
                    controls.style.display = 'flex';
                    controls.style.alignItems = 'center';
                    controls.style.justifyContent = 'center';
                    controls.style.marginBottom = '10px';
                    controls.innerHTML = `
                        <button id="btn-decrease-page" style="margin-left:5px;">A-</button>
                        <button  id="btn-increase-page" style="margin-left:5px;">A+</button>
                    `;
                    insertBeforeTitlePageside.parentNode.prepend(controls, insertBeforeTitlePageside);
                }


                item.tokenizedTextWithImages = buildDomTokenIndex(doc.body); // TOKENIZE IFRAME CALL.

                results.pagestructure.push(item);

            } catch (err) {
                console.error(`Could not read ${fileName}:`, err);
            }

            i++;
        }

        results.imagesearchurls = allImageSrcs; // All Images found are appended for OCR image search later.

        // Sort page structure by page order.
        results.pagestructure.sort((a, b) => {
            // Sort by pageindex first
            const pageindexCompare = a.pageindex - b.pageindex;
            
            if (pageindexCompare !== 0) {
                return pageindexCompare;
            }

        });

        if (cacheDownloadRequested) { downloadCacheFile(results, 'page-structure-cache.json'); }

        return results;
    }

    //// SECTION FOR EXTRACTING AND TOKENIZING IMAGE TEXT TO BUILD IMAGE TEXT CACHE.

    // Used by the OCR image function to get the right number of workers for the users hardware.
    function getRecommendedWorkerCount(lengthOfURLs) { 
        const cores = navigator.hardwareConcurrency || 2;

        let recommended = 0;
        if (cores <= 2) {recommended = 1;}   // low-end CPU
        else if (cores <= 4) { recommended = 2; }  // low-end to mid-range CPU
        else if (cores <= 8) { recommended = 3; }   // mid-range CPU
        else { // High end CPU.
            recommended = Math.floor(navigator.hardwareConcurrency  * 0.55);
        }

        if (recommended > lengthOfURLs) { // If there are not enough images we do not need too many workers.
            recommended = lengthOfURLs;
        }
      
        return recommended;
    }

    // Load Tesseract OCR.
    const tesseractScript = document.createElement('script');
    // Set the version to used and load the minified distribution.
    // Currently using and tested with version 7.
    tesseractScript.src = "https://cdn.jsdelivr.net/npm/tesseract.js@7/dist/tesseract.min.js";
    tesseractScript.onload = async () => {
        console.log("Tesseract.js loaded");
    }
    document.head.appendChild(tesseractScript);

    // Used to search and tokenize all the images that exist across all HTML files.
    async function ocrWithServerCache(imageUrls, linksData, cacheDownloadRequested, includeAllPagesInSearch, signal) { 

        if (imageUrls.length == 0) { return {}; }

        if (!cacheDownloadRequested) { // If a cache file exists for the image text it is fetched and the function returns here.
            try {
                const response = await fetch(IMAGE_CACHE_FILE_PATH);
                if (response.ok) {
                    if (includeAllPagesInSearch) {
                        console.log("Image cache found!");
                        updateStatusLabel('Image cache found!');
                        return await response.json(); 
                    }
                    else {
                        let data = await response.json();  
                        const targetPageNumber = linksData.pagestructure[0].pageindex;
                        let targetData = {};
                        targetData[targetPageNumber] = data[targetPageNumber];
                        return targetData; 
                    }
                }
                else {
                    updateStatusLabel('No image cache file found at site root. Starting image text scan...');
                    console.warn("No image cache file found at site root. Starting image text scan...");
                }
            } catch (e) {
                updateStatusLabel('No image cache file found at site root. Starting image text scan...');
                console.warn("No image cache file found at site root. Starting image text scan...");
            }
        }

        // Initialize Scheduler and Workers (v7 style).
        const scheduler = Tesseract.createScheduler();
        let workerCount = getRecommendedWorkerCount(imageUrls.length); // Decides how many CPU threads to use for the scan based on the device.
        
        try {
        
            for (let i = 0; i < workerCount; i++) {  // Loop to initialize the workers so they are ready to use.
                
                if (signal.aborted) { // Stop worker creating if the user cancelled search.
                    updateStatusLabel('Scan ended early.');
                    throw new Error('AbortError');
                }

                updateStatusLabel(`Image scan in progress starting worker: ${i+1} of ${workerCount}`);
                
                // There are many different ways tesseract can extract image text and the number represents the setting being used.
                // Setting 3 handles the widest range of images but you can set this setting based on the images being supplied.
                // const worker = await Tesseract.createWorker('eng', 1);
                const worker = await Tesseract.createWorker('eng', 3);
                await worker.setParameters({
                    tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT, // This tells tesseract the text can be scattered across the image and is not a single block of text.
                    preserve_interword_spaces: '0', // This specifies wheter tesseract should try to guess the spacing between text but it is not needed as we are normalizing all the text anyways.
                    user_defined_dpi: '300' // This prevents tesseract from guessing the dpi when using sparse text. As of tesseract 7 it is better to specify a static 300 dpi instead of letting it guess.
                });
                scheduler.addWorker(worker);
            }

            let scannedImages = 0;
            // Process image text results as each of them arrives from a worker by tokenizing the text and storing data for each image.
            let results = await Promise.all(imageUrls.map(async (url) => {

                // If aborted, this specific 'map' instance stops before calling addJob.
                if (signal?.aborted) { 
                    updateStatusLabel('Search ended early.');
                    throw new Error('AbortError');
                }; 

                const result = await scheduler.addJob('recognize', url);

                // If aborted while the job was running, discard the result.
                if (signal?.aborted) {
                    updateStatusLabel('Search ended early.');
                    throw new Error('AbortError');
                };

                scannedImages++;

                const str = url;
                // Extract pageindex from url.
                const pageindex_regex = /\/(\d+)-/;
                const pageindex_match = str.match(pageindex_regex);

                // Extract the images position based on other images on the page.
                const imageorder_regex = /-([\d.]+)\./;
                const imageorder_match = str.match(imageorder_regex);

                updateStatusLabel(`Images scanned: ${scannedImages} of ${imageUrls.length}`);

                const normalizedPageText = normalizeSearchText(result.data.text); // Normalize extracted image text.
                return {
                    pageindex: Number(pageindex_match[1]),
                    imageorderindex: Number(imageorder_match[1]),
                    type: 'imagetext', // Label the type of data. Used when highlighting results.
                    url: url,           // Store the image filename.
                    text: normalizedPageText, // Store the OCR result for personal reference.      
                    tokenizedText: tokenizeMixedContent(normalizedPageText) // The tokenized and normalized version is what is actually used for search.
                };

            }));

            // Sort images by page order and then image order.
            results.sort((a, b) => {
                // Sort by pageindex first
                const pageindexCompare = a.pageindex - b.pageindex;
                
                if (pageindexCompare !== 0) {
                    return pageindexCompare;
                }

                // If pageindex is the same, sort by imageorderindex
                return a.imageorderindex - b.imageorderindex;
            });

            // Convert the entire image array into a grouped object based on the page it was a part of.
            // Each image was processed individually so it is now grouped back into the page it was on.
            const groupedResults = results.reduce((acc, item) => {
                // Use the internal value you want as the key (e.g., item.id or item.type).
                const key = item.pageindex; 

                // Initialize the array for this key if it does not exist.
                if (!acc[key]) {
                    acc[key] = [];
                }

                // Add the item to its corresponding array.
                acc[key].push(item);
                return acc;
            }, {});

            // Download the structured JSON cache file if this is a cache download request.
            if (cacheDownloadRequested) { downloadCacheFile(groupedResults, 'image-text-cache.json'); }

            return groupedResults;
        }
        catch (error) {
            await scheduler.terminate();
            return null;
        }
        finally {
            await scheduler.terminate();
        }

    }

    //// SECTION FOR SEARCHING AND FILTERING TOKENIZED DOM ELEMENT TOKENS

    function isImageTokenObj(token) {
        return token.type === "image";
    }

    function tokenizeQuery(query) { // Used to ensure user query is normalized before using it for token filtering.
        return normalizeSearchText(query).split(" ").filter(Boolean);
    }

    function tokenMatchesAt(tokenObjs, queryTokens, startIndex) {

        if (queryTokens.length === 0) return false;

        // If there are not enough tokens left in tokenObjs to match the full query sequence,
        // then a match is impossible starting at this index.
        if (startIndex + queryTokens.length > tokenObjs.length) return false;

        //  Loop through each query token and compare it with the corresponding token in tokenObjs.
        for (let i = 0; i < queryTokens.length; i++) {
            const tokenObj = tokenObjs[startIndex + i];

            // Only text tokens are allowed to match query tokens.
            // If we hit a non-text token (like an image), this is not a valid match.
            if (tokenObj.type !== "text") {
                return false;
            }

            // Check if the token value starts with the query token.
            // This enforces prefix matching (e.g., "win" matches "windows").
            if (!tokenObj.value.startsWith(queryTokens[i])) {
                return false;
            }
        }

        // If all query tokens matched in order, return true.
        return true;
    }

    // This is the main search/filtering function that is used to filter out all the tokens
    // from a specified tokenized element DOM by the specified query. The image tokens remain
    // and they are filtered out later.
    function filterQueryMatchObjects(tokenObjs, query) {
        const queryTokens = tokenizeQuery(query);
        const results = [];

        if (queryTokens.length === 0) return results;

        for (let i = 0; i < tokenObjs.length; i++) {

            // Check if a full query match starts at this position.
            // If not, skip to the next index.
            if (!tokenMatchesAt(tokenObjs, queryTokens, i)) continue;

            // Temporary array to hold:
            // - the matched text tokens
            // - any images that follow this match
            const matchGroup = [];

            // Add the matched text tokens (the query sequence) to the group.
            matchGroup.push(...tokenObjs.slice(i, i + queryTokens.length));

            // Start scanning forward after the matched text sequence.
            let j = i + queryTokens.length;
            // Continue until:
            // - we reach the end of tokens, OR
            // - another match starts (to avoid overlapping groups)
            while (j < tokenObjs.length && !tokenMatchesAt(tokenObjs, queryTokens, j)) {
                // If the token is an image, include it in the match group.
                if (isImageTokenObj(tokenObjs[j])) {
                    matchGroup.push(tokenObjs[j]);
                }
                j++;
            }

            // Add this match group (flattened) into the results.
            results.push(...matchGroup);

            // Move the outer loop index forward to skip over this processed region.
            // This prevents re-processing the same tokens again.
            i = j - 1;
        }

        // Return the final flattened list of matched tokens and images.
        return results;
    }

    //// SECTION FOR COMBINING THE PAGE TEXT RESULT ARRAY AND IMAGE SEARCH RESULT ARRAY INTO ONE.

    // Used when there are no image results and the page text results need to be converted into the proper array structure.
    function removeImageTokensInPlace(pageItemsArray) {
        for (const entry of pageItemsArray) {
            if (entry.type !== "pagetext") continue;
            if (!Array.isArray(entry.tokenizedOrder)) continue;

            entry.tokenizedOrder = entry.tokenizedOrder.filter(token => {
                return !(token?.type === "image" && token.value?.includes("images/"));
            });
        }

        return pageItemsArray;
    }

    // Combines both the page item results array and the image result arrays for easier iteration when displaying results.
    // This is where the filtering of image tokens happens and all tokens that do not appear in the image results array are
    // removed from the pageItemsArray tokenizedOrder. If no page item entry exists for an image result then a new page item
    // entry is created with only the image tokens existing in the tokenizedOrder token list of that new page entry.
    function combinePageData(pageItemsArray, imageItemsArray) {

        if (imageItemsArray.length === 0) { // No image results. Convert the page text results array into the proper structure.
            return removeImageTokensInPlace(pageItemsArray);
        }

        // Group imageItemsArray urls by pageindex.
        const imageUrlsByPage = new Map();
        for (const item of imageItemsArray) {
            if (!imageUrlsByPage.has(item.pageindex)) {
                imageUrlsByPage.set(item.pageindex, []);
            }
            imageUrlsByPage.get(item.pageindex).push(item.url);
        }

        // Clean every existing pagetext entry in pageItemsArray.
        for (const entry of pageItemsArray) {
            if (entry.type !== "pagetext") continue;

            const urlsForPage = imageUrlsByPage.get(entry.pageindex) || [];
            const validUrlSet = new Set(urlsForPage);

            if (!Array.isArray(entry.tokenizedOrder)) {
                entry.tokenizedOrder = [];
                continue;
            }

            // Remove all image tokens not present in imageItemsArray for this page.
            // If pageindex does not exist in imageItemsArray, validUrlSet is empty,
            // so all image tokens are removed.
            entry.tokenizedOrder = entry.tokenizedOrder.filter(token => {
                if (token?.type !== "image") return true;
                return validUrlSet.has(token.value);
            });

            // Append any missing image urls from imageItemsArray.
            const currentImageSet = new Set(
            entry.tokenizedOrder
                .filter(token => token?.type === "image" && typeof token.value === "string")
                .map(token => token.value)
            );

            for (const url of urlsForPage) {
                if (!currentImageSet.has(url)) {
                    entry.tokenizedOrder.push({
                    type: "image",
                    value: url,
                    element: {}
                    });
                }
            }
        }

        // Create pagetext entries for pageindexes that exist only in imageItemsArray.
        for (const [pageindex, urls] of imageUrlsByPage.entries()) {
            const existingPagetext = pageItemsArray.find(
                entry => entry.pageindex === pageindex && entry.type === "pagetext"
            );

            if (existingPagetext) continue;

            pageItemsArray.push({
                pageindex,
                filename: "",
                title: "",
                tokenizedTextWithImages: [],
                type: "pagetext",
                tokenizedOrder: urls.map(url => ({
                    type: "image",
                    value: url,
                    element: {}
                }))
            });
        }

        return pageItemsArray;
    }


    //// MAIN SECTION THAT USES ALL OF THE ABOVE FUNCTIONS TO PERFORM THE SEARCH, FILTER RESULTS, CACHE RESULTS AND TO DISPLAY RESULTS.
    async function performSearch(cacheDownloadRequested) {
            
        let includeImagesInSearch = false;
        if (searchimages_checkbox.checked == true) { // Checks wheter user wants to search images.
            includeImagesInSearch = true;
        }

        // Retrieves the page number from a pages filename value.
        function getPageNumberFromFilename(value) {
            const match = value.match(/(\d+)\.html/);
            // Use ?. to safely access index 1, or default to null if match is null
            const n = Number(match?.[1]); 
            return Number.isNaN(n) ? null : n;
        }

        let includeAllPagesInSearch = false;
        let selectedPage = null;
        if (searchall_pages_checkbox.checked == true) { // Checks wheter user wants to search all pages.
            includeAllPagesInSearch = true;
        }
        else { // Searching a single page so we ensure a page is selected in the iFrame.    
            let iFrameSrc = document.getElementById('page_frame').src;
            if (iFrameSrc) {
                selectedPage = getPageNumberFromFilename(iFrameSrc);
                if (!selectedPage) {
                    updateStatusLabel('No Page Selected.');
                    return null;
                }
            }
            
        }

        const searchValue = normalizeSearchText(searchbox.value);
        if (!searchValue && cacheDownloadRequested != true) { // Checks wheter this is a cache download request.
            return null;
        } 

        showCloseSearchButton();

        // Ensures any previous searches are stopped before starting a new search.
        if (currentSearchController) {
            currentSearchController.abort(); 
            console.log('Signal sent to stop previous OCR.');
            updateStatusLabel('Search ended early.');
            return null;
        }

        // Handles abort signals across.
        currentSearchController = new AbortController();
        const { signal } = currentSearchController;

        try {

            let ocrTextForAllImages = {}, allPageStructures = {};

            // Search all provided site pages and retrieve their sturcture in tokenized form.
            if (includeAllPagesInSearch) {
                allPageStructures = await retrievePageStructure(linksData, cacheDownloadRequested, includeAllPagesInSearch, signal);
            }
            else { // Limit seach to current page.
                // Locate the link for the current page.
                let targetPageEntry = linksData.find(u => u.pageindex === selectedPage); // Return the link for a single page.
                // Wrap the single entry in a new array.
                targetPageEntry = [targetPageEntry]; 
                allPageStructures = await retrievePageStructure(targetPageEntry, cacheDownloadRequested, includeAllPagesInSearch, signal);
            }
            
            updateStatusLabel('Page text search completed.');

            if (signal.aborted) {
                updateStatusLabel('Search ended early.');
                throw new Error('AbortError');
            }; 

            if (includeImagesInSearch) { // Search all site images for text and retrieve results in tokenized form.
                ocrTextForAllImages = await ocrWithServerCache(allPageStructures.imagesearchurls, allPageStructures, cacheDownloadRequested, includeAllPagesInSearch, signal);
                updateStatusLabel('Page text and image search completed.');
            }
            
            if (cacheDownloadRequested) { // Stop search here if the user requested a cache download.
                updateStatusLabel('Done. Upload the cache files to your sites folder.'); 
                return null;
            }

            let queryMatchedItems = [], queryMatchedImages = [];

            // Filter page structures by query and store results in queryMatchedItems.
            for (let i = 0; i < allPageStructures.pagestructure.length; i++) { 

                const originalItem = await allPageStructures.pagestructure[i];
                const tokenizedNormalizedTitle = tokenizeMixedContent(normalizeSearchText(originalItem.title));

                // Filters titles by user query using the regular text token filter function.
                // If a title matches it is stored as its own result entry with the type 'pagetitle'.
                if (filterTextTokensByQuery(tokenizedNormalizedTitle, searchValue).length > 0) { 
                    const titleMatch = { ...originalItem, type: 'pagetitle' };
                    queryMatchedItems.push(titleMatch);
                };

                // Filters the DOM tokenized page elements by user query using the DOM element specific token filter function.
                // The entire HTML pages tokens are filtered by the user query and stored inside tokenizedOrder.
                // This entry receives the 'pagetext' type.
                // The image tokens present on the page are all untouched here and are filtered in the upcoming code. 
                const orderedSearchResults = filterQueryMatchObjects(originalItem.tokenizedTextWithImages, searchValue);
                if (orderedSearchResults.length > 0) {
                    const textMatch = { 
                        ...originalItem, 
                        type: 'pagetext', 
                        tokenizedOrder: orderedSearchResults 
                    };
                    queryMatchedItems.push(textMatch);
                }
            }

            if (includeImagesInSearch) {
                // The text of each image from the site is checked against the user query using the regular text token filter function and then
                // the images containing the query are stored in queryMatchedImages as the type 'pageimage'.
                for (const [key, pageImages] of Object.entries(ocrTextForAllImages)) { // Retrieve 
                    if (pageImages && pageImages.length) { // In cases where there is only text and single page search occurs this will be undefined.
                        for (let i = 0; i < pageImages.length; i++) {
                            if (filterTextTokensByQuery(pageImages[i].tokenizedText, searchValue).length > 0) {
                                queryMatchedImages.push(ocrTextForAllImages[key][i]);
                            }
                        }
                    }
                }
            }
            
            // Both queryMatchedItems and queryMatchedImages are combined into a single array.
            // Before this function a 'pagetext' entries tokenizedOrder contains every image on the page. However, this function filters
            // tokenizedOrder image tokens according to the entries that exist in queryMatchedImages.
            let combinedResults = combinePageData(queryMatchedItems, queryMatchedImages);

            // If a 'pagetext' entry did not exist for a page image entry in the previous combinePageData step a new 'pagetext' entry was created for it
            // but the filename and title for that entry were left empty. 
            // Here the filename and title details are filled in for those entries.       
            for (let i = 0; i < combinedResults.length; i++) {
                if (combinedResults[i].filename == '') {
                    const findPage = allPageStructures.pagestructure.find(item => item.pageindex === combinedResults[i].pageindex);
                    combinedResults[i].filename = findPage.filename;
                    combinedResults[i].title = findPage.title;
                }
            }

            // Used to sorts the results array according to the page tree order seen live in the index.html page tree.
            function sortByPageIndex(arr, nodeList) {
                const orderMap = new Map();

                Array.from(nodeList).forEach((node, index) => {
                    const pageindex = getNodePageIndexNumber(node);
                    if (pageindex !== null) {
                    orderMap.set(pageindex, index);
                    }
                });

                return arr.sort((a, b) => {
                    const aIndex = orderMap.get(Number(a.pageindex)) ?? Infinity;
                    const bIndex = orderMap.get(Number(b.pageindex)) ?? Infinity;
                    return aIndex - bIndex;
                });
            }
    
            sortByPageIndex(combinedResults, listItems); 

            //// SECTION FOR FUNCTION THAT HIGHLIGHTING TOKENS ON THE LIVE iFRAME PAGE

            // <mark></mark> elements are used to highlight tokens and this function is used to remove all
            // mark instances in specified document/iFrame.
            function clearHighlights(doc) {
                const marks = doc.querySelectorAll('mark[data-search-highlight="1"]');

                for (const mark of marks) {
                    const parent = mark.parentNode;
                    if (!parent) {continue;}

                    while (mark.firstChild) {
                        parent.insertBefore(mark.firstChild, mark);
                    }

                    parent.removeChild(mark);
                    parent.normalize();
                }

                const imgs = doc.querySelectorAll("img[data-search-image-highlight='1']");
                for (const img of imgs) {
                    img.classList.remove('highlighted-image');
                    delete img.dataset.searchImageHighlight;
                }
            }

            // The .path attribute shows where an element is located in a document
            // from itself to the document root. This function is used to compare the
            // path from our cached token and our live token from the live page token build.
            function samePath(a, b) {
                if (!Array.isArray(a) || !Array.isArray(b)) return false;
                if (a.length !== b.length) return false;

                for (let i = 0; i < a.length; i++) {
                    if (a[i] !== b[i]) return false;
                }

                return true;
            }

            // Because we cannot use the cached version of pages to highlight live iFrames directly we
            // locate the live token based on its cached .path attribute.
            function findLiveTokenByLocator(liveTokens, refToken) {
                return liveTokens.find(token =>
                    token.type === refToken.type &&
                    token.value === refToken.value &&
                    token.s === refToken.s &&
                    token.e === refToken.e &&
                    samePath(token.path, refToken.path)
                ) || null;
            }

            // This is the main highlight token function that rebuilds a live version of the page in tokenized form and uses the cached token references
            // from the search results to highlight the live token based on its cached result.
            function highlightToken(activeiFrameDoc, activeiFrameRange, liveTokenReference, referenceEntry, searchQuery, color = "#ffd700") {

                clearHighlights(activeiFrameDoc.body); // First remove any page token previous highlight.

                listItems.forEach(function(item) { // Remove any current page tree link title highlight.
                    item.classList.remove('highlighted-tree-title');
                });

                // This is a pagetitle entry so we can handle this search entry directly by highlighting it in 
                // the page tree panel and return here. 
                if (!('token' in referenceEntry) && referenceEntry.type === 'pagetitle') {             

                    // Find link in navigation tree.
                    var targetLink = Array.from(listItems).find(link => {
                        // Get the page number for each page from its onclick attribute.
                        const targetPageIndex = getNodePageIndexNumber(link);
                        
                        // Check if the target title exists within that string.
                        return targetPageIndex && targetPageIndex == referenceEntry.page.pageindex;
                    });
                    targetLink.classList.add('highlighted-tree-title'); // Add highlight to targetted link.

                    return null;
                }

                // Rebuild a live reference to the iFrame as any HTML modification by clearingHighlights can break things and prevent proper highlighting.
                activeiFrameDoc = document.getElementById('page_frame').contentDocument || document.getElementById('page_frame').contentWindow.document;
                activeiFrameRange = activeiFrameDoc.createRange();
                liveTokenReference = buildDomTokenIndex(activeiFrameDoc.body);

                let liveTargetToken = null; 

                if (referenceEntry.token.type === "text") { // Handle text token.
                    
                    // Locates the live token based on the cache token reference provided by the search results entry.
                    liveTargetToken = findLiveTokenByLocator(liveTokenReference, referenceEntry.token); 

                    // Could not locate token in the live iFrame. Ensure the iFrame has the same structure as the cache.
                    // New UI elements inserted live by JS can break cache to live iFrame connection...
                    if (!liveTargetToken) { 
                        console.warn("Could not relocate live token", {
                            referenceToken: referenceEntry.token,
                            pageTitle: activeiFrameDoc.title
                        });
                        return null;
                    }

                    // Sets the range to target the correct live token.
                    activeiFrameRange.setStart(liveTargetToken.node, liveTargetToken.s);
                    activeiFrameRange.setEnd(liveTargetToken.node, liveTargetToken.e);

                    // Creates the <mark></mark> elment that will highlight the token.
                    const mark = activeiFrameDoc.createElement("mark");
                    mark.style.backgroundColor = color;
                    mark.style.padding = "0";
                    mark.style.margin = "0";
                    mark.style.borderRadius = "2px";

                    mark.dataset.searchHighlight = "1";

                    // Creates a temporary span at the ranges location for scrolling to that element.
                    const span = activeiFrameDoc.createElement('span');
                    activeiFrameRange.insertNode(span);

                    // Scrolls that token into view.
                    span.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',    // This centers the range vertically
                        inline: 'nearest'   // This keeps it visible horizontally
                    });

                    // Remove the span so it does not mess up the HTML structure.
                    span.remove();

                    // Now the token is highlighted.
                    try {
                        activeiFrameRange.surroundContents(mark);
                        return mark;
                    } catch {
                        // Fallback if surroundContents fails.
                        const contents = activeiFrameRange.extractContents();
                        mark.appendChild(contents);
                        activeiFrameRange.insertNode(mark);
                        return mark;
                    }
                }
                else if (referenceEntry.token.type === "image") { // Handle image token.
                    liveTargetToken = liveTokenReference.find((item) => // Find live token to highlight from reference token.
                        item.value === referenceEntry.token.value
                    );

                    // Target the correct image on the page.
                    const targetImage = activeiFrameDoc.querySelector(`img[src='${liveTargetToken.value}']`);

                    // Highlight the image and scroll it into view.
                    targetImage.dataset.searchImageHighlight = "1";
                    targetImage.classList.add('highlighted-image');
                    targetImage.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }
            }

            // Used to pull out all tokens from each entry inside combinedResults.
            // The tokens from all pages are placed into one sequential array so they can more easily be iterated over.
            function buildResults(pages) {
                const results = [];

                pages.forEach((page) => {
                    if (page.type === "pagetitle") {
                    results.push({
                        type: "pagetitle",
                        page
                    });
                    }

                    if (
                    page.type === "pagetext" &&
                    Array.isArray(page.tokenizedOrder)
                    ) {
                    page.tokenizedOrder.forEach((token, tokenIndex) => {
                        results.push({
                        type: "pagetext",
                        token,
                        tokenIndex,
                        page
                        });
                    });
                    }
                });

                return results;
            }

            combinedResults = buildResults(combinedResults); // Flattens out the the results array to make iterating over the tokens easier.

            if (combinedResults.length > 0) { // If results exist display results.

                let entryPointer = 0; // Main pointer for the result that is being displayed from combinedResults.

                // A live refernce is created to the currently active iFrame on the page since cached tokens cannot be displayed directly.
                // The highlightToken function does this with every call but this is used as reference here.
                let activePageIndex = combinedResults[entryPointer].page.pageindex; // The HTML pages file number that is currently being displayed.
                let activeiFrameDoc = null;
                let activeiFrameRange = null;
                let activeLiveTokens = null;

                // Navigation that takes the user to specified page they typed in.
                const clamp = (num, min, max) => Math.min(Math.max(num, min), max); // Sanitizes the users request to valid number ranges. 
                function handleGoTo(event) {
                    if (event.type === 'click' || event.key === 'Enter') {
                        const val = parseInt(goToInput.value, 10);
                        if (!isNaN(val)) {
                            // If user enters 110 but max is 100, result is 100.
                            let safeValue = clamp(val, 1, combinedResults.length);
                            // Update the input field visually to show the clamped value.
                            goToInput.value = safeValue; 
                            entryPointer = goToInput.value - 1;
                            navigateToElement();
                        }
                    }
                }
                goToInput.addEventListener('keydown', handleGoTo);
                goToInput.addEventListener('click', handleGoTo); // User for go to via URL search parameters.

                // Update the <input> element to show the user the result that is being displayed.
                if (searchURLSuccess && urlPageToken) { // URL Based search occured. Navigate to specified token.
                    goToInput.value = urlPageToken;
                    goToInput.click();

                    // Forget this url lookup so future searches are not stuck.
                    searchURLSuccess = null; 
                    urlPageToken = null;
                }
                else {
                    goToInput.value = entryPointer + 1; 
                }
               
                // Used to update the browser URL to reference the specified token.
                function updateURLWithTokenSearch(newPageToken, newQuery, activePageIndex) {
                    //Create a URL object based on the current location
                    const url = new URL(window.location);

                    // Clear ALL existing parameters.
                    url.search = ""; 

                    // Set/Update the parameters
                    url.searchParams.set('t', newPageToken);
                    url.searchParams.set('q', newQuery);

                    if (includeAllPagesInSearch) {
                        url.searchParams.set('page', activePageIndex);
                        url.searchParams.set('all', 1);
                    }
                    else {
                        url.searchParams.set('page', activePageIndex);
                        url.searchParams.set('all', 0);
                    }

                    // Also include font sizes in rewritten URL.
                    // Get tree panel font size.
                    treeSectionStyles = getComputedStyle(document.querySelector('.outermost'));
                    treeFontSize = parseFloat(parseFloat(treeSectionStyles.getPropertyValue('--tree-font-modifier')).toFixed(1));

                    // If an iFrame page is active retrieve its font size.
                    if (pageSectionStyles) {
                        pageFontSize = parseFloat(parseFloat(pageSectionStyles.getPropertyValue('--page-font-modifier')).toFixed(1));
                    }

                    if (treeFontSize) { url.searchParams.set('tf', treeFontSize); }
                    if (pageFontSize) { url.searchParams.set('pf', pageFontSize); }

                    // Update the address bar without reloading
                    // Syntax: pushState(stateObject, title, relativePath)
                    window.history.replaceState({}, '', url.pathname + url.search);
                }

                function navigateToElement() {
                    navText.innerText = ` of ${combinedResults.length}`;

                    if (activeiFrameDoc === null || activePageIndex != combinedResults[entryPointer].page.pageindex || getPageNumberFromFilename(document.getElementById('page_frame').src) !== activePageIndex) { // Navigate to correct page if token is on a different page.
                        activePageIndex = combinedResults[entryPointer].page.pageindex;
                        changeFrameToPage(combinedResults[entryPointer].page.filename);
                        updateURLWithTokenSearch(entryPointer + 1, searchValue, activePageIndex);
                        return;
                    }
        
                    if (activeiFrameDoc !== null) {
                        if (("token" in combinedResults[entryPointer]) && combinedResults[entryPointer].token.type === 'text') {
                            const tokenTextValue = combinedResults[entryPointer].token.value;
                            const tokenReadyText = tokenTextValue.length > 20 ? tokenTextValue.slice(0, 20) + "..." : tokenTextValue;
                            updateStatusLabel(`Found result: "${tokenReadyText}"`);
                        }
                        updateURLWithTokenSearch(entryPointer + 1, searchValue, activePageIndex);
                        highlightToken(activeiFrameDoc, activeiFrameRange, activeLiveTokens, combinedResults[entryPointer]);
                    }  

                }

                // Onload setup.
                showNavigation();
                navigateToElement(); // Navigate to the first result onload.
                
                nextBtn.onclick = () => {
                    entryPointer++;
                    
                    if (entryPointer === combinedResults.length) { // Circle around.
                        entryPointer = 0;
                    }

                    goToInput.value = entryPointer + 1;

                    navigateToElement();
                };

                prevBtn.onclick = () => {
                    entryPointer--;

                    if (entryPointer === -1) { // Circle around.     
                        entryPointer = combinedResults.length - 1;
                    }

                    goToInput.value = entryPointer + 1;
                    
                    navigateToElement();
                };

                // Adds TAB button navigation for results.
                let isCoolingDown = false;
                window.addEventListener('keydown', function (event) {
                if (event.key === 'Tab') {
                    event.preventDefault(); // Stops focus from moving to other elements.

                    // If we are in the cooldown period, block the press.
                    if (isCoolingDown) {
                        return;
                    }
                    
                    nextBtn.click();

                    isCoolingDown = true;
                    setTimeout(() => { // Start cooldown period.
                        isCoolingDown = false;
                    }, 100); 
                }
                });

                //Used to display the new iFrame that is requested.
                function changeFrameToPage(filename) {
                    changeFrame(filename); // This is CherryTrees function from scrip3.js used to display each new iFrame.
                    // Select the iframe element.

                    const targetiFrame = document.getElementById('page_frame');

                    targetiFrame.onload = function() { // Once an iFrame loads the highlights are done to the new iFrame.

                        // Targets the element corrent page tree panel element based on the page the user is navigation to.
                        var targetLink = Array.from(listItems).find(link => {

                            const targetPageIndex = getNodePageIndexNumber(link);
                            
                            // If the page numbers match the correct page has been found.
                            return targetPageIndex && targetPageIndex == combinedResults[entryPointer].page.pageindex;
                        });
                        
                        // If the active page number our code opened is different from the currently opened page inside the iFrame
                        // then the user has navigated away from the page our code opened manually. If that is the case we would
                        // stop here.
                        if (getPageNumberFromFilename(targetiFrame.src) === activePageIndex) { // This is a page opened by our code not the user clicking on a tree panel entry directly.

                            listItems.forEach(function(item) { // Remove any active page.
                                item.classList.remove('active');
                            });
                            targetLink.classList.add('active'); // Make the new page active.

                            // Access the document inside the iframe and update the live references.
                            activeiFrameDoc = targetiFrame.contentDocument || targetiFrame.contentWindow.document;
                            activeiFrameRange = activeiFrameDoc.createRange();
                            activeLiveTokens = buildDomTokenIndex(activeiFrameDoc.body);

                            // Give a status label update for the search results if it is a text token result.
                            if (("token" in combinedResults[entryPointer]) && combinedResults[entryPointer].token.type === 'text') {
                                const tokenTextValue = combinedResults[entryPointer].token.value;
                                const tokenReadyText = tokenTextValue.length > 20 ? tokenTextValue.slice(0, 20) + "..." : tokenTextValue;
                                updateStatusLabel(`Found result: "${tokenReadyText}"`);
                            }

                            // Highlights the current entry by providing its search reference to the hightlight function.
                            highlightToken(activeiFrameDoc, activeiFrameRange, activeLiveTokens, combinedResults[entryPointer]);

                            // Scrolls the active page link into view in the tree panel.
                            targetLink.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                                inline: 'nearest'
                            });
                        } 

                        return true;  
                    };

                    return false;
                }

            }
            else {
                // Result not found.
                const searchResultReadyText = searchValue.length > 40 ? searchValue.slice(0, 40) + "..." : searchValue;
                updateStatusLabel(`No results for: ${searchResultReadyText}`);
            }

        } catch (err) {
            if (err.name === 'AbortError') {
                updateStatusLabel('Search ended early.');
                console.log("Previous search task discarded.");
                return null;
            } else {
                console.log(err);
                console.error(err);
                updateStatusLabel('Search error.');
                showSearchButton();
                console.error("Search Error:", err);
                return null;
            }
        } finally { // Search completed. Reset AbortController and update navigation.
            if (currentSearchController?.signal === signal) {
                showSearchButton();
                currentSearchController = null;
                return true;
            }
        }
        
    }

});
