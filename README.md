[![K](https://key.pics/key/K.svg?size=128) ![E](https://key.pics/key/E.svg?size=128) ![Y](https://key.pics/key/Y.svg?size=128) ![.pics](https://key.pics/key/.pics.svg?shape=wide&size=128)](https://key.pics)

# Quick, Simple, Consistent, Scalable Key & Button Icons

**Key.pics provides a simple way to create Keyboard and Mouse icons, originally intended for visualizing inputs of games and other software to their users.**

For example:  
![](https://key.pics/key/ctrl.svg?size=100&shape=wide)+![](https://key.pics/key/C.svg?size=50) to copy the selected text  
![](https://key.pics/key/ctrl.svg?size=100&shape=wide)+![](https://key.pics/key/V.svg?size=50) to paste the copied text

This repository contains the server that renders the images. The browser client lives in [KeyPics-Client](https://github.com/InventivetalentDev/KeyPics-Client).

## API

All endpoints are `GET`, allow cross-origin requests and send `Cache-Control` / `ETag` headers, so the images can be embedded directly with `<img>` or `![]()` in Markdown.

### Keyboard keys

```
https://key.pics/key/<label>[.svg|.png]
```

The label is the text on the key (URL-encoded). Without an extension an SVG is returned.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `size` | `256` | Width and height in pixels (1 to 2048). Wide keys are half as tall, tall keys half as wide. |
| `shape` | `square` | `square`, `wide` or `tall` |
| `style` | `classic` | `classic`, `flat` or `plain` |
| `color` | `#565656` | Background color as any CSS color, bare hex (`ff0000`), or the shortcuts `dark` and `light` |
| `label_color` / `labelColor` | `auto` | Label color. `auto` picks a contrasting grey. |
| `label_offset_x` / `labelOffsetX` | `0` | Horizontal label offset in pixels |
| `label_offset_y` / `labelOffsetY` | `0` | Vertical label offset in pixels |
| `font_family` / `fontFamily` / `font` | `OpenSans` | One of the families listed by `/fonts` |
| `font_style` / `fontStyle` | `Regular` | One of the styles listed by `/fonts/<family>/styles` |
| `font_size` / `fontSize` | half the smaller side | Font size in pixels |

Labels starting with `fas:`, `far:` or `fab:` render the matching [Font Awesome Free](https://fontawesome.com/icons) icon instead of text, e.g. `/key/fab:github.svg` or `/key/far:smile.svg`.

Examples:

- `https://key.pics/key/K.svg`
- `https://key.pics/key/ctrl.png?shape=wide&size=128&color=light`
- `https://key.pics/key/Esc.svg?style=plain&font=RobotoMono&fontStyle=Bold`
- `https://key.pics/key/fas:arrow-up.svg?color=%232196f3&labelColor=white`

### Mouse buttons

```
https://key.pics/mouse/<button>[.svg|.png]
```

`button` is `left` (or `primary`), `right` (or `secondary`), `middle` (or `wheel`) or `none`.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `size` | `256` | Height in pixels (1 to 2048); the width is 5/8 of it |
| `style` | `flat` | Background style |
| `color` | `#565656` | Mouse color, same formats as for keys |
| `pressed_color` / `pressedColor` | `auto` | Color of the pressed button and the outline |
| `outline` | `true` | Set to `false` to hide the button outlines |
| `label` | | Optional label drawn on the lower part of the mouse, e.g. `x2` |

The label parameters of the key endpoint (`label_color`, offsets and font settings) apply to mouse labels too.

Examples:

- `https://key.pics/mouse/left.svg?label=x2`
- `https://key.pics/mouse/right.png?size=128&pressedColor=red`

### Fonts

| Endpoint | Response |
|----------|----------|
| `GET /fonts` | JSON array of font families |
| `GET /fonts/<family>` | License text of the family |
| `GET /fonts/<family>/styles` | JSON array of the family's styles |

### Limits

Sizes are clamped to 2048 pixels, labels to 100 characters and unknown fonts, icons, colors or formats return `400`.
These limits can be changed through environment variables (see below).

## Running the server

Requires Node.js 20 or newer.

```
npm ci
npm start
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8451` | Port to listen on |
| `KEYPICS_MAX_SIZE` | `2048` | Largest accepted `size` |
| `KEYPICS_MAX_LABEL_LENGTH` | `100` | Longest accepted label |
| `KEYPICS_CACHE_MAX_BYTES` | `33554432` | Memory budget of the in-process image cache (`0` disables it) |
| `KEYPICS_CACHE_MAX_AGE` | `86400` | `max-age` (seconds) sent in `Cache-Control` for generated images |

A `Dockerfile` is included:

```
docker build -t keypics-server .
docker run -p 8451:8451 keypics-server
```

## Development

```
npm test
```

The test suite starts the server on a random port and exercises every endpoint, including the security regressions (color injection, path traversal, crashes on unknown icons).

### Adding fonts

Put the `.ttf` files into `assets/fonts/<Family>/` named `<Family>-<Style>.ttf`, together with the license as a `.txt` file. The family and style names must be alphanumeric. They are picked up on the next start.

### Adding backgrounds

Key backgrounds live in `assets/bg/key/<shape>/<style>.svg`, mouse backgrounds in `assets/bg/mouse/<style>.svg`. The server recolors elements by their `class` attribute:

| Class | Recolored with |
|-------|----------------|
| `background` | the `color` parameter |
| `light_shadow` | `color` lightened by 2% |
| `dark_shadow` | `color` darkened by 17% |
| `front_line` | stroke: `color` darkened or lightened by 50%, depending on brightness |
| `button_left`, `button_right`, `wheel` | fill: `pressed_color`, for the pressed mouse button |
| `outline` | stroke: `pressed_color` unless `outline=false` |

Backgrounds should use a `viewBox` matching the key shape (`0 0 512 512`, `0 0 1024 512` or `0 0 512 1024`; `0 0 320 512` for the mouse), the server scales them to the requested size.
