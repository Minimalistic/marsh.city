---
title: How to use RadioGridXL
description: Open settings, change and add stations, pick a theme, and set it up for someone who just wants to press a button and hear music.
appVersion: 7.23.5
---

RadioGridXL is built for the person listening: big buttons, one per station, nothing else to figure out. Everything you can change is tucked away in a hidden settings panel, so the listener never lands there by accident.

**RadioGridXL saves your stations and settings inside the web browser you're using, on this device only.** Nothing is sent anywhere, and there's no account. If you open RadioGridXL on another phone or computer, or in a different browser, it starts fresh with its two starting stations. The same happens if you clear your browser's saved data for marsh.city, the website RadioGridXL runs on. To move a setup between devices, use [Backup and restore](#backup-and-restore). On iPhone and iPad, the Home Screen app counts as a different browser, so [add it to your Home Screen](#install-it-as-an-app) before you set it up.

## Listening

![The main screen with two large station buttons](/images/radiogridxl/guide/home.webp)

Tap a station to play it, and tap it again to pause. The dot in the top right corner turns green while a station is playing. At the bottom of the screen there's a Stop button.

## Open settings

To open settings, tap **Settings** in the top corner. The button is outlined on the screenshot above.

If there is no Settings button, it has been hidden: tap the logo in the top corner 5 times quickly instead. See [Hide the Settings button](#hide-the-settings-button).

![The settings panel, open over the station buttons](/images/radiogridxl/guide/settings-open.webp)

The panel slides in from the side. It has four groups: **Stations**, **Look**, **Sound and controls** and **Setup**. Scroll to see them all. Most changes show up behind the panel right away, so you can see what they'll look like, and when one tap changes other settings too (a preset, say), those settings light up briefly so you can see what moved.

**Nothing is saved until you tap Apply & Close**, which stays pinned at the bottom of the panel (on a phone turned sideways, at the top next to Preview). If you close the panel with the × instead, the app asks whether to throw your changes away.

![The Apply & Close button pinned at the bottom of settings](/images/radiogridxl/guide/apply.webp)

If settings sit untouched for 3 minutes, the app asks **Still setting up?** Tap anywhere on it to carry on. If nobody taps within 30 seconds, settings close and go back to the stations, and changes you haven't applied are thrown away, so the listener is never left looking at settings. A station that was playing keeps playing, and a paused one stays paused. The PIN keypad closes by itself after a minute with no tap.

### If it asks for a PIN

![The PIN keypad](/images/radiogridxl/guide/pin-pad.webp)

If someone has set a PIN, opening settings brings up a keypad instead. Enter the 4-digit PIN to get in. After 5 wrong tries the keypad locks for a little while and counts down the seconds, and the wait gets longer each time. See [Lock settings with a PIN](#lock-settings-with-a-pin) to set or remove one.

## Change a station's stream URL

![A station opened in settings, with its stream address field](/images/radiogridxl/guide/stream-url.webp)

Each station has a row under **Stations**, at the top of settings. Tap a row to open that station's details under it, and tap it again to close them. To point a button at a different station:

1. Open settings and tap the station under **Stations**.
2. Replace the **Stream address** with the new one.
3. Change the **Name** (the big text on the button) and the **Description** (the smaller line under it) to match.
4. Tap **Apply & Close**.

The URL has to be a direct audio stream, usually starting with `https://` and often ending in `.mp3` or `.aac`. A station's website address won't work, and neither will most playlist files (`.pls`, `.m3u`). If all you have is a playlist file, open it in a text editor and copy the web address inside it.

Links that start with `http://` (no "s") won't play on this website, because browsers block them on secure pages. That includes RadioGridXL on your home screen, since it's the same website. The app shows a warning under the field when that's the case. Look for an `https://` address for the station instead.

**Volume Trim** evens out a station that's much louder or quieter than the others. 1.0 is normal, and lower numbers make that station quieter. Numbers above 1.0 only make it louder when **Volume**, under **Sound and controls**, is set below 100%. On iPhone and iPad, Volume Trim and the Volume slider don't appear: Apple doesn't let web apps change the volume, so use the side buttons.

## Add a station

You can have up to 8 stations. There are two ways to add one. Removed one by mistake? Tap **Undo** right after.

Stations are run by other people, and this app has no control over what they play. Listen to a station yourself before adding it for someone else.

### Find a station

![The station browser opening on six shelves: Calm & easy, Oldies, Classical, Jazz, News & talk and Sleep](/images/radiogridxl/guide/browse.webp)

1. In settings, under **Stations**, tap **Browse stations**.
2. Tap a shelf, such as **Jazz** or **Sleep**, for a short list of hand-picked stations. Or tap a mood, such as **Relaxing** or **News & talk**, to search the directory for that kind of station. You can also search by name, or pick a country (then a state or region, if you like) and tap **Search**; a mood narrows those searches too.
3. Tap a station's play button to hear it first, then tap **+ Add**. It changes to **Added**, and you can add more from the same list. A station that's already on this radio says **Added** too. Close the browser when you're done.
4. Each station arrives with a short name, an icon for its kind of music, a one-line description and a color no other station has. Change any of them if you like, then tap **Apply & Close**.

The shelf stations are checked before each release of the app. Searches go to the free, community-run [Radio Browser](https://www.radio-browser.info/) directory, so they need an internet connection. Each station is listed once, and stations failing the directory's own check are left out. On this website the browser only lists stations with secure (https://) addresses, because browsers block the others here.

### Type one in

![A new station with its name and stream address filled in](/images/radiogridxl/guide/add-blank.webp)

1. Under **Stations**, tap **Add by address**. A new station called "New Stream" opens at the bottom, ready for its address.
2. Fill in the **Stream address**, **Name** and **Description**. The address has to start with https:// (or http://).
3. Tap **Apply & Close**. If a station has no address, or one that doesn't start that way, settings stays open and says which one to fix.

With 5 or more stations the button text gets smaller to fit, and on a small screen buttons may show only their icon, so give every station an icon.

## Change a station's icon and color

![The row of color choices for a station](/images/radiogridxl/guide/station-look.webp)

Open a station's row, then tap the **Icon** box to pick an emoji, and tap a swatch under **Button Color** to color its button. There are eight colors, and all of them are readable in both light and dark themes.

## Reorder or remove stations

![The Move up, Move down and Remove buttons under an open station](/images/radiogridxl/guide/reorder.webp)

Open a station's row. Under its details are three buttons:

- **Move up** and **Move down** move the station. It slides to its new place, and the order in settings is the order of the buttons on screen.
- **Remove** removes the station, with an **Undo** right after. The app always keeps at least one.

## Change the theme

![The theme choices in settings](/images/radiogridxl/guide/theme.webp)

Under **Look**, **Theme** shows four looks, each drawn like a small station button. Pick one, then **Dark**, **Light** or **Auto** (Auto follows your device's own light or dark setting, and switches to High Contrast when the device is set to increase contrast):

- **Classic**: the standard colors, with each station its own color.
- **MonoRadio**: quieter grey versions, with every station the same color.
- **High Contrast**: black, white and yellow, with the most contrast and the station that's playing filled solid yellow. Good for low vision.
- **Night**: dim amber on black, with no blue, for a radio by the bed. It keeps the screen from lighting up the room. Night has no Dark or Light, so those switch off.

The screen behind the panel changes as soon as you tap, so you can compare. Tap **Apply & Close** to keep it.

## Make it easier to see and use

### Accessibility presets

![The accessibility preset choices](/images/radiogridxl/guide/presets.webp)

**Starting point**, at the top of **Look**, sets several options in one tap:

- **Standard**: Auto theme, Large text, with tones and vibration on.
- **Low Vision**: the High Contrast Dark theme, Ultra text, and spoken announcements. If you use VoiceOver or TalkBack, turn **Voice announcements** off afterwards, so the app doesn't talk over your screen reader.
- **Simplest**: X-Large text with no tones, vibration or announcements.

All three use Simple controls.

Pick the closest one, then fine-tune anything below it. Once you change something by hand, the preset shows as **Custom**.

### Text size

![The text size choices](/images/radiogridxl/guide/text-size.webp)

**Text size** has Normal, Large, X-Large and Ultra, each showing how big it is. Ultra is the largest, which suits a tablet across the room.

### Zoom

**Allow pinch to zoom**, at the end of **Look**, lets the listener pinch the screen to make everything bigger, for anyone who zooms in to read. It's off unless you turn it on, so a hand that pinches by accident can't leave the radio zoomed in. The zoom built into the phone or tablet itself (Zoom on iPhone and iPad, Magnification on Android) works either way.

Under **Sound and controls** are switches: **Voice announcements** (speaks "Now playing…" and so on aloud), **Audio tones** (a short chime when playback starts or stops), **Auto-resume** (when the app opens, starts the station again if it was playing when the app closed) and **Haptic feedback** (a small buzz on tap, on Android phones and tablets only; elsewhere it's greyed out with the reason).

### Use it by voice

Someone who can't touch the screen can run the radio by speaking, with the Voice Control built into iPhone, iPad and Mac. Whoever sets the radio up turns it on: on an iPhone or iPad, **Settings › Accessibility › Voice Control**; on a Mac, **System Settings › Accessibility › Voice Control**. It needs the device's microphone, and it listens on the device.

The surest way is by number. On an iPhone or iPad, also turn on **Voice Control › Overlay › Item Numbers**: every button then keeps a small number beside it, and "Tap 2" presses button 2, whatever it's called. On a Mac, say "Show numbers" first, then the number.

Numbers and names on screen need sight. For a listener who can't see the screen, use VoiceOver (**Settings › Accessibility › VoiceOver**), which reads each station and button aloud.

Buttons can also be pressed by what they show:

- "Tap" and a station's full name, such as "Tap Jazz 88", plays it. While a station is paused, use its number to resume it.
- "Tap Stop" stops the station. With Advanced controls, "Tap Pause", "Tap Sleep", and for recordings "Tap Back 15" and "Tap Skip 30".
- "Tap Settings" opens settings, unless the Settings button has been hidden.
- "Show names" labels every button with what to say.

For saying stations by name, give each one a short name that's easy to say and different from the others. Settings warns when two stations share a name, or when a station is named like a button, such as Stop.

## Simple or Advanced controls

![The Advanced controls bar at the bottom of the screen](/images/radiogridxl/guide/controls.webp)

Under **Buttons while playing**, in **Sound and controls**:

- **Simple** shows a single Stop button. Best for most listeners.
- **Advanced** adds separate Pause and Stop buttons and a **sleep timer** (the clock button, labelled Sleep) that stops playback after 15 minutes to 4 hours. **Back 15** and **Skip 30** show up only for recordings with a set length, not live radio.

## Lock settings with a PIN

![The Setup PIN field in settings](/images/radiogridxl/guide/set-pin.webp)

To keep anyone else out of settings, type a 4-digit PIN in **Setup PIN**, under **Setup**, and tap **Apply & Close**. From then on, opening settings brings up the keypad. To remove the PIN, clear the field and apply.

Write the PIN down somewhere. If you forget it, the only way back into settings is to clear your browser's saved data for marsh.city, which also erases your RadioGridXL stations and settings.

## Hide the Settings button

![The Show a Settings button switch in settings, turned off](/images/radiogridxl/guide/hide-button.webp)

Once the radio is set up, you can hide the Settings button, so the listener can't open settings by mistake and change things. Turn off **Show a Settings button** at the top of **Setup**.

![The practice step: a logo to tap five times before the button is hidden](/images/radiogridxl/guide/hide-practice.webp)

The radio first asks you to practise the way back in. **Tap the logo it shows 5 times quickly.** When it says **Got it**, tap **Done**, then **Apply & Close**. If the taps are hard to do, tap **Cancel** and keep the button.

With the button hidden, open settings by **tapping the logo in the top corner 5 times quickly**, within about two seconds. To bring the button back, open settings that way and turn the switch on again.

Five quick taps are hard with a switch, by voice or with a screen reader. For someone who sets up their own radio that way, leave the button showing and use a PIN instead.

A radio that was set up before the Settings button existed keeps its settings behind the logo until someone turns the switch on.

## Backup and restore

![The Backup section](/images/radiogridxl/guide/backup.webp)

- **Export Backup** saves your stations and settings to a file.
- **Import Backup** loads a backup file, on this device or another one.

The PIN is only included if you tick **Include the PIN**. Anyone with that file could get into settings, so keep it somewhere safe.

## Install it as an app

RadioGridXL can sit on your home screen like a regular app and open full screen:

- **iPhone or iPad (Safari):** tap the Share button, then **Add to Home Screen**.
- **Android (Chrome):** tap the **⋮** menu, then **Add to Home screen** or **Install app**.
- **Computer (Chrome or Edge):** click the install icon at the right end of the address bar.

On Android and on computers, the installed app keeps the same stations and settings as the browser you installed it from. On iPhone and iPad it starts fresh, so set up your stations in the Home Screen app. If you already set them up in Safari, [Backup and restore](#backup-and-restore) moves them across.

## Send us feedback

At the bottom of settings, **Have feedback?** shows a code you can scan with your phone's camera. It opens a short page with an **Email us** button, so you can tell us what was confusing from your own phone, even when the radio's device can't send email. The page address and our email, radio@marsh.city, are written beside the code too. The radio itself never sends anything about you or your listening.
