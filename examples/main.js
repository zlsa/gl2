
var C;
var parent;
var child;
var particles;

$(document).ready(function() {
  C = new GL2.Context().use();
  $('body').append(C.getElement());
  C.resize();

  parent = new GL2.Sprite({
    size:     [256, 256],
    url:      'images/baboon.png',
    z:        100
  });

  new GL2.Sprite({
    size:     [256, 256],
    url:      'images/baboon.png',
    z:        120,
    scale:    0.5,
    alpha:    0.9
  });

  child = new GL2.Sprite({
    parent:   parent,
    position: [0, 120],
    size:     [150, 150],
    color:    [1, 1, 1],
    z:        50,
    alpha:    0.9
  });

  particles = new GL2.Particles({
    position: [-300, 100],
    number:   50,
    z:        500,
    url:      'images/smoke.png',
  });

  frame();
  
});

function frame() {
  parent.angle += Math.PI * 0.003;
//  parent.alpha  = Math.sin(GL2.time() * 4) * 0.5 + 0.5;
  particles.update();
  C.draw();
  requestAnimationFrame(frame);
}
