# WebGL 2D renderer

# API

## GL2.Color([r, g, b])

Creates a new color.

Properties: `r`, `g`, and `b`; all three range from `0.0` to `1.0`.

## GL2.Texture(url)

Creates a new texture.

## GL2.loadTexture(url)

Returns a (possibly non-unique) `GL2.Texture` for the image url.

## GL2.getCurrentContext()

Returns the current `GL2.Context`.

## GL2.Context

No arguments; sets itself as the current context.

### getElement()

Returns an HTML5 element to be inserted into the page.

### use()

Sets this context as current. See `GL2.getCurrentContext()`

### resize([width, height])

Resizes the context. Must be called whenever the viewport resizes. If
width and height are ommitted, it resizes to fit the CSS-defined
element size.

### draw()

Draws each layer. This should be called once per frame.

## GL2.Layer()

Creates a new layer and adds it to the current context. Sets itself as
the contexts' current layer.

Properties:

* `z`; default `0`: the z-depth of the layer.
* `alpha`; default `1`: the transparency of the layer. Smaller values decrease
  opacity and make the layer more transparent.
  
### use()

Sets this layer as active within the current context.

## GL2.Group([options])

Used to hold multiple `GL2.Sprite`s.

Properties of the returned `Gl2.Group`:

* `position`; default `[0, 0]`: the pixel position of the group.
* `angle`; default `0`: the rotation of the group, in radians.
* `scale`; default `1`: the scale of the group.
* `z`; default `0`: the z-depth of the sprite. Ignored unless the layer it's
  in has set `sprites_use_z` to `true`.
* `alpha`; default `1`: the transparency of the group. Smaller values decrease
  opacity and make the group more transparent.

`options` can be any of the above properties, plus:

* `parent`; default `null`: the parent group or sprite.

Example:

```js
new GL2.Group({
  scale: 1.5,
  alpha: 0.5
});
```

### dirty()

Marks the group as dirty. Must be used when any of the above values have been changed.

## GL2.Sprite([options]) (extends GL2.Group)

Properties of the returned `GL2.Sprite()`:

* `size`; default `[2, 2]`: the pixel size of the sprite.
* `texture`; default `null`: the texture used for the sprite. `color`
  is used if `texture` is `null`.
* `color`; default `new GL2.Color(0, 0, 0)`: the color used for the
  sprite if `texture` is `null`.

To use a texture, do not instantiate a new `GL2.Texture`; instead,
call `GL2.loadTexture(url)` to avoid duplicate HTTP image requests.

`options` can be any of the above properties, plus:

* `url`; set the texture from this image url.

