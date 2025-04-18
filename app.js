document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const keywordsTextarea = document.getElementById('keywords');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusElement = document.getElementById('status');
    const transcriptElement = document.getElementById('transcript');
    const detectedElement = document.getElementById('detected');

    // Speech recognition setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

    if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
        startBtn.disabled = true;
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Text to speech setup
    const speech = new SpeechSynthesisUtterance();
    speech.lang = 'en-US';
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;

    // Variables
    let isListening = false;
    let keywordsArray = [];
    let alertTimeout = null;

    // Trigger alert when keyword is detected
    function triggerAlert(keyword) {
        console.log('Triggering alert for:', keyword);

        // Clear any existing timeout
        if (alertTimeout) {
            clearTimeout(alertTimeout);
        }

        // Stop listening while announcing
        recognition.stop();
        isListening = true; // Keep track that we should resume after

        // Visual alert
        document.body.classList.add('alert');

        // Update detected keyword display
        detectedElement.textContent = `Detected: ${keyword}`;

        // Text to speech alert
        speech.text = `${keyword} detected, summoning ${keyword}`;

        // Handle speech end event
        speech.onend = () => {
            console.log('Speech ended, resetting alert');
            resetAlert();
        };

        try {
            window.speechSynthesis.cancel(); // Cancel any ongoing speech
            window.speechSynthesis.speak(speech);
        } catch (e) {
            console.error('Speech synthesis error:', e);
            resetAlert();
        }
    }

    // Function to reset the alert state
    function resetAlert() {
        console.log('Resetting alert state');
        document.body.classList.remove('alert');
        detectedElement.textContent = '';
        window.speechSynthesis.cancel();

        // Clear any pending timeouts
        if (alertTimeout) {
            clearTimeout(alertTimeout);
        }

        // Resume listening if we were listening before
        if (isListening) {
            setTimeout(() => {
                recognition.start();
            }, 500); // Small delay before resuming listening
        }
    }

    // Calculate Levenshtein distance for fuzzy matching
    function levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];

        // Initialize matrix
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill matrix
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                const cost = a[j - 1] === b[i - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // deletion
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }

        return matrix[b.length][a.length];
    }

    // Updated keyword matching function with more lenient fuzzy matching and word combining
    function findKeyword(text) {
        if (!text) return null;
        text = text.toLowerCase();

        // First try exact match
        // for (const keyword of keywordsArray) {
        //     if (text.includes(keyword.toLowerCase())) {
        //         console.log('Found exact keyword:', keyword);
        //         return keyword;
        //     }
        // }

        // Remove spaces and try exact match again (for combined words)
        // const noSpaceText = text.replace(/\s+/g, '');
        // for (const keyword of keywordsArray) {
        //     const noSpaceKeyword = keyword.toLowerCase().replace(/\s+/g, '');
        //     if (noSpaceText.includes(noSpaceKeyword)) {
        //         console.log('Found combined word match:', keyword);
        //         return keyword;
        //     }
        // }

        // Try fuzzy matching with combined words and individual words
        const words = text.split(/\s+/);

        // Try combinations of consecutive words
        for (let i = 0; i < words.length; i++) {
            for (let j = i + 1; j <= Math.min(i + 3, words.length); j++) {
                const combinedWord = words.slice(i, j).join('');

                for (const keyword of keywordsArray) {
                    if (keyword.length < 3) continue; // Skip short keywords

                    const noSpaceKeyword = keyword.toLowerCase().replace(/\s+/g, '');
                    const distance = levenshteinDistance(combinedWord, noSpaceKeyword);
                    const maxDistance = Math.floor(Math.max(noSpaceKeyword.length, combinedWord.length) * 0.3); // threshold

                    if (distance <= maxDistance) {
                        console.log('Found fuzzy combined match:', combinedWord, 'matches', keyword, 'with distance', distance);
                        return keyword;
                    }
                }
            }
        }


        // Try individual word fuzzy matching with more lenient threshold
        // for (const word of words) {
        //     if (word.length < 3) continue; // Skip short words

        //     for (const keyword of keywordsArray) {
        //         if (keyword.length < 3) continue; // Skip short keywords

        //         const distance = levenshteinDistance(word.toLowerCase(), keyword.toLowerCase());
        //         const maxDistance = Math.floor(Math.max(keyword.length, word.length) * 0.4); // 40% threshold

        //         if (distance <= maxDistance) {
        //             console.log('Found fuzzy match:', word, 'matches', keyword, 'with distance', distance);
        //             return keyword;
        //         }
        //     }
        // }

        return null;
    }

    // Start voice recognition
    function startListening() {
        // Parse keywords
        keywordsArray = keywordsTextarea.value
            .split('\n')
            .map(k => k.trim())
            .filter(k => k.length > 0);

        if (keywordsArray.length === 0) {
            alert('Please enter at least one keyword');
            return;
        }

        console.log('Keywords loaded:', keywordsArray); // Debug logging

        isListening = true;
        recognition.start();

        statusElement.textContent = 'Listening...';
        startBtn.disabled = true;
        stopBtn.disabled = false;
    }

    // Stop voice recognition
    function stopListening() {
        isListening = false;
        recognition.stop();
        resetAlert();

        statusElement.textContent = 'Not listening';
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }

    // Event listeners
    startBtn.addEventListener('click', startListening);
    stopBtn.addEventListener('click', stopListening);

    // Speech recognition events
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.trim();

            if (event.results[i].isFinal) {
                finalTranscript += transcript;
                console.log('Final transcript:', finalTranscript); // Debug logging

                // Check for keywords in the final transcript
                const matchedKeyword = findKeyword(finalTranscript);
                if (matchedKeyword) {
                    console.log('Keyword match found:', matchedKeyword); // Debug logging
                    triggerAlert(matchedKeyword);
                }
            } else {
                interimTranscript += transcript;
            }
        }

        transcriptElement.textContent = interimTranscript || finalTranscript;
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        statusElement.textContent = `Error: ${event.error}`;
        stopListening();
    };

    recognition.onend = () => {
        if (isListening) {
            // If we're still supposed to be listening, restart
            recognition.start();
        }
    };

    // Initialize with some example keywords
    keywordsTextarea.value = "dragon\ngoblin\nbeholder\nlich\nwizard\norcs\ntroll";
});