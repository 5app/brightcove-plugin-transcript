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
    transcriptEl.className = 'vjs-transcript';
    transcriptEl.innerHTML = '<header></header>';
    playerEl.appendChild(transcriptEl);

    /** Scroll to button */
    const scrollToEl = document.createElement('button');
    scrollToEl.classList.add('vjs-icon-chapters');
    scrollToEl.setAttribute('title', 'Scroll to current');
    scrollToEl.onclick = function() {
        const activeEl = document.querySelector('.vjs-transcript a.active');
        if (activeEl) {
            activeEl.scrollIntoView({behavior: 'smooth', block: 'center'});
        }
    };
    transcriptEl.querySelector('header').appendChild(scrollToEl);

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

    /** List */
    const listEl = document.createElement('ol');
    transcriptEl.appendChild(listEl);

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

        listEl.innerHTML = '<ol role="menu">'+formattedItems.map(({start_time, end_time, content}) => {
            return `<li role="menuitem"><a href="javascript: void();" data-start-time="${start_time}" data-end-time="${end_time}"><time datetime="${start_time}">${formatTime(start_time, end_time)}</time> ${content}</a></li>`;
        }).join('') + '</ol>';

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
            document.querySelectorAll('.vjs-transcript a').forEach((el) => {
                const startTime = el.getAttribute('data-start-time');
                const endTime = el.getAttribute('data-end-time');
                if (player.currentTime() >= startTime && player.currentTime() <= endTime) {
                    el.classList.add('active');
                    if (!transcriptEl.matches(':hover')) {
                        // using scrollIntoView block=center caused a buggy layout shift
                        el.scrollIntoView({behavior: 'smooth', block: 'nearest'});
                    }
                }
                else {
                    el.classList.remove('active');
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