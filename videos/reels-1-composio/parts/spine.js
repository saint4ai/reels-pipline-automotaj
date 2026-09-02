/* Доска «шесть действий». Все тайминги из SB.spine; хелперы show/pop/draw и tl даёт сборщик. */
var SP=SB.spine, INK="#111214", WHITE="#FFFFFF", GREY="#B9B9B9";
var full=SP.board.full, strip=SP.board.strip;
tl.set("#spine-board",{y:0,height:full.h},0);
tl.set(["#chip-claude","#chip-ig","#chip-composio","#socket","#budget-num","#cta-row"],{autoAlpha:0},0);
tl.set(".tile",{autoAlpha:.28},0);
tl.set(".tile .lock",{autoAlpha:0},0);
tl.set("#budget-fill",{scaleX:0},0);
/* чипы и разъём */
SP.chips.forEach(function(c){ pop("#"+c.id,c.at,1.5); });
tl.fromTo("#socket",{autoAlpha:0,scale:.85},{autoAlpha:1,scale:1,duration:.22,ease:"power3.out"},SP.socket.emptyFrom+.1);
/* плитки: очередь заблокированных действий */
SP.tiles.forEach(function(t){
  tl.fromTo("#"+t.id,{scale:.93},{autoAlpha:1,scale:1,borderColor:"#FC5C02",duration:.22,ease:"back.out(1.6)"},t.at);
  tl.to("#"+t.id+" .lock",{autoAlpha:1,duration:.15},t.at+.1);
});
/* бюджет 20 секунд */
var B=SP.budget;
pop("#budget-num",B.appearsAt,1.3);
tl.to("#budget-num",{autoAlpha:0,duration:.14},B.spendsFrom+.5);
tl.to("#budget-fill",{scaleX:B.spent/B.total,duration:B.freezesAt-B.spendsFrom,ease:"none"},B.spendsFrom);
/* коннектор встаёт в разъём */
pop("#chip-composio",SP.socket.composioAt,1.4);
tl.to("#socket",{borderColor:"#B6FF00",borderStyle:"solid",duration:.2},SP.socket.composioAt);
/* лента: доска сжимается, интерфейс на весь канвас */
tl.to(".tile",{autoAlpha:0,duration:.12,stagger:.01},SP.stripFrom-.16);
tl.to("#spine-board",{y:strip.y-full.y,height:strip.h,duration:.3,ease:"power3.inOut"},SP.stripFrom);
/* провод прочерчивается через коннектор */
draw("#wire",SP.socket.wiredAt,.27,500);
/* кульминация: доска раскрывается и заливается лаймом, текст чернеет */
var C=SP.climax.at;
tl.to("#spine-board",{y:0,height:full.h,duration:.35,ease:"power3.inOut"},C);
tl.to("#spine-board",{backgroundColor:"#B6FF00",duration:.5},C);
tl.to([".chip",".chip--composio"],{backgroundColor:"#B6FF00",borderColor:INK,color:INK,duration:.5},C);
tl.to(".chip img",{filter:"invert(0)",duration:.5},C);
tl.to("#wire",{stroke:INK,duration:.5},C);
tl.to("#socket",{borderColor:INK,duration:.5},C);
tl.to("#budget",{backgroundColor:"rgba(17,18,20,.18)",duration:.5},C);
tl.to("#anchor",{backgroundColor:INK,duration:.5},C);
tl.to("#anchor",{backgroundColor:INK,duration:.5},C);
tl.to("#budget-fill",{backgroundColor:INK,duration:.5},C);
tl.set(".tile",{borderColor:INK,color:INK,backgroundColor:"rgba(17,18,20,0)",autoAlpha:0},C+.3);
tl.set(".tile .num",{color:INK},C+.3);
tl.set(".tile-label",{color:INK},C+.3);
tl.set(".tile .lock",{backgroundColor:INK,opacity:.35},C+.3);
tl.to(".tile",{autoAlpha:1,duration:.2,stagger:.05,ease:"power2.out"},C+.35);
/* плитки загораются на своих словах */
SP.flowing.litInPlace.forEach(function(l){
  tl.to("#"+l.tile,{backgroundColor:INK,color:"#B6FF00",duration:.22,ease:"power2.out"},l.at);
  tl.to("#"+l.tile+" .tile-label",{color:"#B6FF00",duration:.22},l.at);
  tl.to("#"+l.tile+" .lock",{opacity:0,duration:.2},l.at);
});
/* знаки платформ на своих словах */
(SP.platforms||[]).forEach(function(pl){ pop("#"+pl.id,pl.at,1.5); });
/* CTA: доска уходит, строка блога подсвечивается */
tl.to("#spine-board",{autoAlpha:0,duration:.08},SP.hideAt);
pop("#cta-row",SP.cta.pointerAt,1.2);
