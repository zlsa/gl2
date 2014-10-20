
var C;
var parent;
var child;

$(document).ready(function() {
  C = new GL2.Context().use();
  $('body').append(C.getElement());
  C.resize();

  parent = new GL2.Sprite({
    size:     [256, 256],
    url:      'images/baboon.png',
    z:        100
  });

  obj = new GL2.Sprite({
    size:     [256, 256],
    url:      'images/baboon.png',
    z:        120
  });

  child = new GL2.Sprite({
    parent:   parent,
    position: [0, 120],
    size:     [150, 150],
    color:    [1, 0, 1],
    z:        50
  });

  frame();
});

function frame() {
  parent.angle += Math.PI * 0.003;
  parent.scale  = 2;
//  parent.alpha  = Math.sin(GL2.time() * 4) * 0.5 + 0.5;
  C.draw();
  requestAnimationFrame(frame);
}
