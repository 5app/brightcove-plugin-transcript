/**
 * Plugin to show a transcript for a video
 */

videojs.registerPlugin('displayBCTranscript', function() {
    const player = this;

    /** Player */
    const playerEl = player.el();
    playerEl.classList.add("vjs-transcript");

    /** Transcript Dialog */
    const transcriptEl = document.createElement('nav');
    transcriptEl.className = 'vjs-transcript-panel';
    transcriptEl.innerHTML = `<header></header><ol role="menu"></ol>`;
    playerEl.appendChild(transcriptEl);

    /** List */
    const listEl = transcriptEl.querySelector('ol[role="menu"]');

    /** Search Transcript */
    const searchEl = document.createElement('input');
    searchEl.setAttribute('type', 'search');
    searchEl.setAttribute('placeholder', '🔎');
    searchEl.addEventListener('input', (e) => {
        e.preventDefault();
        const query = e.target.value.trim().toLowerCase();
        const queryRegExp = new RegExp('\\b' + query, 'i');
        listEl.querySelectorAll('li[role="menuitem"]').forEach((el) => {
            const content = el.textContent;
            if (!query || content.match(queryRegExp)) {
                el.classList.remove('vjs-hidden');
            }
            else {
                el.classList.add('vjs-hidden');
            }
        });
        // Highlight the text nodes
        highlightTextNodes(query, listEl);
    });
    transcriptEl.querySelector('header').appendChild(searchEl);

    /** Control Bar */
    const controlBarEl = playerEl.querySelector('.vjs-control-bar');

    /** Toggle Transcript button */
    const toggleEl = document.createElement('button');
    toggleEl.classList.add('vjs-transcript-toggle', 'vjs-control', 'vjs-button', 'vjs-hidden');
    toggleEl.setAttribute('type', 'button');
    toggleEl.setAttribute('aria-disabled', 'false');
    toggleEl.setAttribute('title', 'Transcript');
    toggleEl.innerHTML = '<span class="vjs-icon-chapters" aria-hidden="true"></span><span class="vjs-control-text" aria-live="polite">Transcript</span>';
    toggleEl.onclick = function() {
        playerEl.classList.toggle('vjs-transcript-active');
    };
    controlBarEl.appendChild(toggleEl);

    /** Close button */
    const closeEl = document.createElement('button');
    closeEl.setAttribute('title', 'Close');
    closeEl.classList.add('vjs-button-close', 'vjs-button');
    closeEl.onclick = function() {
        playerEl.classList.remove('vjs-transcript-active');
    };
    transcriptEl.querySelector('header').appendChild(closeEl);

    this.on('loadeddata', async function() {
        const src = player.mediainfo?.transcripts?.find(t => t.src.startsWith('https://'))?.src;
        if (!src) {
            // If the SRC does not exist, do not show the transcript
            return;
        }

        const resp = await fetch(src);
        const json = await resp.json();
        const {items} = json.results;
        const length = items.length;
        if (!length) {
            // If the length does not exist do to show the transcript
            return;
        }
        const formattedItems = items.reduce((acc, {start_time, end_time, content}, index) => {
            let current = acc.at(-1);
            // Is this a break?
            if (start_time === null) {
                current.content += content;
                // initiate a new object
                current = {};
                if (index < length - 1) {
                  acc.push(current);
                }
            }
            else {
                if (!current.start_time) {
                    current.start_time = start_time;
                }
                // Update the endtime
                current.end_time = end_time;
                // Add the content
                if (current.content) {
                    current.content += ' ' + content;
                }
                else {
                    current.content = content
                }
            }
            return acc;
        }, [{start_time: null, end_time: null, content: ''}]);

        const endTime = formattedItems.at(-1).end_time;

        // Insert items into the player

        listEl.innerHTML = formattedItems.map(({start_time, end_time, content}) => {
            return `<li role="menuitem"><a href="javascript: void();" data-start-time="${start_time}" data-end-time="${end_time}"><time datetime="${start_time}">${formatTime(start_time, end_time)}</time> ${content}</a></li>`;
        }).join('');

        listEl.onclick = function(e) {
            const {target} = e;
            if (target.tagName === 'A') {
                const startTime = target.getAttribute('data-start-time');
                const endTime = target.getAttribute('data-end-time');
                player.currentTime(startTime);
                player.play();
                // player.on('timeupdate', function onTimeUpdate() {
                //     if (player.currentTime() >= endTime) {
                //         player.off('timeupdate', onTimeUpdate);
                //         player.pause();
                //     }
                // });
            }
        };

        player.on('timeupdate', function onTimeUpdate() {
            // Loop though the DOM items
            listEl.querySelectorAll('a').forEach((el) => {
                const startTime = el.getAttribute('data-start-time');
                const endTime = el.getAttribute('data-end-time');
                if (player.currentTime() >= startTime && player.currentTime() <= endTime) {
                    el.parentElement.classList.add('active');
                    if (!transcriptEl.matches(':hover')) {
                        // using scrollIntoView block=center caused a buggy layout shift
                        el.scrollIntoView({behavior: 'smooth', block: 'nearest'});
                    }
                }
                else {
                    el.parentElement.classList.remove('active');
                }
            });
        });

        // Show the toggle transcript button
        toggleEl.classList.remove('vjs-hidden');

    });
});

function formatTime(time, endTime) {
    const date = new Date(null);
    date.setSeconds(time);
    if (endTime < 60) {
        return date.toISOString().substr(17, 2) + 's';
    }
    else if (endTime < 3600) {
        return date.toISOString().substr(14, 5);
    }
    return date.toISOString().substr(11, 8);
}


function highlightTextNodes(str, article) {

    if (!CSS.highlights) {
        return;
    }

    // reset the highlights
    CSS.highlights.clear();

    if (!str) {
        return;
    }

    // Get all text nodes
    const treeWalker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
    const allTextNodes = [];
    let currentNode = treeWalker.nextNode();
    while (currentNode) {
        allTextNodes.push(currentNode);
        currentNode = treeWalker.nextNode();
    }

    // Iterate over all text nodes and find matches.
    const ranges = allTextNodes
        .map((el) => {
            return { el, text: el.textContent.toLowerCase() };
        })
        .map(({ text, el }) => {
            const indices = [];
            let startPos = 0;
            while (startPos < text.length) {
                const index = text.indexOf(str, startPos);
                if (index === -1) break;
                indices.push(index);
                startPos = index + str.length;
            }

            // Create a range object for each instance of
            // str we found in the text node.
            return indices.map((index) => {
                const range = new Range();
                range.setStart(el, index);
                range.setEnd(el, index + str.length);
                return range;
            });
        });

    // Create a Highlight object for the ranges.
    const searchResultsHighlight = new Highlight(...ranges.flat());

    // Register the Highlight object in the registry.
    CSS.highlights.set("transcript-search-results", searchResultsHighlight);
}