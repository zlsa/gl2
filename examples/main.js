
var C;
var parent;
var over;

$(document).ready(function() {
  C = new GL2.Context().use();
  $('body').append(C.getElement());
  C.resize();

  new GL2.Layer().use();

  parent = new GL2.Sprite({
    size:     [256, 256],
    url:      'images/baboon.png',
    z:        100
  });

  var number   = 8;
  var distance = 30;
  for(var j=0;j<4;j++) {
    distance += 60;
    number   *= 1.5;
    for(var i=0;i<number;i++) {
      var angle = (i / number) * Math.PI * 2;
      new GL2.Sprite({
        parent:   parent,
        position: [Math.sin(angle) * distance + GL2.util.random(-10, 10), Math.cos(angle) * distance + GL2.util.random(-10, 10)],
        size:     [256, 256],
        url:      'images/baboon.png',
        z:        120,
        scale:    0.3,
        alpha:    GL2.util.random(0.89, 0.91),
        angle:    GL2.util.random(0, Math.PI * 2)
      });
    }
  }

  over = new GL2.Sprite({
    size:     [256, 256],
    url:      'images/baboon.png',
    z:        120,
    scale:    2.0,
    alpha:    0.7
  });

  frame();
  
});

function frame() {
  parent.angle += C.delta * 0.2;
  for(var i=0;i<parent.children.length;i++) {
    if(parent.children[i].alpha < 0.9)
      parent.children[i].angle -= C.delta * 0.4;
    else
      parent.children[i].angle += C.delta * 0.4;
  }
  over.alpha = GL2.util.clerp(-1, Math.sin(GL2.time()), 1, 0.1, 0.7);
  C.draw();
  requestAnimationFrame(frame);
}
