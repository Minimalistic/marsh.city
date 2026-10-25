# STAR presenter practice run

Status: shipped

Intent: A practice mode in the STAR presenter that times a full run of the deck by slide and zoom step, optionally records audio on the device, and produces something to paste to Claude to check the timing against the script.

## Done when
- [test] "Start practice run" resets the timer and logs every slide and zoom change with its time since the start; "End run" stops it.
- [test] At the end, a summary shows the time on each slide and step, the total, and each step's word count from the notes, flagging steps far off a ~150 words-per-minute pace.
- [test] "Copy run for Claude" copies the log as text (slide, step, start, duration, words); if the clipboard fails, the text is shown selected instead.
- [test] "Record audio" asks for the mic; at the end, the recording is offered as a file to save. Nothing is uploaded anywhere.
- [test] Unhappy path: mic denied or missing → the run continues without audio, with a visible note; closing the deck window mid-run ends the run and keeps what was logged.
- [manual] Jason does one full practice run and pastes the result with the recording's path; Claude transcribes it locally and lines the words up with the steps.

## Out of scope
- Live transcription in the browser.
- Keeping runs across reloads, or comparing runs.
- Any change to the deck itself.
