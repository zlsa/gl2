
var GL2 = {};

// LOGGING

GL2.trace  = function(message) {
  console.log('GL2:', message);
};

GL2.log  = function(message) {
  console.log('GL2:', message);
};

GL2.warn = function(message) {
  console.log('GL2:', message);
};

// TIME
GL2.time = function() {
  return new Date().getTime() * 0.001;
};

GL2.start_time = GL2.time();

// ERRORS
GL2.Error = function(message) {
  return 'GL2 error: ' + message;
}

// SPRITE SHADERS

GL2.shader = {};

GL2.shader.sprite_vertex = [
  'precision mediump float;',
  'attribute vec2 a_VertexPosition;',
  '',
  'uniform float u_Time;',
  'uniform mat4 u_pMatrix;',
  '',
  'uniform vec2 u_Position;',
  'uniform vec2 u_Size;',
  'uniform float u_Scale;',
  'uniform float u_Angle;',
  '',
  'varying mediump vec2 v_VertexPosition;',
  '',
  'void main(void) {',
  '  v_VertexPosition = a_VertexPosition;',
  '  vec2 position = vec2(u_Scale * a_VertexPosition);',
  '  position.x   *= u_Size.x;',
  '  position.y   *= u_Size.y;',
  '  vec2 p        = vec2(0, 0);',
  '  p.x           = cos(u_Angle) * position.x + sin(u_Angle) * position.y;',
  '  p.y           = cos(u_Angle) * position.y - sin(u_Angle) * position.x;',
  '  p.x          += u_Position.x;',
  '  p.y          += u_Position.y;',
  '  gl_Position = u_pMatrix * vec4(p, 0.0, 1.0);',
  '}'
].join('\n');

GL2.shader.sprite_fragment = [
  'precision mediump float;',
  'uniform float u_Time;',
  '',
  'uniform vec2 u_Size;',
  'uniform float u_Scale;',
  'uniform bool u_UseColor;',
  'uniform vec3 u_Color;',
  'uniform sampler2D u_Texture;',
  'uniform float u_Alpha;',
  '',
  'varying mediump vec2 v_VertexPosition;',
  '',
  'float average(float a, float b) {',
  '  return (a + b) * 0.5;',
  '}',
  '',
  'float average3(float a, float b, float c) {',
  '  return (a + b + c) * 0.3333333333;',
  '}',
  '',
  'float posterize(float n, float steps) {',
  '  return floor(n * steps) / steps;',
  '}',
  '',
  'void main(void) {',
  '  vec4 color;',
  '  if(u_UseColor) {',
  '    color = vec4(u_Color, 1.0);',
  '  } else {',
  '    vec2 uv = vec2(v_VertexPosition.x, v_VertexPosition.y);',
  '    color = texture2D(u_Texture, vec2(uv.x + 0.5, 1.0 - (uv.y + 0.5)));',
  '  }',
  '  color.a *= u_Alpha;',
  '  gl_FragColor = color;',
  '}'
].join('\n');

// UTILS

GL2.util = {};

GL2.util.flatten = function(array) {
  var out = [];
  for(var i=0;i<array.length;i++) {
    if(Array.isArray(array[i]))
      out.push.apply(out, GL2.util.flatten(array[i]));
    else
      out.push(array[i]);
  }
  return out;
};

GL2.util.random = function(low, high) {
  return (Math.random() * (high - low)) + low;
};

GL2.util.lerp = function(il, i, ih, ol, oh) {
  return (((i - l) / (ih - il)) * (oh - ol)) + ol;
};

GL2.util.clamp = function(il, i, ih) {
  if(ih < il) {
    var temp = ih;
    ih = il;
    il = temp;
  }
  if(il > i) return il;
  if(ih < i) return ih;
  return i;
};

GL2.util.clerp = function(il, i, ih, ol, oh) {
  return (((GL2.util.clamp(il, i, ih) - il) / (ih - il)) * (oh - ol)) + ol;
};

GL2.util.mod = function(a, n) {
  return ((a%n)+n)%n;
};

////////////////////////////////////////
// CONTEXT
////////////////////////////////////////

GL2.getCurrentContext = function() {
  if(GL2.context) return GL2.context;
  GL2.log('no current context');
};

