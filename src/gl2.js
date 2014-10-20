
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

GL2.time = function() {
  return new Date().getTime() * 0.001;
};

GL2.start_time = GL2.time();

GL2.Color = Class.extend({
  init: function(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  },
  set: function() {
    if(arguments.length === 1) {
      this.r = arguments[0][0];
      this.g = arguments[0][1];
      this.b = arguments[0][2];
    } else if(arguments.length === 3) {
      this.r = arguments[0];
      this.g = arguments[1];
      this.b = arguments[2];
    } else {
      GL2.warn('expected r, g, b or [r, g, b] with new GL2.Color().set()');
      return;
    }
  }
});

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
  'uniform bool u_UseColor;',
  'uniform vec3 u_Color;',
  'uniform sampler2D u_Texture;',
  'uniform float u_Alpha;',
  '',
  'varying mediump vec2 v_VertexPosition;',
  '',
  'void main(void) {',
  '  vec4 color;',
  '  if(u_UseColor) {',
  '    color = vec4(u_Color, 1.0);',
  '  } else {',
  '    color = texture2D(u_Texture, vec2(v_VertexPosition.x + 0.5, 1.0 - (v_VertexPosition.y + 0.5)));',
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

////////////////////////////////////////
// CONTEXT
////////////////////////////////////////

GL2.getCurrentContext = function() {
  if(GL2.context) return GL2.context;
  GL2.log('no current context');
};

GL2.Context = Class.extend({
  init: function() {
    this.context = null;
    this.canvas  = null;

    this.size    = [0, 0];
    this.aspect  = 1;

    this.created = false;

    // sprite shader program
    this.program = null;

    // children
    this.sprites = [];

    // initialization
    var last_context = GL2.context;

    this.last_draw = GL2.time();
    this.delta     = 0.00001;

    this.use();
    this.create();
    this.createShaderProgram();
    this.createObject();

    this.setClearColor(new GL2.Color(0, 0, 0));
    
    if(last_context) {
      last_context.use();
    }

  },
  // set as current
  use: function() {
    GL2.context = this;
    return this;
  },

  // initialization
  create: function() {
    this.canvas  = document.createElement('canvas');
    this.canvas.setAttribute('class', 'gl2');

    var options = {
      antialias: true
    };

    this.context = this.canvas.getContext('webgl', options) || canvas.getContext('experimental-webgl', options);

    if(!this.context) {
      GL2.log('could not create context');
    } else {
      GL2.log('created context');
      this.created = true;
    }

    var gl = this.context;

    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    
  },
  
  createShaderProgram: function() {
    var vertex   = new GL2.VertexShader(GL2.shader.sprite_vertex);
    var fragment = new GL2.FragmentShader(GL2.shader.sprite_fragment);
    this.program = new GL2.ShaderProgram(vertex, fragment);
  },
  createObject: function() {
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

    this.context.viewport(0, 0, width, height);

    this.canvas.width  = width;
    this.canvas.height = height;

    this.aspect = width / height;

    this.pMatrix = mat4.create();
    var left   = Math.floor(-width  * 0.5);
    var bottom = Math.floor(-height * 0.5);
    mat4.ortho(this.pMatrix, left, left + width, bottom, bottom + height, 0, 10);

    return this;
  },

  // WebGL stuff now
  setClearColor: function(color) {
    this.context.clearColor(color.r, color.g, color.b, 1.0);
  },
  
  // clear the screen
  clear: function() {
    this.context.clear(this.context.COLOR_BUFFER_BIT);
  },

  // SPRITESTUFF
  addSprite: function(sprite) {
    this.sprites.push(sprite);
    this.updateSprites();
  },
  removeSprite: function(sprite, inhibit_update) {
    var index = null;
    for(var i=0;i<this.sprites.length;i++) {
      if(this.sprites[i].index === sprite.index) {
        index = i;
        break;
      }
    }
    if(index == null) {
      GL2.trace(sprite);
      return false;
    }
    return this.removeSpriteByIndex(index, inhibit_update);
  },
  removeSpriteByIndex: function(index, inhibit_update) {
    var sprite = this.sprites[index];
    this.sprites.splice(index, 1);
    for(var i=0;i<sprite.children.length;i++) {
      this.removeSprite(sprite.children[i], true);
    }
    if(!inhibit_update) this.updateSprites();
    return true;
  },
  sortSprites: function() {
    this.sprites.sort(function(a, b) {
      if(a._z == b._z) return 0;
      if(a._z <  b._z) return -1;
      return 1;
    });
  },
  updateSprites: function() {
    for(var i=0;i<this.sprites.length;i++) {
      if(this.sprites[i].parent == null)
        this.sprites[i].update();
    }
    this.sortSprites();
  },

  // draw all the things
  draw: function() {
    this.delta = GL2.time() - this.last_draw;

    this.clear();

    this.updateSprites();

    var gl = this.context;
    var vertex_position = this.program.attributePosition('a_VertexPosition');

    gl.useProgram(this.program.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.object.buffer);

    gl.vertexAttribPointer(vertex_position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertex_position);

    gl.uniformMatrix4fv(this.program.uniformPosition('u_pMatrix'), false, this.pMatrix);
    gl.uniform1f(this.program.uniformPosition('u_Time'), GL2.time() - GL2.start_time);

    var current_position = [0, 0];
    var current_size  = [1, 1];
    var current_angle = 1;
    var current_scale = 1;

    gl.uniform1f(this.program.uniformPosition('u_Scale'), 1);
    gl.uniform1f(this.program.uniformPosition('u_Angle'), 0);

    for(var i=0;i<this.sprites.length;i++) {
      var sprite = this.sprites[i];

      if(sprite._alpha < 0.0001 || sprite._hidden || sprite._empty) continue;

      gl.uniform2fv(this.program.uniformPosition('u_Size'), sprite.size);
      gl.uniform2fv(this.program.uniformPosition('u_Position'), sprite._position);

      gl.uniform1f(this.program.uniformPosition('u_Scale'), sprite._scale);
      gl.uniform1f(this.program.uniformPosition('u_Angle'), sprite._angle);

      if(sprite.texture && sprite.texture.loaded && !sprite._empty) {
        gl.uniform1i(this.program.uniformPosition('u_UseColor'), false);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sprite.texture.texture);
        gl.uniform1i(this.program.uniformPosition('u_Texture'), 0);
      } else {
        gl.uniform1i(this.program.uniformPosition('u_UseColor'), true);
        gl.uniform3fv(this.program.uniformPosition('u_Color'), [sprite.color.r, sprite.color.g, sprite.color.b]);
      }
      gl.uniform1f(this.program.uniformPosition('u_Alpha'), sprite._alpha);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    this.last_draw = GL2.time();
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
    var gl       = this.context.context;
    this.texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.loaded = true;
  }
});

