# View background

Status: approved

Intent: marsh.city should have a "view background" control you can click or tap to hide everything else, with the audio option suggested too.

## Done when
- [smoke] "View background" in the nav menu hides the nav, page content and footer text; the foliage, stars and fireflies stay, and scrolling still pans the scene.
- [smoke] While viewing, a small control bar offers "Back to page" and the site sound toggle; turning sound on there is the same setting as the menu's Sound item.
- [test] Esc, or "Back to page", restores the page at the same scroll position, with focus returned to the menu button.
- [test] While viewing, the hidden page can't be tabbed into or read by a screen reader (inert); the control bar can.
- [test] Unhappy path: on a page too short to scroll, entering and leaving still works and nothing throws (smoke test console check).
- [manual] On the phone it looks good and is easy to get out of.

## Out of scope
- Remembering "viewing" across page loads or links.
- Auto-hiding the control bar, a fullscreen API call, or a keyboard shortcut.
- Any change to the scene itself (layers, parallax math, change 2).
