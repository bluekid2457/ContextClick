// Get all visible text from the page
const pageText = document.body.innerText;
console.log('Extracted page text:', pageText);
chrome.storage.local.set({ pageText: pageText }, () => {
  console.log('Page text stored');
});

function replaceAllDoubleQuotes() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while (node = walker.nextNode()) {
    // Replace all occurrences of " with '
    node.nodeValue = node.nodeValue.replace(/"/g, "'");
  }
}

replaceAllDoubleQuotes();