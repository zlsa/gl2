
var C;
var parent;
var child;

$(document).ready(function() {
  C = new GL2.Context().use();
  $('body').append(C.getElement());
  C.resize();

  parent = new GL2.Sprite({
    size:     [20, 10],
  });

  child = new GL2.Sprite({
    parent:   parent,
    position: [0, 20],
    size:     [10, 6],
  });

  frame();
});

function frame() {
  parent.angle += Math.PI * 0.003;
  child.angle -= Math.PI * 0.006;
  parent.scale  = Math.sin(GL2.time() * 8) + 2;
  parent.dirty();
  C.draw();
  requestAnimationFrame(frame);
}
