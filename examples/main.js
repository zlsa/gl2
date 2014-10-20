
var C;
var parent;
var child;

$(document).ready(function() {
  C = new GL2.Context().use();
  $('body').append(C.getElement());
  C.resize();

  parent = new GL2.Sprite({
    size:     [256, 256],
    url:      'images/baboon.png'
  });

  child = new GL2.Sprite({
    parent:   parent,
    position: [0, 20],
    size:     [10, 6],
    color:    [0, 0, 0.5]
  });

  frame();
});

function frame() {
  parent.angle += Math.PI * 0.003;
  parent.scale  = Math.sin(GL2.time() * 8) + 2;
  parent.dirty();
  C.draw();
  requestAnimationFrame(frame);
}
