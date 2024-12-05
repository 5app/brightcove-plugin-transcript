# Brightcove Transcript Plugin

When `loadeddata` Event is fired, this inspects the Brightcove metadata for the presence of a `transcript` prop. If found it adds a toggle button to the VideoJS ControlBar and populates a dialog box with the content of the transcript.

See demo https://5app.github.io/brightcove-plugin-transcript/

# Development

This script is based upon the guide https://player.support.brightcove.com/coding-topics/step-step-plugin-development.html.

## Attach to a player

This is the process for adding a Custom Plugin to a Video player - [guide](https://player.support.brightcove.com/coding-topics/step-step-plugin-development.html#Deploy_the_plugin)

- Go to a [Video Player](https://studio.brightcove.com/products/videocloud/players/) and go to "Plugins", create a new plugin.
- Use the name Plugin Name `displayBCTranscript`
- Use the github page sources as the Brightcove Plugin resource URLs
   - `https://5app.github.io/brightcove-plugin-transcript/src/plugin.js`
   - `https://5app.github.io/brightcove-plugin-transcript/src/plugin.css`
- Save + Publish