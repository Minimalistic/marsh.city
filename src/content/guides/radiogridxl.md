---
title: How to use RadioGridXL
description: Open settings, change and add stations, pick a theme, and set it up for someone who just wants to press a button and hear music.
appVersion: 7.11.0
---

RadioGridXL is built for the person listening: big buttons, one per station, nothing else to figure out. Everything you can change is tucked away in a hidden settings panel, so the listener never lands there by accident.

**RadioGridXL saves your stations and settings inside the web browser you're using, on this device only.** Nothing is sent anywhere, and there's no account. If you open RadioGridXL on another phone or computer, or in a different browser, it starts fresh with its two starting stations. The same happens if you clear your browser's saved data for marsh.city, the website RadioGridXL runs on. To move a setup between devices, use [Backup and restore](#backup-and-restore). On iPhone and iPad, the Home Screen app counts as a different browser, so [add it to your Home Screen](#install-it-as-an-app) before you set it up.

## Listening

![The main screen with two large station buttons](/images/radiogridxl/guide/home.webp)

Tap a station to play it, and tap it again to pause. The dot next to the name at the top turns green while a station is playing. At the bottom of the screen there's a Stop button.

## Open settings

Settings are hidden on purpose. To open them, **tap the logo in the top corner 5 times quickly**, within about two seconds. The logo is outlined on the screenshot above.

![The settings panel, open over the station buttons](/images/radiogridxl/guide/settings-open.webp)

The panel slides in from the side. Scroll down to see everything. Most changes show up behind the panel right away, so you can see what they'll look like.

**Nothing is saved until you tap Apply & Close** at the bottom. If you close the panel with the × instead, the app asks whether to throw your changes away.

![The Apply & Close button at the bottom of settings](/images/radiogridxl/guide/apply.webp)

### If it asks for a PIN

![The PIN keypad](/images/radiogridxl/guide/pin-pad.webp)

