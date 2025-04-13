function annotateQuote(quote, noteText) {
    const iterator = document.createNodeIterator(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,

    );
  
    let textNode;
    while ((textNode = iterator.nextNode())) {

        if (textNode.parentNode.nodeName === 'SCRIPT' || textNode.parentNode.nodeName === 'STYLE' || textNode.parentNode.classList.contains('highlighted-quote') || textNode.parentNode.classList.contains('quote-note')) {
            continue;
        }
  
        const pos = textNode.nodeValue.indexOf(quote);
        if (pos !== -1) {
            try {
                const range = document.createRange();
                range.setStart(textNode, pos);
                range.setEnd(textNode, pos + quote.length);
  
                const span = document.createElement('span');
                span.className = 'highlighted-quote';
   
                span.dataset.note = noteText;
                range.surroundContents(span); 
  
                const noteBox = document.createElement('div');
                noteBox.className = 'quote-note'; 
                noteBox.textContent = noteText;
  
                document.body.appendChild(noteBox);
                
                
  

span.addEventListener('click', function(event) {

    event.stopPropagation();

    const clickX = event.pageX;
    const clickY = event.pageY;
    
    noteBox.style.top = (clickY - 150) + "px";
    noteBox.style.left = (clickX + 5) + "px";
  

    noteBox.classList.toggle('visible');
  });

                break;
  
            } catch (e) {
                console.error("Error surrounding contents:", e, " Text node:", textNode.nodeValue, " Quote:", quote);

            }
        }
    }
  }
  
  function insertAnnotationStyles() {
    const styleId = 'annotation-styles';
    if (document.getElementById(styleId)) {
        return;
    }
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .highlighted-quote {
        background-color: yellow;
        cursor: pointer;
        /* position: relative; /* Only needed if positioning note absolutely */
      }
      .quote-note {
  position: absolute;  /* Removes the element from the document flow */
  display: none;       /* Hidden by default; toggle visibility on click */
  border: 2px solid #006D5B;
  background-color: rgba(240,240,240,0.9); /* slightly opaque background */
  padding: 5px;
  font-size: 90%;
  max-width: 250px;
  z-index: 1000;
  border-radius: 10px;
  box-shadow: 0px 0px 5px 2px rgba(70, 130, 118, 255);
}
.quote-note.visible {
  display: block; /* Show when toggled */
}

    `;
    document.head.appendChild(style);
  }
  insertAnnotationStyles();
  console.log("Annotate.js script is running"); 
//   annotateQuote("few weeks", 'Ensure it appears on top if overlapping Ensure it appears on top if overlapping Ensure it appears on top if overlapping Ensure it appears on top if overlapping\n Ensure it appears on top if overlapping');
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message:", message); 
    if (message.type === "annotateQuote") {
        me = message.quote.trim();
        m = me.substring(1, me.length-1);;
        console.log("Quote to annotate:", m); 
      annotateQuote(m, message.noteText);
      sendResponse({ status: "annotated" });
    }
  });
  