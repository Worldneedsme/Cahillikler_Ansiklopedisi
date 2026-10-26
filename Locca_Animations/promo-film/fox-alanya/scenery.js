(function () {
  'use strict';

  var C = {
    cream: '#FBF4F0', peach: '#F7E3D6', lightPeach: '#F7C8A3', peachOrange: '#F2B084',
    deepPeach: '#EFA06C', orange: '#FF5B00', ink: '#1C1B1A',
    seaLight: '#9FD3D6', seaDark: '#7FC1C7', foam: '#FFFFFF',
    brickLight: '#C8553D', brickDark: '#A9432F',
    palmLight: '#7FAF7A', palmDark: '#5E8F5C',
    trunkLight: '#8A5A3C', trunkDark: '#6B4430', white: '#FFFFFF'
  };

  var STRIP_W = 3200;
  var SHOPS = [
    { kind: 'cafe', x: 560 },
    { kind: 'simit', x: 1600 },
    { kind: 'icecream', x: 2640 }
  ];

  function hash(i) {
    var v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  }

  function wrapX(wx, camOffset, period) {
    var rel = (wx - camOffset) % period;
    if (rel < -period * 0.25) rel += period;
    if (rel > period * 0.75) rel -= period;
    return rel;
  }

  function rrect(ctx, x, y, w, h, r) {
    var rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function fillStrokeRRect(ctx, x, y, w, h, r, fill, stroke, lw) {
    rrect(ctx, x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  function drawShadow(ctx, cx, cy, rx, ry) {
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Far layer: Kızıl Kule (Alanya Red Tower) on low rocky hill
  function drawKizilKule(ctx, sx, seaBottomY, s) {
    var baseY = seaBottomY - 12 * s;
    ctx.fillStyle = C.peachOrange;
    ctx.beginPath();
    ctx.moveTo(sx - 280 * s, seaBottomY + 18 * s);
    ctx.quadraticCurveTo(sx - 180 * s, baseY - 36 * s, sx - 20 * s, baseY - 28 * s);
    ctx.quadraticCurveTo(sx + 150 * s, baseY - 22 * s, sx + 240 * s, seaBottomY + 18 * s);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = C.deepPeach;
    ctx.beginPath();
    ctx.moveTo(sx - 170 * s, seaBottomY + 12 * s);
    ctx.quadraticCurveTo(sx - 70 * s, baseY - 18 * s, sx + 95 * s, baseY - 12 * s);
    ctx.lineTo(sx + 170 * s, seaBottomY + 12 * s);
    ctx.closePath();
    ctx.fill();

    var tw = 186 * s, th = 260 * s, ty = baseY - th;
    var fSide = tw * 0.27, fMid = tw * 0.46;
    var lx = sx - tw / 2, mx = lx + fSide, rx = mx + fMid;
    var baseH = 38 * s, flare = 12 * s;

    // Wider sloped base plinth
    ctx.fillStyle = C.brickDark;
    ctx.beginPath();
    ctx.moveTo(lx - flare, baseY);
    ctx.lineTo(lx, baseY - baseH);
    ctx.lineTo(rx + fSide, baseY - baseH);
    ctx.lineTo(rx + fSide + flare, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = C.brickLight;
    ctx.beginPath();
    ctx.moveTo(mx - flare * 0.35, baseY);
    ctx.lineTo(mx, baseY - baseH);
    ctx.lineTo(rx, baseY - baseH);
    ctx.lineTo(rx + flare * 0.35, baseY);
    ctx.closePath();
    ctx.fill();

    // Octagonal body: 3 visible faces (middle face lighter)
    var bodyTop = ty + 24 * s, bodyH = baseY - baseH - bodyTop;
    ctx.fillStyle = C.brickDark;
    ctx.fillRect(lx, bodyTop, fSide, bodyH);
    ctx.fillRect(rx, bodyTop, fSide, bodyH);
    ctx.fillStyle = C.brickLight;
    ctx.fillRect(mx, bodyTop, fMid, bodyH);

    ctx.fillStyle = C.brickDark;
    ctx.fillRect(lx - 3 * s, bodyTop + 18 * s, tw + 6 * s, 6 * s);

    // Crenellated top
    var merlonW = 14 * s, merlonH = 24 * s;
    for (var i = 0; i < 9; i++) {
      var merX = lx + i * (tw - merlonW) / 8;
      var inMid = merX + merlonW * 0.5 >= mx && merX + merlonW * 0.5 <= rx;
      fillStrokeRRect(ctx, merX, ty, merlonW, merlonH + 4 * s, 3 * s, inMid ? C.brickLight : C.brickDark);
    }

    // Dark arrow-slit windows
    var slits = [
      [lx + fSide * 0.48, bodyTop + 48 * s, 5 * s, 26 * s],
      [lx + fSide * 0.48, bodyTop + 115 * s, 5 * s, 30 * s],
      [mx + fMid * 0.32, bodyTop + 42 * s, 6 * s, 28 * s],
      [mx + fMid * 0.68, bodyTop + 42 * s, 6 * s, 28 * s],
      [mx + fMid * 0.50, bodyTop + 102 * s, 7 * s, 34 * s],
      [mx + fMid * 0.50, bodyTop + 162 * s, 12 * s, 28 * s],
      [rx + fSide * 0.52, bodyTop + 48 * s, 5 * s, 26 * s],
      [rx + fSide * 0.52, bodyTop + 115 * s, 5 * s, 30 * s]
    ];
    for (var j = 0; j < slits.length; j++) {
      var sl = slits[j];
      fillStrokeRRect(ctx, sl[0] - sl[2] / 2, sl[1], sl[2], sl[3], 2 * s, C.ink);
    }
  }

  // Middle layer: low white house with terracotta roof
  function drawMidHouse(ctx, sx, baseY, idx, s) {
    var hw = (150 + hash(idx * 3 + 1) * 55) * s;
    var hh = (95 + hash(idx * 3 + 2) * 45) * s;
    var hx = sx - hw / 2, hy = baseY - hh;

    ctx.fillStyle = C.peach;
    ctx.fillRect(hx - 24 * s, hy + 10 * s, 26 * s, hh - 10 * s);
    ctx.fillStyle = C.white;
    ctx.fillRect(hx, hy, hw, hh);

    ctx.fillStyle = C.brickDark;
    ctx.beginPath();
    ctx.moveTo(hx - 30 * s, hy + 12 * s);
    ctx.lineTo(hx + hw * 0.5, hy - 34 * s);
    ctx.lineTo(hx + 4 * s, hy + 2 * s);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = C.brickLight;
    ctx.beginPath();
    ctx.moveTo(hx - 8 * s, hy + 2 * s);
    ctx.lineTo(hx + hw * 0.5, hy - 34 * s);
    ctx.lineTo(hx + hw + 10 * s, hy + 2 * s);
    ctx.closePath();
    ctx.fill();

    var cols = 2 + Math.floor(hash(idx + 9) * 2);
    for (var c = 0; c < cols; c++) {
      var wx = hx + (c + 0.5) * (hw / cols) - 9 * s;
      fillStrokeRRect(ctx, wx, hy + 24 * s, 18 * s, 26 * s, 6 * s, C.deepPeach);
    }
  }

  // Middle layer: palm tree with curved ringed trunk and 6 swaying fronds
  function drawPalm(ctx, sx, baseY, idx, t, s) {
    var h = (260 + hash(idx * 7) * 65) * s;
    var curve = (hash(idx * 13) - 0.5) * 55 * s;
    var topX = sx + curve, topY = baseY - h;

    ctx.fillStyle = C.trunkLight;
    ctx.beginPath();
    ctx.moveTo(sx - 10 * s, baseY);
    ctx.quadraticCurveTo(sx + curve * 0.35 - 8 * s, baseY - h * 0.5, topX - 6 * s, topY);
    ctx.lineTo(topX + 6 * s, topY);
    ctx.quadraticCurveTo(sx + curve * 0.35 + 8 * s, baseY - h * 0.5, sx + 10 * s, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = C.trunkDark;
    ctx.lineWidth = 2.5 * s;
    for (var r = 1; r <= 7; r++) {
      var u = r / 8, inv = 1 - u;
      var rx = inv * inv * sx + 2 * inv * u * (sx + curve * 0.35) + u * u * topX;
      var ry = inv * inv * baseY + 2 * inv * u * (baseY - h * 0.5) + u * u * topY;
      ctx.beginPath();
      ctx.moveTo(rx - 7 * s, ry);
      ctx.lineTo(rx + 7 * s, ry - 2 * s);
      ctx.stroke();
    }

    var sway = Math.sin((t / 4) * Math.PI * 2 + idx * 1.1) * (2 * Math.PI / 180);
    var baseAngles = [-2.55, -1.95, -1.25, -0.55, -0.10, 0.35];
    for (var f = 0; f < 6; f++) {
      ctx.save();
      ctx.translate(topX, topY);
      ctx.rotate(baseAngles[f] + sway);
      var flen = (92 + (f % 2) * 16) * s;
      ctx.fillStyle = f % 2 === 0 ? C.palmLight : C.palmDark;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(flen * 0.45, -26 * s, flen, 6 * s);
      ctx.quadraticCurveTo(flen * 0.50, -4 * s, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Near layer: potted plants and bougainvillea over a wall
  function drawPottedPlant(ctx, x, groundY, variant, s) {
    drawShadow(ctx, x, groundY + 4 * s, 36 * s, 8 * s);
    ctx.fillStyle = C.brickLight;
    ctx.beginPath();
    ctx.moveTo(x - 26 * s, groundY - 46 * s);
    ctx.lineTo(x + 26 * s, groundY - 46 * s);
    ctx.lineTo(x + 20 * s, groundY);
    ctx.lineTo(x - 20 * s, groundY);
    ctx.closePath();
    ctx.fill();
    fillStrokeRRect(ctx, x - 30 * s, groundY - 54 * s, 60 * s, 10 * s, 4 * s, C.brickDark);

    ctx.fillStyle = C.palmDark;
    ctx.beginPath();
    ctx.arc(x - 14 * s, groundY - 72 * s, 22 * s, 0, Math.PI * 2);
    ctx.arc(x + 15 * s, groundY - 70 * s, 20 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.palmLight;
    ctx.beginPath();
    ctx.arc(x, groundY - 84 * s, 25 * s, 0, Math.PI * 2);
    ctx.fill();
    if (variant > 0.5) {
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(x - 8 * s, groundY - 88 * s, 5 * s, 0, Math.PI * 2);
      ctx.arc(x + 10 * s, groundY - 80 * s, 5 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBougainvilleaWall(ctx, cx, groundY, s) {
    var ww = 240 * s, wh = 230 * s, wx = cx - ww / 2, wy = groundY - wh;
    drawShadow(ctx, cx, groundY + 5 * s, ww * 0.52, 10 * s);
    fillStrokeRRect(ctx, wx, wy, ww, wh, 10 * s, C.white, C.ink, 2.5 * s);
    fillStrokeRRect(ctx, wx - 6 * s, wy - 8 * s, ww + 12 * s, 14 * s, 6 * s, C.brickLight);

    var puffs = [
      [-65, -18, 36], [-25, -28, 42], [20, -24, 40], [62, -12, 34],
      [-40, 22, 34], [5, 28, 38], [45, 24, 30], [-10, 66, 28]
    ];
    for (var i = 0; i < puffs.length; i++) {
      var p = puffs[i];
      ctx.fillStyle = i % 2 === 0 ? C.palmDark : C.palmLight;
      ctx.beginPath();
      ctx.arc(cx + p[0] * s, wy + p[1] * s, p[2] * s, 0, Math.PI * 2);
      ctx.fill();
    }
    for (var j = 0; j < 18; j++) {
      var fx = cx + (hash(j * 5 + 1) - 0.5) * 155 * s;
      var fy = wy - 30 * s + hash(j * 5 + 2) * 115 * s;
      ctx.fillStyle = j % 3 === 0 ? C.orange : (j % 3 === 1 ? C.brickLight : C.peachOrange);
      ctx.beginPath();
      ctx.arc(fx, fy, (9 + hash(j) * 7) * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Near layer: 3 shop fronts (~420*s wide, ~520*s tall, door centred at shop.x)
  function drawShop(ctx, kind, doorX, groundY, s) {
    var sw = 420 * s, sh = 520 * s, sx = doorX - sw / 2, sy = groundY - sh;
    drawShadow(ctx, doorX, groundY + 6 * s, sw * 0.52, 14 * s);

    fillStrokeRRect(ctx, sx, sy, sw, sh, 14 * s, kind === 'simit' ? C.cream : C.white, C.ink, 3 * s);
    fillStrokeRRect(ctx, sx - 10 * s, sy - 12 * s, sw + 20 * s, 20 * s, 8 * s, kind === 'simit' ? C.brickLight : C.deepPeach);

    // Door centred at doorX
    var dw = 92 * s, dh = 215 * s, dx = doorX - dw / 2, dy = groundY - dh;
    var doorCol = kind === 'cafe' ? C.trunkLight : (kind === 'simit' ? C.brickDark : C.seaDark);
    fillStrokeRRect(ctx, dx, dy, dw, dh, 10 * s, doorCol, C.ink, 3 * s);
    fillStrokeRRect(ctx, dx + 14 * s, dy + 18 * s, dw - 28 * s, 95 * s, 6 * s, C.peach);
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.arc(dx + dw - 14 * s, dy + 132 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();

    // Windows
    var winY = groundY - 205 * s, winW = 122 * s, winH = 130 * s;
    var leftWinX = sx + 24 * s, rightWinX = doorX + dw / 2 + 18 * s;
    fillStrokeRRect(ctx, leftWinX, winY, winW, winH, 10 * s, C.peach, C.ink, 3 * s);
    fillStrokeRRect(ctx, rightWinX, winY, winW, winH, 10 * s, C.peach, C.ink, 3 * s);

    // Awning & icon signs (shapes only, no letters)
    var awnY = sy + 185 * s, awnH = 72 * s, stripes = 7, stW = (sw + 16 * s) / stripes;
    for (var i = 0; i < stripes; i++) {
      var ax = sx - 8 * s + i * stW;
      if (kind === 'simit') {
        fillStrokeRRect(ctx, ax, awnY, stW, awnH, 8 * s, i % 2 === 0 ? C.lightPeach : C.deepPeach, C.ink, 2.5 * s);
      } else {
        ctx.fillStyle = i % 2 === 0 ? (kind === 'cafe' ? C.orange : C.peachOrange) : C.white;
        ctx.beginPath();
        ctx.moveTo(ax, awnY);
        ctx.lineTo(ax + stW, awnY);
        ctx.lineTo(ax + stW, awnY + awnH - 10 * s);
        ctx.arc(ax + stW / 2, awnY + awnH - 10 * s, stW / 2, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 2.5 * s;
        ctx.stroke();
      }
    }

    if (kind === 'cafe') {
      // Coffee-cup icon on window
      var cx = leftWinX + winW * 0.5, cy = winY + winH * 0.58;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 4 * s;
      ctx.beginPath();
      ctx.arc(cx + 18 * s, cy - 4 * s, 11 * s, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.moveTo(cx - 22 * s, cy - 20 * s);
      ctx.lineTo(cx + 22 * s, cy - 20 * s);
      ctx.quadraticCurveTo(cx + 20 * s, cy + 16 * s, cx, cy + 16 * s);
      ctx.quadraticCurveTo(cx - 20 * s, cy + 16 * s, cx - 22 * s, cy - 20 * s);
      ctx.closePath();
      ctx.fill();
      fillStrokeRRect(ctx, cx - 28 * s, cy + 18 * s, 56 * s, 6 * s, 3 * s, C.orange);
    } else if (kind === 'simit') {
      // Round hanging sign with sesame ring icon
      var signX = doorX, signY = sy + 95 * s;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.moveTo(signX - 24 * s, sy + 18 * s);
      ctx.lineTo(signX - 24 * s, signY - 40 * s);
      ctx.moveTo(signX + 24 * s, sy + 18 * s);
      ctx.lineTo(signX + 24 * s, signY - 40 * s);
      ctx.stroke();
      ctx.fillStyle = C.white;
      ctx.beginPath();
      ctx.arc(signX, signY, 54 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.deepPeach;
      ctx.beginPath();
      ctx.arc(signX, signY, 34 * s, 0, Math.PI * 2);
      ctx.arc(signX, signY, 18 * s, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.fillStyle = C.trunkDark;
      for (var sd = 0; sd < 8; sd++) {
        var ang = (sd / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(signX + Math.cos(ang) * 26 * s, signY + Math.sin(ang) * 26 * s, 3 * s, 1.5 * s, ang, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Ice-cream cone icon on sign
      var icX = doorX, icY = sy + 95 * s;
      fillStrokeRRect(ctx, icX - 52 * s, icY - 52 * s, 104 * s, 104 * s, 26 * s, C.peach, C.ink, 3 * s);
      ctx.fillStyle = C.trunkLight;
      ctx.beginPath();
      ctx.moveTo(icX - 18 * s, icY - 2 * s);
      ctx.lineTo(icX + 18 * s, icY - 2 * s);
      ctx.lineTo(icX, icY + 38 * s);
      ctx.closePath();
      ctx.fill();
      var scoops = [[-9, -10, C.orange], [9, -10, C.seaLight], [0, -24, C.white]];
      for (var sc = 0; sc < 3; sc++) {
        ctx.fillStyle = scoops[sc][2];
        ctx.beginPath();
        ctx.arc(icX + scoops[sc][0] * s, icY + scoops[sc][1] * s, 14 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawStrip(ctx, opts) {
    var W = opts.W, H = opts.H, groundY = opts.groundY;
    var camX = opts.camX || 0, t = opts.t || 0, s = opts.s || 1;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();

    var horizonY = groundY - 520 * s, seaBottomY = groundY - 300 * s;

    // 1. Sky: cream with very soft peach band near horizon
    ctx.fillStyle = C.cream;
    ctx.fillRect(0, 0, W, groundY);
    var skyGrad = ctx.createLinearGradient(0, horizonY - 340 * s, 0, horizonY);
    skyGrad.addColorStop(0, C.cream);
    skyGrad.addColorStop(1, C.peach);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, horizonY - 340 * s, W, 340 * s);

    // 2. Far layer (factor 0.2): 2 soft distant hills, sea, 3 wave lines, Kızıl Kule
    var camFar = camX * 0.2;
    var hill1X = wrapX(420, camFar, STRIP_W) * s;
    var hill2X = wrapX(1980, camFar, STRIP_W) * s;

    ctx.fillStyle = C.lightPeach;
    ctx.beginPath();
    ctx.moveTo(hill1X - 520 * s, horizonY + 10 * s);
    ctx.quadraticCurveTo(hill1X, horizonY - 190 * s, hill1X + 560 * s, horizonY + 10 * s);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = C.peachOrange;
    ctx.beginPath();
    ctx.moveTo(hill2X - 600 * s, horizonY + 10 * s);
    ctx.quadraticCurveTo(hill2X, horizonY - 155 * s, hill2X + 580 * s, horizonY + 10 * s);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = C.seaLight;
    ctx.fillRect(0, horizonY, W, seaBottomY - horizonY);
    ctx.fillStyle = C.seaDark;
    ctx.fillRect(0, horizonY, W, 24 * s);

    var wavePhase = ((t / 4) % 1 + 1) % 1;
    ctx.strokeStyle = C.foam;
    ctx.lineWidth = 3 * s;
    ctx.lineCap = 'round';
    for (var wv = 0; wv < 3; wv++) {
      var wy = horizonY + (52 + wv * 58) * s;
      var drift = wavePhase * 240 * s;
      for (var seg = -2; seg < 8; seg++) {
        var wx = seg * 240 * s + drift - ((camFar * s) % (240 * s)) + wv * 70 * s;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.quadraticCurveTo(wx + 45 * s, wy - 6 * s, wx + 90 * s, wy);
        ctx.stroke();
      }
    }

    ctx.fillStyle = C.peach;
    ctx.fillRect(0, seaBottomY, W, groundY - seaBottomY);
    drawKizilKule(ctx, wrapX(900, camFar, STRIP_W) * s, seaBottomY, s);

    // 3. Middle layer (factor 0.5): low white houses and palms every ~520 world px
    var camMid = camX * 0.5, numPalms = 6, palmStep = STRIP_W / numPalms;
    for (var m = 0; m < numPalms; m++) {
      drawMidHouse(ctx, wrapX(m * palmStep + 260, camMid, STRIP_W) * s, groundY - 26 * s, m, s);
    }
    for (var p = 0; p < numPalms; p++) {
      drawPalm(ctx, wrapX(p * palmStep + 40, camMid, STRIP_W) * s, groundY - 18 * s, p, t, s);
    }

    // 5. Pavement (factor 1.0): groundY to H, slab lines every 160 px, 3 px line at groundY
    ctx.fillStyle = C.peach;
    ctx.fillRect(0, groundY, W, H - groundY);
    var slabStep = 160 * s, slabOffset = ((-camX * s) % slabStep + slabStep) % slabStep;
    ctx.strokeStyle = C.lightPeach;
    ctx.lineWidth = 2.5 * s;
    for (var slx = slabOffset - slabStep; slx < W + slabStep; slx += slabStep) {
      ctx.beginPath();
      ctx.moveTo(slx, groundY);
      ctx.lineTo(slx - 36 * s, H);
      ctx.stroke();
    }
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    // 4. Near layer (factor 1.0): bougainvillea wall, potted plants, 3 shop fronts
    drawBougainvilleaWall(ctx, wrapX(1080, camX, STRIP_W) * s, groundY, s);
    var plants = [180, 840, 1320, 1920, 2120, 2320, 2980];
    for (var pl = 0; pl < plants.length; pl++) {
      drawPottedPlant(ctx, wrapX(plants[pl], camX, STRIP_W) * s, groundY, hash(pl + 4), s);
    }
    for (var shIdx = 0; shIdx < SHOPS.length; shIdx++) {
      drawShop(ctx, SHOPS[shIdx].kind, wrapX(SHOPS[shIdx].x, camX, STRIP_W) * s, groundY, s);
    }

    ctx.restore();
  }

  // Park bench seen from the front, seat top at y, centred on x, ~300*s wide
  function drawBench(ctx, x, y, s) {
    s = s || 1;
    var bw = 300 * s, legY = y + 66 * s;
    drawShadow(ctx, x, legY + 4 * s, bw * 0.54, 12 * s);

    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 4 * s;
    ctx.lineCap = 'round';
    for (var i = -1; i <= 1; i += 2) {
      var lx = x + i * bw * 0.38;
      ctx.beginPath();
      ctx.moveTo(lx, y - 78 * s);
      ctx.lineTo(lx, legY);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(lx, y - 16 * s, 14 * s, Math.PI, 0);
      ctx.stroke();
    }
    for (var b = 0; b < 2; b++) {
      fillStrokeRRect(ctx, x - bw * 0.48, y - (72 - b * 28) * s, bw * 0.96, 18 * s, 6 * s, C.trunkLight, C.ink, 2.5 * s);
    }
    fillStrokeRRect(ctx, x - bw * 0.5, y + 6 * s, bw, 12 * s, 5 * s, C.trunkDark);
    fillStrokeRRect(ctx, x - bw * 0.5, y, bw, 12 * s, 5 * s, C.trunkLight, C.ink, 3 * s);
  }

  // Café counter, top surface at y, w wide, POS on right end; returns {posX, posY}
  function drawCounter(ctx, x, y, w, s) {
    s = s || 1;
    var cw = w * s, ch = 220 * s, left = x - cw / 2;
    drawShadow(ctx, x, y + ch + 4 * s, cw * 0.54, 16 * s);

    fillStrokeRRect(ctx, left + 10 * s, y + 14 * s, cw - 20 * s, ch - 14 * s, 10 * s, C.deepPeach, C.ink, 3 * s);
    var pw = (cw - 80 * s) / 3;
    for (var i = 0; i < 3; i++) {
      fillStrokeRRect(ctx, left + 26 * s + i * (pw + 14 * s), y + 38 * s, pw, ch - 62 * s, 8 * s, C.lightPeach);
    }
    fillStrokeRRect(ctx, left, y, cw, 22 * s, 8 * s, C.cream, C.ink, 3 * s);

    var posX = left + cw - 92 * s, scanY = y - 48 * s;
    fillStrokeRRect(ctx, posX - 16 * s, y - 12 * s, 32 * s, 12 * s, 4 * s, C.ink);
    fillStrokeRRect(ctx, posX - 28 * s, y - 68 * s, 56 * s, 58 * s, 8 * s, C.white, C.ink, 3 * s);
    fillStrokeRRect(ctx, posX - 20 * s, scanY - 12 * s, 40 * s, 24 * s, 4 * s, C.seaLight);
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.arc(posX, y - 22 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();

    return { posX: posX, posY: scanY };
  }

  window.Scenery = {
    drawStrip: drawStrip,
    drawBench: drawBench,
    drawCounter: drawCounter,
    SHOPS: SHOPS,
    STRIP_W: STRIP_W
  };
})();
