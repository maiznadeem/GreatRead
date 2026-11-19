// Scrolls so the element's top sits `offset` px below the top of the viewport (clear of the sticky header).
export function scrollToElement(id, offset = 170) {
    const element = document.getElementById(id);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
}

// Changing page swaps the book grid for a spinner and back. With scroll anchoring on, the browser keeps
// whatever sits below the grid in place and jumps the page to a seemingly random spot when the new books
// render. Pause anchoring while the grid is swapped, then scroll to the list once it has rendered.
export function pauseScrollAnchoring() {
    document.documentElement.style.overflowAnchor = "none";
}

export function scrollToListAndResumeAnchoring(id) {
    scrollToElement(id);
    setTimeout(() => {
        document.documentElement.style.overflowAnchor = "";
    }, 1000);
}
