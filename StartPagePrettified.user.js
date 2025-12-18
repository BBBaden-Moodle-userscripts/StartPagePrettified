// ==UserScript==
// @name         Start Page Prettified
// @namespace    https://moodle.bbbaden.ch/
// @version      1.0.0
// @description  Customizes your Moodle Startpage with Bootstrap Cards
// @author       PianoNic
// @match        https://moodle.bbbaden.ch/
// @match        https://moodle.bbbaden.ch/userscript/extensions
// @grant        GM_info
// @require      https://github.com/BBBaden-Moodle-userscripts/UserscriptBridgeLib/raw/main/userscriptBridge.lib.js
// @downloadURL  https://github.com/BBBaden-Moodle-userscripts/StartPagePrettified/raw/main/StartPagePrettified.user.js
// @updateURL    https://github.com/BBBaden-Moodle-userscripts/StartPagePrettified/raw/main/StartPagePrettified.user.js
// @icon         https://github.com/BBBaden-Moodle-userscripts/StartPagePrettified/blob/main/icon/icon.png?raw=true
// ==/UserScript==

(function() {
    'use strict';

    if (window.location.href == "https://moodle.bbbaden.ch/userscript/extensions") {
        //------------------------ DataBridge ------------------------
        const UserScriptManagerCon = new Connection("BBBUserScriptManager");

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

    // CSS Grid styling
    var styleElement = document.createElement('style');
    styleElement.innerHTML = `
        .card-img-top {
            height: 200px;
            object-fit: cover;
        }

        .card {
            border-radius: 0.5rem;
        }

        .course-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-column-gap: 20px;
            grid-row-gap: 20px;
        }

        @media (max-width: 992px) {
            .course-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 576px) {
            .course-grid {
                grid-template-columns: repeat(1, 1fr);
            }
        }
    `;
    document.head.appendChild(styleElement);

    var pageDiv = document.getElementById('page');
    if (!pageDiv) return;

    // Create main container
    var mainContainer = document.createElement('div');
    mainContainer.className = 'container-fluid px-4';

    // Create "Last Visited" section
    var lastVisitedSection = document.createElement('div');
    lastVisitedSection.className = 'mb-5';

    var lastVisitedTitle = document.createElement('h2');
    lastVisitedTitle.className = 'mb-3';
    lastVisitedTitle.textContent = 'Last Visited';
    lastVisitedSection.appendChild(lastVisitedTitle);

    var lastVisitedGrid = document.createElement('div');
    lastVisitedGrid.className = 'course-grid';
    lastVisitedSection.appendChild(lastVisitedGrid);

    mainContainer.appendChild(lastVisitedSection);
    pageDiv.insertBefore(mainContainer, pageDiv.firstChild);

    // Extract user ID and sesskey
    var userIdElement = document.getElementById('nav-notification-popover-container');
    var userId = userIdElement?.getAttribute('data-userid');

    var logoutLink = document.querySelector('.logininfo a[href*="logout.php"]');
    var extractedSesskey = null;

    if (logoutLink) {
        var sesskeyMatch = logoutLink.href.match(/sesskey=([^&]+)/);
        if (sesskeyMatch && sesskeyMatch[1]) {
            extractedSesskey = sesskeyMatch[1];
        }
    }

    // Fetch recent courses
    if (userId && extractedSesskey) {
        var raw = JSON.stringify([{
            "index": 0,
            "methodname": "core_course_get_recent_courses",
            "args": {
                "userid": userId,
                "limit": 9
            }
        }]);

        fetch(`https://moodle.bbbaden.ch/lib/ajax/service.php?sesskey=${extractedSesskey}&info=core_course_get_recent_courses`, {
            method: 'POST',
            body: raw,
            redirect: 'follow'
        })
        .then(response => response.json())
        .then(result => {
            result[0].data.forEach(course => {
                var card = document.createElement('div');
                card.className = 'card h-100';

                var cardImg = document.createElement('img');
                cardImg.src = course.courseimage || `https://picsum.photos/seed/${course.id}/400/200`;
                cardImg.className = 'card-img-top';
                cardImg.alt = course.fullname;

                var cardBody = document.createElement('div');
                cardBody.className = 'card-body';
                cardBody.innerHTML = `
                    <span class="badge bg-danger text-white mb-2">${course.id}</span>
                    <h5 class="card-title">${course.fullname}</h5>
                    <p class="card-text">${course.shortname}</p>
                    <a href="${course.viewurl}" class="btn btn-primary">Go to Course</a>
                `;

                card.appendChild(cardImg);
                card.appendChild(cardBody);
                lastVisitedGrid.appendChild(card);
            });
        })
        .catch(error => console.log('Error fetching recent courses:', error));
    }

    // Create "All Courses" section
    var allCoursesSection = document.createElement('div');
    allCoursesSection.className = 'mb-5';

    var allCoursesTitle = document.createElement('h2');
    allCoursesTitle.className = 'mb-3';
    allCoursesTitle.textContent = 'All Courses';
    allCoursesSection.appendChild(allCoursesTitle);

    var allCoursesGrid = document.createElement('div');
    allCoursesGrid.className = 'course-grid';
    allCoursesSection.appendChild(allCoursesGrid);

    mainContainer.appendChild(allCoursesSection);

    // Transform existing course boxes
    var coursesContainer = document.querySelector('.courses.frontpage-course-list-enrolled');
    if (coursesContainer) {
        document.querySelectorAll('.coursebox.clearfix').forEach(courseBox => {
            const courseId = courseBox.getAttribute('data-courseid');
            const courseName = courseBox.querySelector('.coursename a')?.innerText;
            const courseLink = courseBox.querySelector('.coursename a')?.href;

            const imageElement = courseBox.querySelector('.courseimage img');
            const imageUrl = imageElement?.src || courseBox.querySelector('img')?.src;

            var card = document.createElement('div');
            card.className = 'card h-100';

            var cardImg = document.createElement('img');
            cardImg.src = imageUrl || `https://picsum.photos/seed/${courseId}/400/200`;
            cardImg.className = 'card-img-top';
            cardImg.alt = courseName;
            card.appendChild(cardImg);

            var cardBody = document.createElement('div');
            cardBody.className = 'card-body';
            cardBody.innerHTML = `
                <span class="badge bg-danger text-white mb-2">${courseId}</span>
                <h5 class="card-title">${courseName}</h5>
                <a href="${courseLink}" class="btn btn-primary">Go to Course</a>
            `;
            card.appendChild(cardBody);

            allCoursesGrid.appendChild(card);
        });

        // Hide original courses container
        coursesContainer.style.display = 'none';
    }

    // Add "Alle Kurse" button
    const pagingMoreLinkButton = document.querySelector('.paging.paging-morelink');
    if (pagingMoreLinkButton) {
        var allCoursesCard = document.createElement('div');
        allCoursesCard.className = 'card h-100 d-flex align-items-center justify-content-center';

        const button = pagingMoreLinkButton.querySelector("a.btn");
        if (button) {
            button.className = "btn btn-primary btn-lg";
            button.textContent = 'Alle Kurse';
            allCoursesCard.appendChild(button);
        }

        allCoursesGrid.appendChild(allCoursesCard);
        pagingMoreLinkButton.style.display = 'none';
    }

    // Move search form to top
    var searchFormWrapper = document.querySelector('.box.py-3.d-flex.justify-content-center');
    if (searchFormWrapper) {
        var searchForm = searchFormWrapper.querySelector('.simplesearchform');
        if (searchForm) {
            searchFormWrapper.remove();
            pageDiv.insertBefore(searchFormWrapper, pageDiv.firstChild);
        }
    }

    // Move header to top
    var headerElement = document.getElementById('page-header');
    if (headerElement) {
        headerElement.remove();
        pageDiv.insertBefore(headerElement, pageDiv.firstChild);
    }

    // Remove main-inner classes
    document.querySelectorAll('.main-inner').forEach(element => {
        element.classList.remove('main-inner');
    });
})();
