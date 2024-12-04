# Brightcove Transcript Plugin

When `loadeddata` Event is fired, this inspects the Brightcove metadata for the presence of a `transcript` prop. If found it makes adds a toggle button to the VideoJS ControlBar and populates a dialog box with the content of the transcript.

# Development

This script is based upon the guide https://player.support.brightcove.com/coding-topics/step-step-plugin-development.html.

## Attach to a player

- Follow [Deploy the plugin](https://player.support.brightcove.com/coding-topics/step-step-plugin-development.html#Deploy_the_plugin) to add the player.
- Use the name Plugin Name `displayBCTranscript`
- Use the github page sources as the Brightcove Plugin resource URLs
   - `https://5app.github.io/brightcove-plugin-transcript/src/plugin.js`
   - `https://5app.github.io/brightcove-plugin-transcript/src/plugin.css`
- Publish