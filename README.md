# cherrytree-notes-web-interface
A web interface upgrade for cherrytree notes providing an upgrade to the default website interface given by cherytree when using the "Export as HTML" function. This interface remains fully client side. It provides full image and text search (with cache files) across all pages, makes the interface mobile friendly, adds a dark theme, and much more. Now you can view your notes anywhere on any device if you use GitHub Pages for hosting and combine it with Github repos to easily update website note files (set as a private repo). There are ways to reduce your websites visibility online in the full guide below.

View the live interface and full guide here: [Link to Guide and Live Interface](https://coregtree.github.io/cherrytree-notes-web-interface/?page=1)

## Features
- Fully client side text and image search meaning you can host this interface with basic static website hosting.
- Added caching for instant search results when searching page and image text.
- Made the TAB key go to the next search result.
- Made any page view sharable using a link so you can bookmark it to come back to it later.
- Added font size adjustment buttons.
- Added automatic resizing of the page contents to the largest image on each page.
- Made both panels resizable by dragging the middle divider.
- Made the interface mobile friendly allowing you to access your notes from anywhere.
- Added a print button that prints the note page only.
- Added a dark theme.

## Download
See: [Releases](https://github.com/coregtree/cherrytree-notes-web-interface/releases)

## Basic Setup
1. Export your notes to HTML using these export settings:
<img width="900" height="920" alt="image" src="https://github.com/user-attachments/assets/9140fc6b-3b1d-4a02-9085-4a07f760b9f9" />

These export settings are a requirement: “Include Node Name”, “Links Tree in Every Page”
<img width="900" height="883" alt="image" src="https://github.com/user-attachments/assets/2f8d8519-8533-4a7a-9dc9-6a7dbee616d1" />

2. Open the exported HTML notes folder and copy the “master.css” and “master-script.js”
files into the “res” folder.

3. Right click -> edit the “script3.js” file and add the following code to the top of the file:

```
var script = document.createElement('script');
script.src = './res/master-script.js';
document.head.appendChild(script);
```

Right click -> edit the “styles4.css” file and add the following code in the “General” section
of the file:
```
@import url("./master.css");
```

4. Now you will need to host the HTML files using static website hosting or just run a local web server.
See the hosting guide here using GitHub Pages for free hosting and how to reduce your sites visibility online:
[Link to Hosting Your Notes Using Github Pages](https://coregtree.github.io/cherrytree-notes-web-interface/?page=2)

5. Once you have access to the web interface in your browser you will need to download the page structure and
image structure cache files by clicking "Download Search Cache Files". This will generate a cached structure of
the HTML files, prompting a download for "page-structure-cache.json", and then scan the text inside every image
and promt a download for "image-text-cache.json". MAKE SURE TO ALLOW MULTIPLE DOWNLOADS FOR THE SITE
IN YOUR BROWSER. Upload both of these cache files to the sites main root folder.

## Support Me
If this you like this project you can donate here, thank you: [Ko-Fi Link](https://ko-fi.com/coregtree)