GL2.Context = Class.extend({
  init: function(options) {
    this.context = null;
    this.canvas  = null;

    // viewport size
    this.size    = [0, 0];
    this.aspect  = 1;

    this.backend = options.backend || 'gl';

    // sprite shader program
    this.program = null;

    this.layers = [];
    this.layer  = null;

    this.last_draw = GL2.time();
    this.delta     = 0.00001;

    this.fps       = 0;
    this.frames    = 0;
    this.fps_time  = GL2.time();

    this.use();
    this.create();

    this.setClearColor(0, 0, 0);

    this.texture_slots = [];
    this.current_texture = null;

    this.uniform = {};
    
  },
  // set as current
  use: function() {
    GL2.context = this;
    return this;
  },

  // initialization
  create: function() {
    if(this.backend == 'gl' || this.backend == 'auto')
      this.createWebGL();
    else
      this.createCanvas();
  },
  createWebGL: function() {
    this.canvas  = document.createElement('canvas');
    this.canvas.setAttribute('class', 'gl2');

    this.backend = 'gl';

    var options = {
      antialias: true
    };

    this.context = this.canvas.getContext('webgl', options) || canvas.getContext('experimental-webgl', options);

    if(!this.context) {
      GL2.log('could not create context');
      this.createCanvas();
      return;
    } else {
      GL2.log('created context');
    }

    var gl = this.context;

    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    
    this.createShaderProgram();
    this.createObject();

  },
  createCanvas: function() {
    if(!this.canvas)
      this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('class', 'gl2 canvas');

    this.context = this.canvas.getContext('2d');

    if(!this.context) {
      GL2.log('could not create canvas context');
      return;
    } else {
      GL2.log('created fallback canvas context');
    }

    this.context.imageSmoothingEnabled = true;

    this.backend = 'canvas';

  },
  
  createShaderProgram: function() {
    if(this.backend != 'gl') return;
    var vertex   = new GL2.VertexShader(GL2.shader.sprite_vertex);
    var fragment = new GL2.FragmentShader(GL2.shader.sprite_fragment);
    this.program = new GL2.ShaderProgram(vertex, fragment);
  },
  createObject: function() {
    if(this.backend != 'gl') return;
    this.object = new GL2.Object([
      [-0.5,  0.5],
      [ 0.5,  0.5],
      [ 0.5, -0.5],

      [ 0.5, -0.5],
      [-0.5, -0.5],
      [-0.5,  0.5],
    ]);
  },
  getElement: function() {
    return this.canvas;
  },

  // resize
  resize: function(width, height) {

    if(arguments.length == 0) {
      width  = this.canvas.offsetWidth;
      height = this.canvas.offsetHeight;
      GL2.trace('resizing to ' + width + ' x ' + height);
    }

    this.context.canvas.width  = width;
    this.context.canvas.height = height;

    this.size   = [width, height];

    this.aspect = width / height;

    if(this.backend == 'gl') {
      this.context.viewport(0, 0, width, height);
      this.pMatrix = mat4.create();
      var left   = Math.floor(-width  * 0.5);
      var bottom = Math.floor(-height * 0.5);
      mat4.ortho(this.pMatrix, left, left + width, bottom, bottom + height, 0, 10);
    }

    return this;
  },

  // WebGL stuff now
  setClearColor: function(r, g, b) {
    if(this.backend == 'gl') {
      this.context.clearColor(r, g, b, 1.0);
    } else {
      this.clearColor = [r, g, b];
    }
  },
  
  // clear the screen
  clear: function() {
    if(this.backend == 'gl') {
      this.context.clear(this.context.COLOR_BUFFER_BIT);
    } else {
      this.context.fillStyle = 'rgb(' + this.clearColor.join(', ') + ')';
      this.context.fillRect(0, 0, this.size[0], this.size[1]);
    }
  },

  // LAYERS
  addLayer: function(layer) {
    this.layers.push(layer);
    this.updateLayers();
  },
  removeLayer: function(layer) {
    var index = null;
    for(var i=0;i<this.layers.length;i++) {
      if(this.layers[i].index === layer.index) {
        index = i;
        break;
      }
    }
    if(index == null) {
      return false;
    }
    this.removeLayerByIndex(index);
    return true;
  },
  removeLayerByIndex: function(index, inhibit_update) {
    var layer = this.layers[index];
    this.layers.splice(index, 1);
    this.updateLayers();
  },
  sortLayers: function() {
    this.layers.sort(function(a, b) {
      if(a._z == b._z) return 0;
      if(a._z <  b._z) return -1;
      return 1;
    });
  },
  updateLayers: function() {
//    this.sortLayers();
  },
  getCurrentLayer: function() {
    if(!this.layer) {
      throw GL2.Error('no current layer');
    }
    return this.layer;
  },

  setUniform: function(uniform, value, integer) {
    if(this.backend != 'gl') return;
    var gl = this.context;
    var u = this.uniform[uniform];
    if(typeof value === typeof 0.0 && !integer) {
      if(u && u === value) return;
      gl.uniform1f(this.program.uniformPosition(uniform), value);
    } else if(typeof value === typeof false || integer) {
      if(u && u === value) return;
      gl.uniform1i(this.program.uniformPosition(uniform), value);
    } else {
      if(value.length === 2) {
        if(u && u[0] == value[0] && u[1] == value[1]) return;
        gl.uniform2fv(this.program.uniformPosition(uniform), value);
      } else if(value.length === 3) {
        if(u && u[0] == value[0] && u[1] == value[1] && u[2] == value[2]) return;
        gl.uniform3fv(this.program.uniformPosition(uniform), value);
      }
    }
    this.uniform[uniform] = value;
  },

  setUniformi: function(uniform, value) {
    if(this.backend != 'gl') return;
    this.context.uniform1i(this.program.uniformPosition(uniform), value);
  },

  setTexture: function(texture) {
    if(this.backend != 'gl') return;
    var gl = this.context;
    if(this.current_texture && texture.url == this.current_texture.url) return;
    for(var i=0;i<this.texture_slots.length;i++) {
      var t = this.texture_slots[i];
      if(texture.url == t.url) {
        gl.activeTexture(t.gl_slot);
        gl.bindTexture(gl.TEXTURE_2D, t.texture.texture);
        this.setUniformi('u_Texture', t.slot);
        this.current_texture = texture;
        return t.slot;
      }
    }
    var slot = this.texture_slots.length;
    if(slot > 32) {
      slot = 0;
    }
    this.texture_slots[slot] = {
      url:     texture.url,
      texture: texture,
      slot:    slot,
      gl_slot: eval('gl.TEXTURE' + slot)
    };
    gl.activeTexture(this.texture_slots[slot].gl_slot);
    gl.bindTexture(gl.TEXTURE_2D, texture.texture);
    this.setUniformi('u_Texture', slot);
    this.current_texture = texture;
    return slot;
  },

  // draw all the things
  draw: function() {
    this.delta = GL2.time() - this.last_draw;

    this.clear();

    this.updateLayers();

    if(this.backend == 'gl') {
      var gl = this.context;
      var vertex_position = this.program.attributePosition('a_VertexPosition');

      gl.useProgram(this.program.program);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.object.buffer);

      gl.vertexAttribPointer(vertex_position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertex_position);

      gl.uniformMatrix4fv(this.program.uniformPosition('u_pMatrix'), false, this.pMatrix);
      gl.uniform1f(this.program.uniformPosition('u_Time'), GL2.time() - GL2.start_time);
    }

    for(var i=0;i<this.layers.length;i++) {
      this.layers[i].draw();
    }

    this.last_draw = GL2.time();
    
    this.frames += 1;
    var time = 1;
    if(GL2.time() > this.fps_time + time) {
      this.fps = this.frames / time;
      this.frames = 0;
      this.fps_time = GL2.time();
    }

  }

});

