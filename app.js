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

    // Fuzzy matching function
    function findSimilarKeyword(word) {
        if (!word || word.length < 3) return null;

        word = word.toLowerCase();

        // Check for exact match first
        if (keywordsArray.includes(word)) {
            return word;
        }

        // Check for fuzzy matches
        for (const keyword of keywordsArray) {
            // Skip short keywords for fuzzy matching (to avoid false positives)
            if (keyword.length < 3) continue;

            const distance = levenshteinDistance(keyword, word);
            const threshold = Math.min(2, Math.floor(keyword.length / 3));

            if (distance <= threshold) {
                return keyword;
            }
        }

        return null;
    }

    // Start voice recognition
    function startListening() {
        // Parse keywords
        keywordsArray = keywordsTextarea.value
            .split('\n')
            .map(k => k.trim().toLowerCase())
            .filter(k => k.length > 0);

        if (keywordsArray.length === 0) {
            alert('Please enter at least one keyword');
            return;
        }

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

        statusElement.textContent = 'Not listening';
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }

    // Trigger alert when keyword is detected
    function triggerAlert(keyword) {
        // Clear any existing timeout
        if (alertTimeout) {
            clearTimeout(alertTimeout);
        }

        // Visual alert
        document.body.classList.add('alert');

        // Update detected keyword display
        detectedElement.textContent = `Detected: ${keyword}`;

        // Text to speech alert
        speech.text = `${keyword} has been detected! Summoning ${keyword}`;
        window.speechSynthesis.speak(speech);

        // Reset alert after 3 seconds
        alertTimeout = setTimeout(() => {
            document.body.classList.remove('alert');
        }, 3000);
    }

    // Event listeners
    startBtn.addEventListener('click', startListening);
    stopBtn.addEventListener('click', stopListening);

    // Speech recognition events
    recognition.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.trim();

            if (event.results[i].isFinal) {
                // Process final results
                const words = transcript.toLowerCase().split(/\s+/);

                for (const word of words) {
                    const matchedKeyword = findSimilarKeyword(word);
                    if (matchedKeyword) {
                        triggerAlert(matchedKeyword);
                    }
                }
            } else {
                interimTranscript += transcript;
            }
        }

        transcriptElement.textContent = interimTranscript;
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
