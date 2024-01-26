// ==UserScript==
// @name         Start Page Prettified
// @namespace    https://moodle.bbbaden.ch/
// @version      0.1
// @description  Customizes your Moodle Startpage
// @author       PianoNic
// @match        https://moodle.bbbaden.ch/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

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
                    overlayDivText.innerHTML += `
                        <h2>${course.id}</h2>
                        <h4>${course.fullname}</h4>
                        <p>${course.shortname}</p>
                        <a href="${course.viewurl}" target="_blank">
                            <button class="btn btn-outline-secondary btn-sm">Go to Course</button>
                        </a>
                    `;

                    overlayDivText.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
                    overlayDivText.style.borderRadius = '0.5rem';
                    overlayDivText.style.padding = '0.5rem';
                    overlayDivText.style.height = "100%"
                    // Append the overlay div to the coursebox div
                    courseDiv.appendChild(overlayDivText);

                    // Append the coursebox div to the container div
                    containerDiv.appendChild(courseDiv);
                });
            })
            .catch(error => console.log('error', error));
    }
})();
