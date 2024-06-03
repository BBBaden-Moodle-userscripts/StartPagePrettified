// ==UserScript==
// @name         Start Page Prettified
// @namespace    https://moodle.bbbaden.ch/
// @version      0.4.1
// @description  Customizes your Moodle Startpage
// @author       PianoNic
// @match        https://moodle.bbbaden.ch/
// @match        https://moodle.bbbaden.ch/userscript/extensions
// @grant        GM_info
// @require      https://github.com/black-backdoor/DataBridge/raw/main/DataBridge.lib.user.js
// @downloadURL  https://github.com/BBBaden-Moodle-userscripts/StartPagePrettified/raw/main/StartPagePrettified.user.js
// @updateURL    https://github.com/BBBaden-Moodle-userscripts/StartPagePrettified/raw/main/StartPagePrettified.user.js
// ==/UserScript==

(function() {
    'use strict';

    if(window.location.href == "https://moodle.bbbaden.ch/userscript/extensions"){
        //------------------------ DataBridge ------------------------
        // Create a new DataBridge
        const UserScriptManagerCon = new Connection("BBBUserScriptManager");

        // Register an event listener for the extensionInstalled event
        Protocol.registerMessageType(UserScriptManagerCon, 'getInstalled', function (msg) {
            UserScriptManagerCon.send({
                "header": {
                    "receiver": msg.header.sender,
                    "protocolVersion": "1.0",
                    "messageType": "extensionInstalled",
                },
                "body": {
                    "script": {
                        "scriptName": GM_info.script.name,
                        "scriptVersion": GM_info.script.version,
                    }
                }
            });
        });
        return;
    }

    // Remove max-width from .pagelayout-standard #page.drawers .main-inner
    var styleElement = document.createElement('style');
    styleElement.innerHTML = '.pagelayout-standard #page.drawers .main-inner, body.limitedwidth #page.drawers .main-inner { max-width: none; }';
    document.head.appendChild(styleElement);

    // Create a new div with the class main-inner
    var newDiv = document.createElement('div');
    newDiv.className = 'main-inner';

    // Create an h2 element with the text "Last Visited"
    var heading = document.createElement('h2');
    heading.textContent = 'Last Visited';
    heading.style.marginLeft = "10px";
    
    // Append the heading to the new div
    newDiv.appendChild(heading);

    // Create a container div for the courseboxes
    var containerDiv = document.createElement('div');
    containerDiv.style.display = 'flex';
    containerDiv.style.flexWrap = 'wrap';

    // Append the container div to the new div
    newDiv.appendChild(containerDiv);

    // Append the new div to the existing div with id 'page' at the beginning
    var pageDiv = document.getElementById('page');
    if (pageDiv) {
        pageDiv.insertBefore(newDiv, pageDiv.firstChild);

        // Extracting user ID
        var userIdElement = document.getElementById('nav-notification-popover-container');
        var userId = userIdElement.getAttribute('data-userid');

        // Extracting sesskey from the Logout link
        var logoutLink = document.querySelector('.logininfo a[href*="logout.php"]');
        if (logoutLink) {
            var sesskeyMatch = logoutLink.href.match(/sesskey=([^&]+)/);
            if (sesskeyMatch && sesskeyMatch[1]) {
                var extractedSesskey = sesskeyMatch[1];

                // Now you can use the extractedSesskey in your fetch URL or wherever needed
            } else {
                console.error('Failed to extract sesskey from the Logout link.');
            }
        } else {
            console.error('Logout link not found.');
        }

        var raw = JSON.stringify([
            {
                "index": 0,
                "methodname": "core_course_get_recent_courses",
                "args": {
                    "userid": userId,
                    "limit": 9
                }
            }
        ]);

        var requestOptions = {
            method: 'POST',
            body: raw,
            redirect: 'follow'
        };

        fetch(`https://moodle.bbbaden.ch/lib/ajax/service.php?sesskey=${extractedSesskey}&info=core_course_get_recent_courses`, requestOptions)
            .then(response => response.json())
            .then(result => {
                // Create a div for each course with the coursebox class
                result[0].data.forEach(course => {
                    // Create a coursebox div
                    var courseDiv = document.createElement('div');
                    courseDiv.className = 'coursebox';
                    courseDiv.style.flex = '0 0 calc(33.333% - 20px)'; // Three elements per row with 10px margin between them

                    // Apply styling to the coursebox div
                    courseDiv.style.position = 'relative'; // Ensure position relative for absolute overlay
                    courseDiv.style.border = '1px solid #dee2e6';
                    courseDiv.style.margin = '0.5rem';
                    courseDiv.style.borderRadius = '0.5rem';


                    courseDiv.style.backgroundImage = `url('${course.courseimage}')`; // Set the background image
                    courseDiv.style.backgroundSize = 'cover'; // Ensure the background image covers the entire div
                    courseDiv.style.backgroundPosition = 'center'; // Center the background image

                    // Add course details to the coursebox div
                    var overlayDivText = document.createElement('div');
                    var overlayDivText = document.createElement('div');
                    overlayDivText.innerHTML += `
                        <h2 style="color: white;">${course.id}</h2>
                        <h4 style="color: white;">${course.fullname}</h4>
                        <p style="color: white;">${course.shortname}</p>

                        <div class="mt-auto">
                            <a href="${course.viewurl}" target="_blank">
                                <button class="btn btn-outline-light btn-sm w-100">Go to Course</button>
                            </a>
                        </div>
                    `;

                    overlayDivText.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
                    overlayDivText.style.borderRadius = '0.5rem';
                    overlayDivText.style.padding = '0.5rem';
                    overlayDivText.style.height = "100%";
                    overlayDivText.className = "d-flex flex-column";
                    // Append the overlay div to the coursebox div
                    courseDiv.appendChild(overlayDivText);

                    // Append the coursebox div to the container div
                    containerDiv.appendChild(courseDiv);

                });
            })
            .catch(error => console.log('error', error));
    }

    document.querySelector('.courses.frontpage-course-list-enrolled').classList.add('row', 'p-0', 'm-0');

    document.querySelectorAll('.coursebox.clearfix').forEach(courseBox => {
        // Add Bootstrap column class with custom margins
        courseBox.classList.add('col-lg-4', 'col-md-6');
        courseBox.style.margin = '0'; // Horizontal margins only

        // Extract course information
        const courseId = courseBox.getAttribute('data-courseid');
        const courseName = courseBox.querySelector('.coursename a').innerText;
        const courseLink = courseBox.querySelector('.coursename a').href;

        // Check if image exists and extract URL
        const imageElement = courseBox.querySelector('.courseimage img');
        const imageUrl = imageElement ? imageElement.src : courseBox.querySelector('img') ? courseBox.querySelector('img').src : null;

        // Create overlay div
        var overlayDivText = document.createElement('div');
        overlayDivText.innerHTML += `
            <h2 style="color: white;">${courseId}</h2>
            <h4 style="color: white;">${courseName}</h4>

            <div class="mt-auto">
                <a href="${courseLink}" target="_blank">
                    <button class="btn btn-outline-light btn-sm w-100">Go to Course</button>
                </a>
            </div>
        `;

        overlayDivText.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        overlayDivText.style.borderRadius = '0.5rem';
        overlayDivText.style.padding = '0.5rem';
        overlayDivText.style.height = "100%";
        overlayDivText.style.width = "100%";
        overlayDivText.className = "d-flex flex-column";

        // Style the course box to have the image as background if image exists
        courseBox.style.position = 'relative';
        if (imageUrl) {
            courseBox.style.backgroundImage = `url(${imageUrl})`;
            courseBox.style.backgroundSize = 'cover';
            courseBox.style.backgroundPosition = 'center';
        } else {
            courseBox.style.backgroundColor = '#333'; // Fallback background color
        }
        courseBox.style.borderRadius = '0.5rem';
        courseBox.style.overflow = 'hidden';
        courseBox.style.height = '200px';

        // Create an overlay container
        var overlayContainer = document.createElement('div');
        overlayContainer.style.position = 'absolute';
        overlayContainer.style.top = '0';
        overlayContainer.style.left = '0';
        overlayContainer.style.width = '100%';
        overlayContainer.style.height = '100%';
        overlayContainer.style.display = 'flex';
        overlayContainer.style.flexDirection = 'column';
        overlayContainer.style.justifyContent = 'center';
        overlayContainer.style.alignItems = 'center';

        // Append the overlay div to the overlay container
        overlayContainer.appendChild(overlayDivText);

        // Append the overlay container to the course box
        courseBox.appendChild(overlayContainer);

        // Remove divs with the classes "info" and "content"
        const infoDiv = courseBox.querySelector('.info');
        if (infoDiv) {
            infoDiv.remove();
        }

        const contentDiv = courseBox.querySelector('.content');
        if (contentDiv) {
            contentDiv.remove();
        }
    });

    // Select the 'Alle Kurse' button and adjust its style
    const pagingMoreLinkButton = document.querySelector('.paging.paging-morelink');

    if (pagingMoreLinkButton) {
      pagingMoreLinkButton.className = "coursebox clearfix even col-lg-4 col-md-6";
      const button = pagingMoreLinkButton.querySelector("a.btn");
      button.style.height = "100%";
      button.style.textAlign = "center"; // Center-align the text
    }

})();
