# D&D Voice Recognition App

This application listens to your voice and detects when you speak any of the keywords you've specified. When a keyword is detected, the screen will turn red and a voice will announce the detection.

## Features

- Specify your own keywords in a text area
- Voice recognition listens continuously
- Detects exact matches and similar words (fuzzy matching)
- Visual alert (screen turns red) when keywords are detected
- Audio alert using text-to-speech

## How to Use

1. Open `index.html` in a web browser (Chrome or Edge recommended)
2. Enter your keywords in the text area (one per line)
3. Click "Start Listening"
4. Speak and watch as the app detects your keywords
5. Click "Stop Listening" when you're done

## Requirements

- Modern web browser with support for the Web Speech API
- Internet connection (for speech recognition)
- Microphone access (you'll be prompted to allow this)

## Browser Compatibility

This app works best in:
- Google Chrome
- Microsoft Edge
- Safari (limited support)

Firefox and other browsers may not fully support the Web Speech API required for this application.

## Permissions

When you first start the application, your browser will ask for permission to use your microphone. You must allow this for the voice recognition to work.