////////////////////////////////////////
// SHADERS
////////////////////////////////////////

GL2.Shader = Class.extend({
  init: function(type, text) {
    this.context = GL2.getCurrentContext();

    this.type    = type;
    this.shader  = null;
    this.text    = text;

    this.compile();
  },

  // setup
  compile: function() {
    var gl      = this.context.context;
    this.shader = gl.createShader((this.type === 'fragment' ?
                                   gl.FRAGMENT_SHADER :
                                   gl.VERTEX_SHADER));
    gl.shaderSource(this.shader, this.text);
    gl.compileShader(this.shader);

    if(!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      GL2.log('errors occurred while compiling shaders:');
      console.log(gl.getShaderInfoLog(this.shader));
      return false;
    }

    return true;
  }
});

GL2.FragmentShader = GL2.Shader.extend({
  init: function(text) {
    this._super('fragment', text);
  }
});

GL2.VertexShader = GL2.Shader.extend({
  init: function(text) {
    this._super('vertex', text);
  }
});

GL2.ShaderProgram = Class.extend({
  init: function(vertex, fragment) {
    this.context  = GL2.getCurrentContext();

    this.program  = null;

    this.attributes = {};
    this.uniforms   = {};

    this.vertex   = vertex;
    this.fragment = fragment;

    this.link();
  },

  attributePosition: function(attribute) {
    if(!(attribute in this.attributes)) {
      var gl       = this.context.context;
      var position = gl.getAttribLocation(this.program, attribute);
      this.attributes[attribute] = position;
    }
    return this.attributes[attribute];
  },

  uniformPosition: function(uniform) {
    if(!(uniform in this.uniforms)) {
      var gl       = this.context.context;
      var position = gl.getUniformLocation(this.program, uniform);
      this.uniforms[uniform] = position;
    }
    return this.uniforms[uniform];
  },

  // link shaders
  link: function() {
    var gl       = this.context.context;
    this.program = gl.createProgram();

    gl.attachShader(this.program, this.vertex.shader);
    gl.attachShader(this.program, this.fragment.shader);
    
    gl.linkProgram(this.program);

    if(!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      GL2.log('errors occurred while linking program');
      return false;
    }

    return true;
  }
});

