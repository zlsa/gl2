
var C;
var parent;
var over;

$(document).ready(function() {
  C = new GL2.Context({
//    backend: 'canvas'
  }).use();
  $('body').append(C.getElement());

  var el = $('<div id="framerate"></div>');
  $('body').append(el);
  el.css({
    position:   'absolute',
    top:        0,
    left:       0,
    padding:    10,
    fontFamily: 'monospace',
    color:      'white'
  });

  C.resize();

  new GL2.Layer().use();

  parent = new GL2.Sprite({
    size:     [0, 0],
    z:        100
  });

  $(window).resize(function() {
    C.resize();
  });

  var number   = 8;
  var distance = 20;
  for(var j=0;j<10;j++) {
    for(var i=0;i<number;i++) {
      var angle = (i / number) * Math.PI * 2;
      new GL2.Sprite({
        parent:   parent,
        position: [Math.sin(angle) * distance + GL2.util.random(-10, 10), Math.cos(angle) * distance + GL2.util.random(-10, 10)],
        size:     [256, 256],
        url:      'images/baboon.png',
        z:        120,
        scale:    0.1,
        alpha:    GL2.util.random(0.5, 1),
        angle:    GL2.util.random(0, Math.PI * 2)
      });
    }
    distance += 70;
    number   *= 1.2;
  }

  over = new GL2.Sprite({
    size:     [256, 256],
    url:      'images/earth.png',
    z:        120,
    scale:    2.0,
    alpha:    1
  });

  frame();
  
});

function frame() {
  var speed = 2;
  parent.angle += C.delta * 0.2 * speed;
  for(var i=0;i<parent.children.length;i++) {
    if(parent.children[i].alpha < 0.9)
      parent.children[i].angle -= C.delta * 0.4 * speed;
    else
      parent.children[i].angle += C.delta * 0.4 * speed;
  }
  parent.dirty();
  over.angle = GL2.time() * -0.1;
  over.scale = GL2.util.clerp(-1, Math.sin(GL2.time()), 1, 0.5, 1.0);
  over.dirty();

  C.draw();

  $('#framerate').text(Math.round(C.fps));
  requestAnimationFrame(frame);
}
