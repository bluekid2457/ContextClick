chrome.runtime.onMessage.addListener((payload, sender, sendResponse) => {
  const { question, text } = payload;

  const GOOGLE_API_KEY = "Need to set";
  const model = "gemini-1.5-flash-latest"; // Or "gemini-1.5-flash", "gemini-1.5-pro-latest" etc.
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`;

  const prompt = `You will be given a news page. Your job is to find relevant information that may conflict with the messages in the article. Focus on specific details and see if they are accurate. The article will have either outdated or plainly wrong facts, your job is to find those. For example innacurate tariff numbers, search for current tarrif values.\
              Keep in mind that you are seeing all the text in a page and alot of stuff in the beggining and end may be ads and not related. \
    Quote the EXACT QUOTE (DO NOT CHANGE ANYTHING ABOUT THE QUOTE including adding ellipses (...) You dont need the full quote just a major section is fine) from the article and provide some alternate information from differnt sources but keep it very short 1-2 sentences each. The quote you are quotes doesnt actually have to be a quote just somethign exactly referenced from the text. Here is the strict format you are to use:\n\
    Topic: *Iran-US Nuclear Talks*\n\
    Quote: *Iran having to sit down with the US is a 'political win' for the Trump admin, says Joey Jones.*\n\
    Alternative Information: *Iran is reportedly considering an interim nuclear deal to avoid escalation and buy time for more comprehensive negotiations[1][3]. The success of these talks depends on both sides' willingness to compromise, particularly on issues like sanctions and nuclear enrichment[1][3].*\n\
    Sources: [1](https://www.axios.com/2025/04/10/iran-nuclear-deal-us-interim-agreement), [3](https://www.timesofisrael.com/iran-said-to-consider-proposing-interim-nuclear-deal-in-upcoming-talks-with-us/)\n\
    Topic: *Another Topic*\n\
    Quote: *Another line of text in the article*\n\
    Alternative Information: *Additional info here.*\n\
    Sources: [2](https://www.abc.def), [9](https://www.hdsf.com/that-is-really-cool//)\n\
    // (IMPORTANT, as a final note, do not deviate from this format for any reason) Give atleast 5 of these critiques.  \n Here is the page content:\n${text}`;

  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      maxOutputTokens: 1500,
    },
 
  };

  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody)
  })
  .then(response => {
      if (!response.ok) {
          return response.json().then(errorData => {
              console.error('Gemini API Error Response:', errorData);
              throw new Error(`HTTP error ${response.status}: ${errorData?.error?.message || response.statusText}`);
          }).catch(parseError => {
              console.error('Failed to parse error response:', parseError);
              throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
          });
      }
      return response.json();
  })
  .then(data => {
    let answer = "Sorry, couldn't get a valid answer from Gemini."; // Default message

    try {
      if (data && data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.finishReason && candidate.finishReason !== "STOP" && candidate.finishReason !== "MAX_TOKENS") {
           console.warn(`Gemini generation finished due to ${candidate.finishReason}. Safety Ratings:`, candidate.safetyRatings);
           answer = `Generation stopped: ${candidate.finishReason}. Check safety ratings or try rephrasing.`;
        } else if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
           answer = candidate.content.parts[0].text;
        } else {
           console.warn('Gemini response candidate has no content parts:', candidate);
           answer = "Gemini returned a response, but it was empty.";
        }
      } else if (data && data.promptFeedback) {
          console.warn('Gemini prompt feedback indicated potential issues:', data.promptFeedback);
          answer = `The request was blocked. Reason: ${data.promptFeedback.blockReason || 'Unknown'}. Check safety ratings.`;
          if (data.promptFeedback.blockReasonMessage) {
              answer += ` Message: ${data.promptFeedback.blockReasonMessage}`;
          }
      }
       else {
        console.warn('Unexpected Gemini API response structure:', data);
      }
    } catch (extractionError) {
        console.error('Error processing Gemini response:', extractionError, 'Data:', data);
    }

    sendResponse({ answer: answer });
  })
  .catch(error => {
    console.error('Error communicating with Google Gemini API:', error);
    const errorMessage = error.message.startsWith('HTTP error')
      ? `Gemini API Error: ${error.message}`
      : "An error occurred while communicating with Google Gemini.";
    sendResponse({ answer: errorMessage });
  });

  return true;
});