If someone has set a PIN, five taps on the logo bring up a keypad instead. Enter the 4-digit PIN to get in. After 5 wrong tries the keypad locks for a little while, and the wait gets longer each time. See [Lock settings with a PIN](#lock-settings-with-a-pin) to set or remove one.

## Change a station's stream URL

![A station's Stream URL field in settings](/images/radiogridxl/guide/stream-url.webp)

Each station has its own block under **Audio Streams** in settings. To point a button at a different station:

1. Open settings and scroll to **Audio Streams**.
2. In that station's block, replace the **Stream URL** with the new one.
3. Change the **Label** (the big text on the button) and the **Description** (the smaller line under it) to match.
4. Tap **Apply & Close**.

The URL has to be a direct audio stream, usually starting with `https://` and often ending in `.mp3` or `.aac`. A station's website address won't work, and neither will most playlist files (`.pls`, `.m3u`). If all you have is a playlist file, open it in a text editor and copy the web address inside it.

Links that start with `http://` (no "s") won't play on this website, because browsers block them on secure pages. That includes RadioGridXL on your home screen, since it's the same website. The app shows a warning under the field when that's the case. Look for an `https://` address for the station instead.

**Volume Trim** evens out a station that's much louder or quieter than the others. 1.0 is normal, and lower numbers make that station quieter. Numbers above 1.0 only make it louder when **Max App Volume** is set below 100%. On iPhone and iPad, Volume Trim and Max App Volume don't appear: Apple doesn't let web apps change the volume, so use the side buttons.

## Add a station

You can have up to 8 stations. There are two ways to add one.

Stations are run by other people, and this app has no control over what they play. Listen to a station yourself before adding it for someone else.

### Search for a station

![The station browser with a search box and country and genre filters](/images/radiogridxl/guide/browse.webp)

1. In settings, under **Audio Streams**, tap **Browse**.
2. Search by name, or pick a country and a genre.
3. Tap a result's play button to hear it first, then tap **+ Add**.
4. Adjust the label, icon and color if you like, then tap **Apply & Close**.

The station browser searches the free, community-run [Radio Browser](https://www.radio-browser.info/) directory, so it needs an internet connection. On this website it only lists stations with secure (https://) addresses, because browsers block the others here.

### Type one in

![A new station block with a label and stream URL filled in](/images/radiogridxl/guide/add-blank.webp)

1. Under **Audio Streams**, tap **+ Add Blank**. A new block called "New Stream" appears at the bottom.
2. Fill in the **Label**, **Description** and **Stream URL**.
3. Tap **Apply & Close**.

With 5 or more stations the button text gets smaller to fit, and on a small screen buttons may show only their icon, so give every station an icon.

## Change a station's icon and color

![The row of color choices for a station](/images/radiogridxl/guide/station-look.webp)

In a station's block, tap the **Icon** box to pick an emoji, and tap a swatch under **Button Color** to color its button. There are eight colors, and all of them are readable in both light and dark themes.

## Reorder or remove stations

![The arrow and remove buttons at the top of a station's block](/images/radiogridxl/guide/reorder.webp)

Each station block has small buttons in its top corner:

- **▲ / ▼** move the station up or down. The order in settings is the order of the buttons on screen.
- **✕** removes the station. The app always keeps at least one.

## Change the theme

![The theme choices in settings](/images/radiogridxl/guide/theme.webp)

Under **Theme**, pick one:

- **Dark** or **Light**, or **Auto** to follow your device's own light or dark setting.
- **MonoRadio**: quieter grey versions of the same three, with every station the same color.
- **High Contrast**: black, white and yellow, with the most contrast and the station that's playing filled solid yellow. Good for low vision. Dark, Light or Auto.
- **Night**: dim amber on black, with no blue, for a radio by the bed. It keeps the screen from lighting up the room.

The screen behind the panel changes as soon as you tap, so you can compare. Tap **Apply & Close** to keep it.

## Make it easier to see and use

### Accessibility presets

![The accessibility preset choices](/images/radiogridxl/guide/presets.webp)

**Accessibility Preset** at the top of settings sets several options in one tap:

- **Standard**: Auto theme, Large text, with tones and vibration on.
- **Low Vision**: the High Contrast Dark theme, Ultra text, and spoken announcements. If you use VoiceOver or TalkBack, turn **Voice Announcements** off afterwards, so the app doesn't talk over your screen reader.
- **Simplest**: X-Large text with no tones, vibration or announcements.

All three use Simple controls.

Pick the closest one, then fine-tune anything below it. Once you change something by hand, the preset shows as **Custom**.

### Text size

![The text size choices](/images/radiogridxl/guide/text-size.webp)

**Text Size** has Normal, Large, X-Large and Ultra. Ultra is the largest, which suits a tablet across the room.

Further down there are more options: **Voice Announcements** (speaks "Now playing…" and so on aloud), **Audio Tones** (a short chime when playback starts or stops), **Haptic Feedback** (a small buzz on tap, on phones that support it), and **Auto-Resume** (when the app opens, starts the station again if it was playing when the app closed).

## Simple or Advanced controls

![The Advanced controls bar at the bottom of the screen](/images/radiogridxl/guide/controls.webp)

Under **Advanced Controls**:

- **Simple** shows a single Stop button. Best for most listeners.
- **Advanced** adds skip back and forward, separate Pause and Stop buttons, and a **sleep timer** (the clock button) that stops playback after 15 minutes to 4 hours.

## Lock settings with a PIN

![The Setup PIN field in settings](/images/radiogridxl/guide/set-pin.webp)

To keep anyone else out of settings, type a 4-digit PIN in **Setup PIN** and tap **Apply & Close**. From then on, five taps on the logo bring up the keypad. To remove the PIN, clear the field and apply.

Write the PIN down somewhere. If you forget it, the only way back into settings is to clear your browser's saved data for marsh.city, which also erases your RadioGridXL stations and settings.

## Backup and restore

![The Backup and Restore section](/images/radiogridxl/guide/backup.webp)

- **Export Backup** saves your stations and settings to a file.
- **Import Backup** loads a backup file, on this device or another one.

The PIN is only included if you tick **Include PIN in backup file**. Anyone with that file could get into settings, so keep it somewhere safe.

## Install it as an app

RadioGridXL can sit on your home screen like a regular app and open full screen:

- **iPhone or iPad (Safari):** tap the Share button, then **Add to Home Screen**.
- **Android (Chrome):** tap the **⋮** menu, then **Add to Home screen** or **Install app**.
- **Computer (Chrome or Edge):** click the install icon at the right end of the address bar.

On Android and on computers, the installed app keeps the same stations and settings as the browser you installed it from. On iPhone and iPad it starts fresh, so set up your stations in the Home Screen app. If you already set them up in Safari, [Backup and restore](#backup-and-restore) moves them across.
