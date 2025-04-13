function parseTextToJSON(text) {
    console.log("Parsing text to JSON:", text); 

    const topics = text.split("Topic:").slice(1);
    
    const result = topics.map(topic => {
      console.log("Processing topic:", topic);
      const lines = topic.trim().split("\n");
      const title = lines[0].trim();
      console.log("Title:", title); 
  

      const quoteLine = lines.find(line => line.includes("Quote:"));
      const q = quoteLine 
        ? quoteLine.substring(quoteLine.indexOf("Quote:") + "Quote:".length).trim()
        : "";
      q2 = q.replace("*",''); 
      q3 = q2.replace('"', "'"); 
      const quote = q3.slice(3,-9);
      console.log("Quote:", quote);
  
      const altLine = lines.find(line => line.includes("Alternative Information:"));
      const alternativeInformation = altLine 
        ? altLine.substring(altLine.indexOf("Alternative Information:") + "Alternative Information:".length).trim()
        : "";
      console.log("Alternative Information:", alternativeInformation); // Debugging line
  

      const sourcesLine = lines.find(line => line.includes("Sources:")) || "";
      console.log("Sources Line:", sourcesLine); // Debugging line
      let sources = [];
      const sourceMatches = sourcesLine.match(/\[.*?\]\((.*?)\)/g);
      if (sourceMatches) {
        sources = sourceMatches.map(source => {
          const linkMatch = source.match(/\((.*?)\)/);
          return linkMatch ? linkMatch[1] : "";
        });
      }
      console.log("Sources:", sources);
  
      const ret = {
        topic: title,
        quote: quote,
        alternativeInformation: alternativeInformation,
        sources: sources
      };
      console.log("Parsed JSON object:", ret); 
      return ret;
    });
    
    return result;
  }
  
  // Example usage:
//   const textData = `
//   ## Topic: Trump's Proposal for Gaza
//   Quote: "U.S. President Donald Trump has proposed that the United States 'take over' and 'own' the Gaza Strip, suggesting long-term control after the ongoing conflict."
//   Alternative Information: This proposal has been met with widespread criticism, including from Amnesty International, which views it as a violation of international law and potentially a crime against humanity[3]. The Reform Leadership also condemned the plan, highlighting its potential to undermine Palestinian self-determination and regional stability[2].
//   Sources: [1](https://www.ajc.org/news/what-is-trumps-proposal-for-gaza), [2](https://urj.org/press-room/reform-leadership-responds-president-trumps-recent-comments-gaza), [3](https://www.amnesty.org/en/latest/news/2025/02/israel-opt-president-trumps-claim-that-us-will-take-over-gaza-and-forcibly-deport-palestinians-appalling-and-unlawful/)
  
//   ## Topic: Arab Leaders' Response
//   Quote: "Egypt, Jordan, and Saudi Arabia are on the forefront of the opposition."
//   Alternative Information: These countries have rejected Trump's plan due to concerns about regional stability and the rights of Palestinians. Egypt's rejection is also linked to preserving its peace treaty with Israel and maintaining national security[4]. Saudi Arabia has emphasized its support for a Palestinian state, which contrasts with Trump's proposals[4].
//   Sources: [4](https://carnegieendowment.org/emissary/2025/02/trump-gaza-plan-displacement-egypt-jordan-saudi-response?lang=en)
  
//   ## Topic: Impact on Regional Stability
//   Quote: "Displacement plans in Gaza and annexation plans in the West Bank will only create more violence, instability, and human suffering in the Middle East."
//   Alternative Information: The proposed displacement could exacerbate economic and security challenges in countries like Jordan, which already faces significant refugee pressures and economic strain[4]. Additionally, such plans could undermine U.S. alliances with Arab states by appearing to support Israeli annexation efforts[4].
//   Sources: [4](https://carnegieendowment.org/emissary/2025/02/trump-gaza-plan-displacement-egypt-jordan-saudi-response?lang=en)
//   `;
  
// console.log(JSON.stringify(parseTextToJSON(textData), null, 2));
document.addEventListener('DOMContentLoaded', () => {
    const debugDiv = document.createElement('div');
    debugDiv.id = 'debug';
    debugDiv.style = 'margin-top: 20px; font-size: 12px; color: gray; white-space: pre-wrap;';
    document.body.appendChild(debugDiv);

    const  logToPopup = (message) => {
        const debugElement = document.getElementById('debug');
        debugElement.textContent += `${message}\n`;
    };
    console.log('popup.js script is running'); 

    annotations = {};
    document.getElementById('askButton').addEventListener('click', async () => {
        // logToPopup('Button clicked'); // Debugging line to check if the button is clicked
        console.log('Button clicked'); // Console log for debugging
        // Retrieve the user question

        // Retrieve stored page text from the content script
        // logToPopup('Attempting to retrieve pageText from chrome.storage.local');
        chrome.storage.local.get('pageText', async (result) => {
            const pageText = result.pageText ?? "No text found on page.";

            // Prepare the payload for Gemini
            const payload = {
                question: "NA",
                text: pageText
            };
            // Send a message to the background script to call the API
            chrome.runtime.sendMessage(payload, (response) => {
                const answer = response.answer || 'No answer received.';
                const sources = response.sources || 'No sources available.';
    
                annotations = parseTextToJSON(answer);
                console.log(JSON.stringify(annotations, null, 2));
              
        console.log("Done doing stuff gonna annotate now");

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                console.error('Error retrieving tab:', chrome.runtime.lastError);
                return;
            }
        
            if (!tabs || tabs.length === 0 || typeof tabs[0].id !== 'number') {
                console.error('No active tab found or invalid tab ID.');
                return;
            }
        
            const tabId = tabs[0].id;
            console.log('Tab ID:', tabId);
        
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabId },
                    files: ["annotate.js"] 
                },
                () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error injecting content script:', chrome.runtime.lastError);
                    } else {
                        console.log('Content script injected successfully.');
                        
                        for (i in annotations){
                            q = annotations[i].quote;

                            alternativeInfo = annotations[i].alternativeInformation;
     
                            chrome.tabs.sendMessage(
                                tabId,
                                { type: "annotateQuote", quote: q, noteText: alternativeInfo },
                                (response) => {
                                    if (chrome.runtime.lastError) {
                                        console.error('Error sending message:', chrome.runtime.lastError);
                                    } else {
                                        console.log('Annotation response:', response);
                                    }
                                }
                            );
                        }

                        
                    }
                }
            );
        });
    

        
            });
        });
        
    });
});