GL2.textures = {};
GL2.texture  = function(url) {
  if(!(url in GL2.textures)) {
    GL2.textures[url] = new GL2.Texture(url);
  }
  return GL2.textures[url];
};

////////////////////////////////////////
// SPRITES
////////////////////////////////////////

GL2.sprite_index = 0;
GL2.Empty = Class.extend({
  init: function(options) {
    this._empty   = true;
    this.index    = GL2.sprite_index++;
    this.position = [0, 0];
    this.angle    = 0;
    this.size     = [0, 0];
    this.scale    = 1;

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

    GL2.getCurrentContext().addSprite(this);

  },
  set: function(data) {
    if('position' in data)
      this.position = data.position;

    if('angle' in data)
      this.angle = data.angle;

    if('size' in data)
      this.size = data.size;

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
  setChild: function(child) {
    this.children.push(child);
  },
  setParent: function(parent) {
    this.parent = parent;
    parent.setChild(this);
    this.update();
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
    for(var i=0;i<this.children.length;i++) {
      this.children[i].update();
    }
  },
});

GL2.Sprite = GL2.Empty.extend({
  init: function(options) {
    this.color    = new GL2.Color(1, 0, 1);
    this.texture  = null;

    this._super(options);
    this._empty   = false;

    this.size      = [2, 2];
    this.alpha     = 1;

    this.set(options);
  },
  set: function(data) {
    if('color' in data)
      this.color.set(data.color);

    if('url' in data)
      this.texture = GL2.texture(data.url);

    if('texture' in data)
      this.texture = data.texture;

    this._super(data);
  }
});

////////////////////////////////////////
// PARTICLES
////////////////////////////////////////

GL2.Particles = Class.extend({
  init: function(options) {
    this.context   = GL2.getCurrentContext();

    this.particles = [];

    this.life      = 1;

    this.empty     = new GL2.Empty(options);

    this.set(options);
  },
  createParticles: function(data) {
    for(var i=0;i<data.number;i++) {
      this.particles.push({
        position:    [0, 0],
        velocity:    [0, 0],
        age:         0,
        sprite:      new GL2.Sprite({
          parent:  this.empty,
          size:    [4, 4],
          scale:   10,
          url:     data.url,
          alpha:   1,
        }),
        spawn:     GL2.time() - Math.random() * this.life,
        life:      GL2.util.random(0.9, 1.1) * this.life,
        random:    Math.random()
      });
    }
  },
  set: function(data) {
    if('life' in data)
      this.life = data.life;

    if('number' in data)
      this.number = data.number;

    this.createParticles(data);
  },
  respawn: function(i) {
    var p = this.particles[i];
    p.spawn       = GL2.time(),
    p.position[0] = this.empty.position[0];
    p.position[1] = this.empty.position[1];
    var spread = 80;
    p.velocity[0] = GL2.util.random(-spread, spread) + spread * 3;
    p.velocity[1] = GL2.util.random(-spread, spread) - spread * 3;
  },
  update: function() {
    for(var i=0;i<this.particles.length;i++) {
      var p = this.particles[i];
      p.age = GL2.time() - p.spawn;
      var d = this.context.delta;
      if(p.age > p.life) {
        this.respawn(i);
      }
      p.position[0] += p.velocity[0] * d;
      p.position[1] += p.velocity[1] * d;
      p.sprite.position[0] = p.position[0];
      p.sprite.position[1] = p.position[1];
      p.sprite.z           = -p.age;
      p.sprite.alpha       = GL2.util.clerp(0, p.age, 0.5 * p.life, 0, 1) * GL2.util.clerp(0, p.age, 1 * p.life, 1, 0);
      p.sprite.scale       = GL2.util.clerp(0, p.age, p.life, 10, 50) * GL2.util.clerp(0, p.age, p.life * 0.1, 0, 1);
      p.sprite.angle       = ((p.age * 1.2) + p.random * 10) % (Math.PI * 2);
    }
  }
});
