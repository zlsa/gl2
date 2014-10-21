
var C;
var parent;
var over;

$(document).ready(function() {
  C = new GL2.Context().use();
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
        scale:    0.3,
        alpha:    GL2.util.random(0.89, 0.91),
        angle:    GL2.util.random(0, Math.PI * 2)
      });
    }
    distance += 70;
    number   *= 1.3;
  }

  over = new GL2.Sprite({
    size:     [256, 256],
    url:      'images/matias-duarte.png',
    z:        120,
    scale:    2.0,
    alpha:    0.7
  });

  frame();
  
});

function frame() {
  var speed = 7;
  parent.angle += C.delta * 0.2 * speed;
  for(var i=0;i<parent.children.length;i++) {
    if(parent.children[i].alpha < 0.9)
      parent.children[i].angle -= C.delta * 0.4 * speed;
    else
      parent.children[i].angle += C.delta * 0.4 * speed;
  }
  over.angle = Math.sin(GL2.time() * 2) * Math.PI;
  over.alpha = GL2.util.clerp(-1, Math.sin(GL2.time()), 1, 0.5, 1.0);
  C.draw();
  $('#framerate').text(Math.round(C.fps));
  requestAnimationFrame(frame);
}
