// ==UserScript==
// @name         Start Page Prettified
// @namespace    https://moodle.bbbaden.ch/
// @version      1.2.1
// @description  Customizes your Moodle Startpage with Bootstrap Cards
// @author       PianoNic
// @match        https://moodle.bbbaden.ch/
// @match        https://moodle.bbbaden.ch/userscript/extensions
// @match        https://lms.bbbaden.ch/
// @match        https://lms.bbbaden.ch/userscript/extensions
// @grant        GM_info
// @require      https://github.com/BBBaden-Moodle-userscripts/LoggingLibrary/raw/refs/heads/main/Logging.lib.user.js
// @require      https://github.com/BBBaden-Moodle-userscripts/UserscriptBridgeLib/raw/main/userscriptBridge.lib.js
// @downloadURL  https://github.com/BBBaden-Moodle-userscripts/StartPagePrettified/raw/main/StartPagePrettified.user.js
// @updateURL    https://github.com/BBBaden-Moodle-userscripts/StartPagePrettified/raw/main/StartPagePrettified.user.js
// @icon         https://github.com/BBBaden-Moodle-userscripts/StartPagePrettified/blob/main/icon/icon.png?raw=true
// ==/UserScript==

(function() {
    'use strict';

    if (UserscriptBridge.registerScript() || !UserscriptBridge.runOnce()) return;
    Logger.info('startpage', 'v1.2.1 - Initializing');

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
    if (!pageDiv) {
        Logger.warn('startpage', 'Page element not found');
        return;
    }

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

    // Inline placeholder, so it can't fail to load like the course image or an external service
    function placeholderImage(id, label) {
        var hue = (Number(id) * 47) % 360;
        var text = (label || '').replace(/[<>&"']/g, '').trim();
        if (text.length > 22) text = text.slice(0, 21).trim() + '…';
        var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
            <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="hsl(${hue},55%,55%)"/>
                <stop offset="1" stop-color="hsl(${(hue + 40) % 360},55%,40%)"/>
            </linearGradient></defs>
            <rect width="400" height="200" fill="url(#g)"/>
            <text x="200" y="112" font-family="sans-serif" font-size="28" font-weight="bold"
                  fill="#fff" fill-opacity="0.9" text-anchor="middle">${text}</text>
        </svg>`;
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    function createCourseCard({ id, name, shortname, url, image }) {
        var card = document.createElement('div');
        card.className = 'card h-100';
        card.innerHTML = `
            <img class="card-img-top">
            <div class="card-body">
                <span class="badge bg-danger text-white mb-2"></span>
                <h5 class="card-title"></h5>
                <p class="card-text"></p>
                <a class="btn btn-primary">Go to Course</a>
            </div>
        `;
        var img = card.querySelector('img');
        var placeholder = placeholderImage(id, shortname || name);
        img.onerror = () => {
            img.onerror = null;
            img.src = placeholder;
        };
        img.src = image || placeholder;
        img.alt = name || '';
        card.querySelector('.badge').textContent = id;
        card.querySelector('.card-title').textContent = name || '';
        var text = card.querySelector('.card-text');
        if (shortname) text.textContent = shortname; else text.remove();
        card.querySelector('a').href = url;
        return card;
    }

    // Moodle web service call (relative, works on moodle.bbbaden.ch and lms.bbbaden.ch)
    function callService(methodname, args) {
        return fetch(`/lib/ajax/service.php?sesskey=${sesskey}&info=${methodname}`, {
            method: 'POST',
            body: JSON.stringify([{ index: 0, methodname, args }])
        })
        .then(response => response.json())
        .then(result => {
            if (result[0].error) throw result[0].exception;
            return result[0].data;
        });
    }

    var toCard = course => createCourseCard({
        id: course.id,
        name: course.fullname,
        shortname: course.shortname,
        url: course.viewurl,
        image: course.courseimage
    });

    // Extract user ID and sesskey
    var userId = document.getElementById('nav-notification-popover-container')?.getAttribute('data-userid');
    var sesskey = document.querySelector('.logininfo a[href*="logout.php"]')?.href.match(/sesskey=([^&]+)/)?.[1];

    // Fetch recent courses
    if (userId && sesskey) {
        callService('core_course_get_recent_courses', { userid: userId, limit: 9 })
            .then(courses => courses.forEach(course => lastVisitedGrid.appendChild(toCard(course))))
            .catch(error => Logger.error('startpage', 'Error fetching recent courses:', error));
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
            const courseLink = courseBox.querySelector('.coursename a');
            allCoursesGrid.appendChild(createCourseCard({
                id: courseBox.getAttribute('data-courseid'),
                name: courseLink?.innerText,
                url: courseLink?.href,
                image: courseBox.querySelector('.courseimage img')?.src || courseBox.querySelector('img')?.src
            }));
        });

        // Hide original courses container
        coursesContainer.style.display = 'none';
    } else if (sesskey) {
        // The start page of lms.bbbaden.ch has no enrolled course list, load it instead
        callService('core_course_get_enrolled_courses_by_timeline_classification', {
            classification: 'inprogress', limit: 0, offset: 0, sort: 'fullname'
        })
            .then(data => data.courses.forEach(course => allCoursesGrid.appendChild(toCard(course))))
            .catch(error => Logger.error('startpage', 'Error fetching enrolled courses:', error));
    }

    // Add "Alle Kurse" button below the grid, using Moodle's own link when the page has one
    const pagingMoreLink = document.querySelector('.paging.paging-morelink');
    var allCoursesButton = document.createElement('a');
    allCoursesButton.className = 'btn btn-primary btn-lg';
    allCoursesButton.textContent = 'Alle Kurse';
    allCoursesButton.href = pagingMoreLink?.querySelector('a')?.href || '/my/courses.php';

    var allCoursesFooter = document.createElement('div');
    allCoursesFooter.className = 'text-center mt-4';
    allCoursesFooter.appendChild(allCoursesButton);
    allCoursesSection.appendChild(allCoursesFooter);
    if (pagingMoreLink) pagingMoreLink.style.display = 'none';

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

    Logger.success('startpage', 'Initialization complete');
})();