////////////////////////////////////////
// OBJECTS
////////////////////////////////////////

GL2.Object = Class.extend({
  init: function(vertices) {
    this.context  = GL2.getCurrentContext();

    this.buffer   = null;

    this.program  = null;

    if(vertices) {
      this.create(vertices);
    }
  },
  create: function(vertices) {
    var gl      = this.context.context;
    this.buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(GL2.util.flatten(vertices)), gl.STATIC_DRAW);

    return this;
  }
});

////////////////////////////////////////
// TEXTURE
////////////////////////////////////////

GL2.Texture = Class.extend({
  init: function(url) {
    this.context = GL2.getCurrentContext();

    this.url     = url;

    if(!url) {
      GL2.warn('expected a URL with new GL2.Texture(); got none');
      return;
    }

    this.texture = null;

    this.loaded = true;

    this.load();

  },
  load: function() {
    var that = this;

    this.image = new Image();

    this.image.onload = function() {
      that.done.call(that);
    };

    this.image.src = this.url;
  },
  done: function() {
    if(this.context.backend == 'gl') {
      var gl       = this.context.context;
      this.texture = gl.createTexture();

      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
    this.loaded = true;
  }
});

GL2.textures = {};
GL2.loadTexture = function(url) {
  if(!(url in GL2.textures)) {
    GL2.textures[url] = new GL2.Texture(url);
  }
  return GL2.textures[url];
};

////////////////////////////////////////
// LAYERS
////////////////////////////////////////

GL2.layer_index = 0;
GL2.Layer = Class.extend({
  init: function(options) {
    this.context  = GL2.getCurrentContext();

    this.index    = GL2.layer_index++;

    this.alpha    = 1;

    this.sprites  = [];

    this.context.addLayer(this);
  },
  use: function() {
    this.context.layer = this;
    return this;
  },
  addSprite: function(sprite) {
    this.sprites.push(sprite);
    return this;
  },
  draw: function() {
    if(this.alpha < 0.001) return;
    for(var i=0;i<this.sprites.length;i++) {
      if(!this.sprites[i].parent && this.sprites[i]._dirty) {
        this.sprites[i].update();
      }
    }
    for(var i=0;i<this.sprites.length;i++) {
      this.sprites[i].draw();
    }
  }
});

////////////////////////////////////////
// SPRITES
////////////////////////////////////////

GL2.sprite_index = 0;
GL2.Group = Class.extend({
  init: function(options) {
    this.context  = GL2.getCurrentContext();
    this.layer    = this.context.getCurrentLayer();

    this.index    = GL2.sprite_index++;
    this.position = [0, 0];
    this.angle    = 0;
    this.scale    = 1;

    this._dirty   = false;

    this.z         = 0;
    
    this.alpha     = 1;

    this._position = [0, 0];
    this._angle    = 0;
    this._scale    = 1;
    this._z        = 0;
    this._alpha    = 1;

    this.parent   = null;
    this.children = [];

    if(options) {
      this.set(options);
    }

    this.layer.addSprite(this);

  },
  set: function(data) {
    if('position' in data)
      this.position = data.position;

    if('angle' in data)
      this.angle = data.angle;

    if('scale' in data)
      this.scale = data.scale;

    if('parent' in data)
      this.setParent(data.parent);

    if('alpha' in data)
      this.alpha = data.alpha;

    if('z' in data)
      this.z = data.z;

    this.update();
  },
  dirty: function() {
    if(this.parent) {
      this.parent.dirty();
    }
    this._dirty = true;
  },
  setChild: function(child) {
    this.children.push(child);
  },
  setParent: function(parent) {
    this.parent = parent;
    parent.setChild(this);
    this.update();
  },
  draw: function() {

  },
  update: function() {
    if(this.parent) {
      this._angle = this.parent._angle;

      this._position = [this.parent._position[0], this.parent._position[1]];

      this._scale = this.parent._scale;

      this._position[0] += Math.cos(this._angle) * (this.position[0] * this._scale) + Math.sin(this._angle) * (this.position[1] * this._scale);
      this._position[1] += Math.cos(this._angle) * (this.position[1] * this._scale) - Math.sin(this._angle) * (this.position[0] * this._scale);

      this._angle += this.angle;

      this._scale *= this.scale;

      this._z      = this.parent._z + this.z;

      this._alpha  = this.parent._alpha * this.alpha;
    } else {
      this._angle    = this.angle;
      this._position = this.position;
      this._scale    = this.scale;
      this._z        = this.z;
      this._alpha    = this.alpha;
    }
    this._angle = GL2.util.mod(this._angle, Math.PI * 2);
    for(var i=0;i<this.children.length;i++) {
      this.children[i].update();
    }
    this._dirty = false;
  },
});

GL2.Sprite = GL2.Group.extend({
  init: function(options) {
    this.color    = [1, 0, 1];
    this.texture  = null;

    this._super(options);

    this.size      = [2, 2];
    this.alpha     = 1;

    if(options) {
      this.set(options);
    }
  },
  set: function(data) {
    if('size' in data)
      this.size = data.size;

    if('color' in data)
      this.color.set(data.color);

    if('url' in data)
      this.texture = GL2.loadTexture(data.url);

    if('texture' in data)
      this.texture = data.texture;

    this._super(data);
  },
  drawWebGL: function() {
    var gl      = this.context.context;

    if(this._alpha < 0.0001 || this._hidden) return;

    this.context.setUniform('u_Size', this.size);
    this.context.setUniform('u_Position', this._position);

    this.context.setUniform('u_Scale', this._scale);
    this.context.setUniform('u_Angle', this._angle);

    if(this.texture) {
      this.context.setUniform('u_UseColor', false);
      this.context.setTexture(this.texture);
    } else {
      this.context.setUniform('u_UseColor', true);
      this.context.setUniform('u_Color', this.color);
    }

    this.context.setUniform('u_Alpha', this._alpha * this.layer.alpha);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  },
  drawCanvas: function() {
    var cc      = this.context.context;

    if(this._alpha < 0.0001 || this._hidden) return;

    cc.save();
    cc.translate(this._position[0] + cc.canvas.width * 0.5, this._position[1] + cc.canvas.height * 0.5);
    cc.rotate(this._angle);
    cc.scale(this._scale, this._scale);
    if(this.texture) {
      cc.globalAlpha = this._alpha * this.layer.alpha;
      cc.drawImage(this.texture.image, -this.size[0] * 0.5, -this.size[1] * 0.5, this.size[0], this.size[1]);
    } else {
      cc.fillStyle = 'rgba(' + this.color.join(', ') + ', ' + this._alpha * this.layer.alpha + ')';
      cc.fillRect(-this.size[0] * 0.5, -this.size[1] * 0.5, this.size[0], this.size[1]);
    }
    cc.restore();
  },
  draw: function() {
    if(this.texture && !this.texture.loaded) return;

    if(true) {
      var radius = Math.max(this.size[0], this.size[1]) * this._scale;
      if(this._position[0] + radius < -this.context.size[0] * 0.5 ||
         this._position[0] - radius >  this.context.size[0] * 0.5 ||
         this._position[1] + radius < -this.context.size[1] * 0.5 ||
         this._position[1] - radius >  this.context.size[1] * 0.5)
        return;
    }

    if(this.context.backend == 'gl')
      this.drawWebGL();
    else if(this.context.backend == 'canvas')
      this.drawCanvas();
  }
});
