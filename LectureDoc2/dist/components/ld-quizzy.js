import{b as J}from"../src/chunk-YVC3C62K.js";import{a as W}from"../src/chunk-V7YYNURZ.js";import"../src/chunk-PAEI7YB2.js";import"../src/chunk-5VY55ISN.js";var D=function(a,r){let s=a,f=O[r],e=null,t=0,u=null,m=[],w={},g=function(c,h){t=s*4+17,e=(function(i){let d=new Array(i);for(let l=0;l<i;l+=1){d[l]=new Array(i);for(let z=0;z<i;z+=1)d[l][z]=null}return d})(t),p(0,0),p(t-7,0),p(0,t-7),C(),N(),_(c,h),s>=7&&M(c),u==null&&(u=it(s,f,m)),B(u,h)},p=function(c,h){for(let i=-1;i<=7;i+=1)if(!(c+i<=-1||t<=c+i))for(let d=-1;d<=7;d+=1)h+d<=-1||t<=h+d||(0<=i&&i<=6&&(d==0||d==6)||0<=d&&d<=6&&(i==0||i==6)||2<=i&&i<=4&&2<=d&&d<=4?e[c+i][h+d]=!0:e[c+i][h+d]=!1)},q=function(){let c=0,h=0;for(let i=0;i<8;i+=1){g(!0,i);let d=R.getLostPoint(w);(i==0||c>d)&&(c=d,h=i)}return h},N=function(){for(let c=8;c<t-8;c+=1)e[c][6]==null&&(e[c][6]=c%2==0);for(let c=8;c<t-8;c+=1)e[6][c]==null&&(e[6][c]=c%2==0)},C=function(){let c=R.getPatternPosition(s);for(let h=0;h<c.length;h+=1)for(let i=0;i<c.length;i+=1){let d=c[h],l=c[i];if(e[d][l]==null)for(let z=-2;z<=2;z+=1)for(let y=-2;y<=2;y+=1)z==-2||z==2||y==-2||y==2||z==0&&y==0?e[d+z][l+y]=!0:e[d+z][l+y]=!1}},M=function(c){let h=R.getBCHTypeNumber(s);for(let i=0;i<18;i+=1){let d=!c&&(h>>i&1)==1;e[Math.floor(i/3)][i%3+t-8-3]=d}for(let i=0;i<18;i+=1){let d=!c&&(h>>i&1)==1;e[i%3+t-8-3][Math.floor(i/3)]=d}},_=function(c,h){let i=f<<3|h,d=R.getBCHTypeInfo(i);for(let l=0;l<15;l+=1){let z=!c&&(d>>l&1)==1;l<6?e[l][8]=z:l<8?e[l+1][8]=z:e[t-15+l][8]=z}for(let l=0;l<15;l+=1){let z=!c&&(d>>l&1)==1;l<8?e[8][t-l-1]=z:l<9?e[8][15-l-1+1]=z:e[8][15-l-1]=z}e[t-8][8]=!c},B=function(c,h){let i=-1,d=t-1,l=7,z=0,y=R.getMaskFunction(h);for(let v=t-1;v>0;v-=2)for(v==6&&(v-=1);;){for(let x=0;x<2;x+=1)if(e[d][v-x]==null){let k=!1;z<c.length&&(k=(c[z]>>>l&1)==1),y(d,v-x)&&(k=!k),e[d][v-x]=k,l-=1,l==-1&&(z+=1,l=7)}if(d+=i,d<0||t<=d){d-=i,i=-i;break}}},ot=function(c,h){let i=0,d=0,l=0,z=new Array(h.length),y=new Array(h.length);for(let b=0;b<h.length;b+=1){let E=h[b].dataCount,T=h[b].totalCount-E;d=Math.max(d,E),l=Math.max(l,T),z[b]=new Array(E);for(let L=0;L<z[b].length;L+=1)z[b][L]=255&c.getBuffer()[L+i];i+=E;let Q=R.getErrorCorrectPolynomial(T),j=H(z[b],Q.getLength()-1).mod(Q);y[b]=new Array(Q.getLength()-1);for(let L=0;L<y[b].length;L+=1){let F=L+j.getLength()-y[b].length;y[b][L]=F>=0?j.getAt(F):0}}let v=0;for(let b=0;b<h.length;b+=1)v+=h[b].totalCount;let x=new Array(v),k=0;for(let b=0;b<d;b+=1)for(let E=0;E<h.length;E+=1)b<z[E].length&&(x[k]=z[E][b],k+=1);for(let b=0;b<l;b+=1)for(let E=0;E<h.length;E+=1)b<y[E].length&&(x[k]=y[E][b],k+=1);return x},it=function(c,h,i){let d=G.getRSBlocks(c,h),l=K();for(let y=0;y<i.length;y+=1){let v=i[y];l.put(v.getMode(),4),l.put(v.getLength(),R.getLengthInBits(v.getMode(),c)),v.write(l)}let z=0;for(let y=0;y<d.length;y+=1)z+=d[y].dataCount;if(l.getLengthInBits()>z*8)throw"code length overflow. ("+l.getLengthInBits()+">"+z*8+")";for(l.getLengthInBits()+4<=z*8&&l.put(0,4);l.getLengthInBits()%8!=0;)l.putBit(!1);for(;!(l.getLengthInBits()>=z*8||(l.put(236,8),l.getLengthInBits()>=z*8));)l.put(17,8);return ot(l,d)};w.addData=function(c,h){h=h||"Byte";let i=null;switch(h){case"Numeric":i=at(c);break;case"Alphanumeric":i=ct(c);break;case"Byte":i=ut(c);break;case"Kanji":i=lt(c);break;default:throw"mode:"+h}m.push(i),u=null},w.isDark=function(c,h){if(c<0||t<=c||h<0||t<=h)throw c+","+h;return e[c][h]},w.getModuleCount=function(){return t},w.make=function(){if(s<1){let c=1;for(;c<40;c++){let h=G.getRSBlocks(c,f),i=K();for(let l=0;l<m.length;l++){let z=m[l];i.put(z.getMode(),4),i.put(z.getLength(),R.getLengthInBits(z.getMode(),c)),z.write(i)}let d=0;for(let l=0;l<h.length;l++)d+=h[l].dataCount;if(i.getLengthInBits()<=d*8)break}s=c}g(!1,q())},w.createTableTag=function(c,h){c=c||2,h=typeof h>"u"?c*4:h;let i="";i+='<table style="',i+=" border-width: 0px; border-style: none;",i+=" border-collapse: collapse;",i+=" padding: 0px; margin: "+h+"px;",i+='">',i+="<tbody>";for(let d=0;d<w.getModuleCount();d+=1){i+="<tr>";for(let l=0;l<w.getModuleCount();l+=1)i+='<td style="',i+=" border-width: 0px; border-style: none;",i+=" border-collapse: collapse;",i+=" padding: 0px; margin: 0px;",i+=" width: "+c+"px;",i+=" height: "+c+"px;",i+=" background-color: ",i+=w.isDark(d,l)?"#000000":"#ffffff",i+=";",i+='"/>';i+="</tr>"}return i+="</tbody>",i+="</table>",i},w.createSvgTag=function(c,h,i,d){let l={};typeof arguments[0]=="object"&&(l=arguments[0],c=l.cellSize,h=l.margin,i=l.alt,d=l.title),c=c||2,h=typeof h>"u"?c*4:h,i=typeof i=="string"?{text:i}:i||{},i.text=i.text||null,i.id=i.text?i.id||"qrcode-description":null,d=typeof d=="string"?{text:d}:d||{},d.text=d.text||null,d.id=d.text?d.id||"qrcode-title":null;let z=w.getModuleCount()*c+h*2,y,v,x,k,b="",E;for(E="l"+c+",0 0,"+c+" -"+c+",0 0,-"+c+"z ",b+='<svg version="1.1" xmlns="http://www.w3.org/2000/svg"',b+=l.scalable?"":' width="'+z+'px" height="'+z+'px"',b+=' viewBox="0 0 '+z+" "+z+'" ',b+=' preserveAspectRatio="xMinYMin meet"',b+=d.text||i.text?' role="img" aria-labelledby="'+I([d.id,i.id].join(" ").trim())+'"':"",b+=">",b+=d.text?'<title id="'+I(d.id)+'">'+I(d.text)+"</title>":"",b+=i.text?'<description id="'+I(i.id)+'">'+I(i.text)+"</description>":"",b+='<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>',b+='<path d="',x=0;x<w.getModuleCount();x+=1)for(k=x*c+h,y=0;y<w.getModuleCount();y+=1)w.isDark(x,y)&&(v=y*c+h,b+="M"+v+","+k+E);return b+='" stroke="transparent" fill="black"/>',b+="</svg>",b},w.createDataURL=function(c,h){c=c||2,h=typeof h>"u"?c*4:h;let i=w.getModuleCount()*c+h*2,d=h,l=i-h;return pt(i,i,function(z,y){if(d<=z&&z<l&&d<=y&&y<l){let v=Math.floor((z-d)/c),x=Math.floor((y-d)/c);return w.isDark(x,v)?0:1}else return 1})},w.createImgTag=function(c,h,i){c=c||2,h=typeof h>"u"?c*4:h;let d=w.getModuleCount()*c+h*2,l="";return l+="<img",l+=' src="',l+=w.createDataURL(c,h),l+='"',l+=' width="',l+=d,l+='"',l+=' height="',l+=d,l+='"',i&&(l+=' alt="',l+=I(i),l+='"'),l+="/>",l};let I=function(c){let h="";for(let i=0;i<c.length;i+=1){let d=c.charAt(i);switch(d){case"<":h+="&lt;";break;case">":h+="&gt;";break;case"&":h+="&amp;";break;case'"':h+="&quot;";break;default:h+=d;break}}return h},st=function(c){c=typeof c>"u"?2:c;let i=w.getModuleCount()*1+c*2,d=c,l=i-c,z,y,v,x,k,b={"\u2588\u2588":"\u2588","\u2588 ":"\u2580"," \u2588":"\u2584","  ":" "},E={"\u2588\u2588":"\u2580","\u2588 ":"\u2580"," \u2588":" ","  ":" "},T="";for(z=0;z<i;z+=2){for(v=Math.floor((z-d)/1),x=Math.floor((z+1-d)/1),y=0;y<i;y+=1)k="\u2588",d<=y&&y<l&&d<=z&&z<l&&w.isDark(v,Math.floor((y-d)/1))&&(k=" "),d<=y&&y<l&&d<=z+1&&z+1<l&&w.isDark(x,Math.floor((y-d)/1))?k+=" ":k+="\u2588",T+=c<1&&z+1>=l?E[k]:b[k];T+=`
`}return i%2&&c>0?T.substring(0,T.length-i-1)+Array(i+1).join("\u2580"):T.substring(0,T.length-1)};return w.createASCII=function(c,h){if(c=c||1,c<2)return st(h);c-=1,h=typeof h>"u"?c*2:h;let i=w.getModuleCount()*c+h*2,d=h,l=i-h,z,y,v,x,k=Array(c+1).join("\u2588\u2588"),b=Array(c+1).join("  "),E="",T="";for(z=0;z<i;z+=1){for(v=Math.floor((z-d)/c),T="",y=0;y<i;y+=1)x=1,d<=y&&y<l&&d<=z&&z<l&&w.isDark(v,Math.floor((y-d)/c))&&(x=0),T+=x?k:b;for(v=0;v<c;v+=1)E+=T+`
`}return E.substring(0,E.length-1)},w.renderTo2dContext=function(c,h){h=h||2;let i=w.getModuleCount();for(let d=0;d<i;d++)for(let l=0;l<i;l++)c.fillStyle=w.isDark(d,l)?"black":"white",c.fillRect(l*h,d*h,h,h)},w};D.stringToBytes=function(a){let r=[];for(let o=0;o<a.length;o+=1){let n=a.charCodeAt(o);r.push(n&255)}return r};D.createStringToBytes=function(a,r){let o=(function(){let s=dt(a),f=function(){let u=s.read();if(u==-1)throw"eof";return u},e=0,t={};for(;;){let u=s.read();if(u==-1)break;let m=f(),w=f(),g=f(),p=String.fromCharCode(u<<8|m),q=w<<8|g;t[p]=q,e+=1}if(e!=r)throw e+" != "+r;return t})(),n=63;return function(s){let f=[];for(let e=0;e<s.length;e+=1){let t=s.charCodeAt(e);if(t<128)f.push(t);else{let u=o[s.charAt(e)];typeof u=="number"?(u&255)==u?f.push(u):(f.push(u>>>8),f.push(u&255)):f.push(n)}}return f}};var A={MODE_NUMBER:1,MODE_ALPHA_NUM:2,MODE_8BIT_BYTE:4,MODE_KANJI:8},O={L:1,M:0,Q:3,H:2},P={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7},R=(function(){let a=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],r=1335,o=7973,n=21522,s={},f=function(e){let t=0;for(;e!=0;)t+=1,e>>>=1;return t};return s.getBCHTypeInfo=function(e){let t=e<<10;for(;f(t)-f(r)>=0;)t^=r<<f(t)-f(r);return(e<<10|t)^n},s.getBCHTypeNumber=function(e){let t=e<<12;for(;f(t)-f(o)>=0;)t^=o<<f(t)-f(o);return e<<12|t},s.getPatternPosition=function(e){return a[e-1]},s.getMaskFunction=function(e){switch(e){case P.PATTERN000:return function(t,u){return(t+u)%2==0};case P.PATTERN001:return function(t,u){return t%2==0};case P.PATTERN010:return function(t,u){return u%3==0};case P.PATTERN011:return function(t,u){return(t+u)%3==0};case P.PATTERN100:return function(t,u){return(Math.floor(t/2)+Math.floor(u/3))%2==0};case P.PATTERN101:return function(t,u){return t*u%2+t*u%3==0};case P.PATTERN110:return function(t,u){return(t*u%2+t*u%3)%2==0};case P.PATTERN111:return function(t,u){return(t*u%3+(t+u)%2)%2==0};default:throw"bad maskPattern:"+e}},s.getErrorCorrectPolynomial=function(e){let t=H([1],0);for(let u=0;u<e;u+=1)t=t.multiply(H([1,S.gexp(u)],0));return t},s.getLengthInBits=function(e,t){if(1<=t&&t<10)switch(e){case A.MODE_NUMBER:return 10;case A.MODE_ALPHA_NUM:return 9;case A.MODE_8BIT_BYTE:return 8;case A.MODE_KANJI:return 8;default:throw"mode:"+e}else if(t<27)switch(e){case A.MODE_NUMBER:return 12;case A.MODE_ALPHA_NUM:return 11;case A.MODE_8BIT_BYTE:return 16;case A.MODE_KANJI:return 10;default:throw"mode:"+e}else if(t<41)switch(e){case A.MODE_NUMBER:return 14;case A.MODE_ALPHA_NUM:return 13;case A.MODE_8BIT_BYTE:return 16;case A.MODE_KANJI:return 12;default:throw"mode:"+e}else throw"type:"+t},s.getLostPoint=function(e){let t=e.getModuleCount(),u=0;for(let g=0;g<t;g+=1)for(let p=0;p<t;p+=1){let q=0,N=e.isDark(g,p);for(let C=-1;C<=1;C+=1)if(!(g+C<0||t<=g+C))for(let M=-1;M<=1;M+=1)p+M<0||t<=p+M||C==0&&M==0||N==e.isDark(g+C,p+M)&&(q+=1);q>5&&(u+=3+q-5)}for(let g=0;g<t-1;g+=1)for(let p=0;p<t-1;p+=1){let q=0;e.isDark(g,p)&&(q+=1),e.isDark(g+1,p)&&(q+=1),e.isDark(g,p+1)&&(q+=1),e.isDark(g+1,p+1)&&(q+=1),(q==0||q==4)&&(u+=3)}for(let g=0;g<t;g+=1)for(let p=0;p<t-6;p+=1)e.isDark(g,p)&&!e.isDark(g,p+1)&&e.isDark(g,p+2)&&e.isDark(g,p+3)&&e.isDark(g,p+4)&&!e.isDark(g,p+5)&&e.isDark(g,p+6)&&(u+=40);for(let g=0;g<t;g+=1)for(let p=0;p<t-6;p+=1)e.isDark(p,g)&&!e.isDark(p+1,g)&&e.isDark(p+2,g)&&e.isDark(p+3,g)&&e.isDark(p+4,g)&&!e.isDark(p+5,g)&&e.isDark(p+6,g)&&(u+=40);let m=0;for(let g=0;g<t;g+=1)for(let p=0;p<t;p+=1)e.isDark(p,g)&&(m+=1);let w=Math.abs(100*m/t/t-50)/5;return u+=w*10,u},s})(),S=(function(){let a=new Array(256),r=new Array(256);for(let n=0;n<8;n+=1)a[n]=1<<n;for(let n=8;n<256;n+=1)a[n]=a[n-4]^a[n-5]^a[n-6]^a[n-8];for(let n=0;n<255;n+=1)r[a[n]]=n;let o={};return o.glog=function(n){if(n<1)throw"glog("+n+")";return r[n]},o.gexp=function(n){for(;n<0;)n+=255;for(;n>=256;)n-=255;return a[n]},o})(),H=function(a,r){if(typeof a.length>"u")throw a.length+"/"+r;let o=(function(){let s=0;for(;s<a.length&&a[s]==0;)s+=1;let f=new Array(a.length-s+r);for(let e=0;e<a.length-s;e+=1)f[e]=a[e+s];return f})(),n={};return n.getAt=function(s){return o[s]},n.getLength=function(){return o.length},n.multiply=function(s){let f=new Array(n.getLength()+s.getLength()-1);for(let e=0;e<n.getLength();e+=1)for(let t=0;t<s.getLength();t+=1)f[e+t]^=S.gexp(S.glog(n.getAt(e))+S.glog(s.getAt(t)));return H(f,0)},n.mod=function(s){if(n.getLength()-s.getLength()<0)return n;let f=S.glog(n.getAt(0))-S.glog(s.getAt(0)),e=new Array(n.getLength());for(let t=0;t<n.getLength();t+=1)e[t]=n.getAt(t);for(let t=0;t<s.getLength();t+=1)e[t]^=S.gexp(S.glog(s.getAt(t))+f);return H(e,0).mod(s)},n},G=(function(){let a=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],r=function(s,f){let e={};return e.totalCount=s,e.dataCount=f,e},o={},n=function(s,f){switch(f){case O.L:return a[(s-1)*4+0];case O.M:return a[(s-1)*4+1];case O.Q:return a[(s-1)*4+2];case O.H:return a[(s-1)*4+3];default:return}};return o.getRSBlocks=function(s,f){let e=n(s,f);if(typeof e>"u")throw"bad rs block @ typeNumber:"+s+"/errorCorrectionLevel:"+f;let t=e.length/3,u=[];for(let m=0;m<t;m+=1){let w=e[m*3+0],g=e[m*3+1],p=e[m*3+2];for(let q=0;q<w;q+=1)u.push(r(g,p))}return u},o})(),K=function(){let a=[],r=0,o={};return o.getBuffer=function(){return a},o.getAt=function(n){let s=Math.floor(n/8);return(a[s]>>>7-n%8&1)==1},o.put=function(n,s){for(let f=0;f<s;f+=1)o.putBit((n>>>s-f-1&1)==1)},o.getLengthInBits=function(){return r},o.putBit=function(n){let s=Math.floor(r/8);a.length<=s&&a.push(0),n&&(a[s]|=128>>>r%8),r+=1},o},at=function(a){let r=A.MODE_NUMBER,o=a,n={};n.getMode=function(){return r},n.getLength=function(e){return o.length},n.write=function(e){let t=o,u=0;for(;u+2<t.length;)e.put(s(t.substring(u,u+3)),10),u+=3;u<t.length&&(t.length-u==1?e.put(s(t.substring(u,u+1)),4):t.length-u==2&&e.put(s(t.substring(u,u+2)),7))};let s=function(e){let t=0;for(let u=0;u<e.length;u+=1)t=t*10+f(e.charAt(u));return t},f=function(e){if("0"<=e&&e<="9")return e.charCodeAt(0)-48;throw"illegal char :"+e};return n},ct=function(a){let r=A.MODE_ALPHA_NUM,o=a,n={};n.getMode=function(){return r},n.getLength=function(f){return o.length},n.write=function(f){let e=o,t=0;for(;t+1<e.length;)f.put(s(e.charAt(t))*45+s(e.charAt(t+1)),11),t+=2;t<e.length&&f.put(s(e.charAt(t)),6)};let s=function(f){if("0"<=f&&f<="9")return f.charCodeAt(0)-48;if("A"<=f&&f<="Z")return f.charCodeAt(0)-65+10;switch(f){case" ":return 36;case"$":return 37;case"%":return 38;case"*":return 39;case"+":return 40;case"-":return 41;case".":return 42;case"/":return 43;case":":return 44;default:throw"illegal char :"+f}};return n},ut=function(a){let r=A.MODE_8BIT_BYTE,o=a,n=D.stringToBytes(a),s={};return s.getMode=function(){return r},s.getLength=function(f){return n.length},s.write=function(f){for(let e=0;e<n.length;e+=1)f.put(n[e],8)},s},lt=function(a){let r=A.MODE_KANJI,o=a,n=D.stringToBytes;(function(e,t){let u=n(e);if(u.length!=2||(u[0]<<8|u[1])!=t)throw"sjis not supported."})("\u53CB",38726);let s=n(a),f={};return f.getMode=function(){return r},f.getLength=function(e){return~~(s.length/2)},f.write=function(e){let t=s,u=0;for(;u+1<t.length;){let m=(255&t[u])<<8|255&t[u+1];if(33088<=m&&m<=40956)m-=33088;else if(57408<=m&&m<=60351)m-=49472;else throw"illegal char at "+(u+1)+"/"+m;m=(m>>>8&255)*192+(m&255),e.put(m,13),u+=2}if(u<t.length)throw"illegal char at "+(u+1)},f},V=function(){let a=[],r={};return r.writeByte=function(o){a.push(o&255)},r.writeShort=function(o){r.writeByte(o),r.writeByte(o>>>8)},r.writeBytes=function(o,n,s){n=n||0,s=s||o.length;for(let f=0;f<s;f+=1)r.writeByte(o[f+n])},r.writeString=function(o){for(let n=0;n<o.length;n+=1)r.writeByte(o.charCodeAt(n))},r.toByteArray=function(){return a},r.toString=function(){let o="";o+="[";for(let n=0;n<a.length;n+=1)n>0&&(o+=","),o+=a[n];return o+="]",o},r},ft=function(){let a=0,r=0,o=0,n="",s={},f=function(t){n+=String.fromCharCode(e(t&63))},e=function(t){if(t<0)throw"n:"+t;if(t<26)return 65+t;if(t<52)return 97+(t-26);if(t<62)return 48+(t-52);if(t==62)return 43;if(t==63)return 47;throw"n:"+t};return s.writeByte=function(t){for(a=a<<8|t&255,r+=8,o+=1;r>=6;)f(a>>>r-6),r-=6},s.flush=function(){if(r>0&&(f(a<<6-r),a=0,r=0),o%3!=0){let t=3-o%3;for(let u=0;u<t;u+=1)n+="="}},s.toString=function(){return n},s},dt=function(a){let r=a,o=0,n=0,s=0,f={};f.read=function(){for(;s<8;){if(o>=r.length){if(s==0)return-1;throw"unexpected end of file./"+s}let u=r.charAt(o);if(o+=1,u=="=")return s=0,-1;if(u.match(/^\s$/))continue;n=n<<6|e(u.charCodeAt(0)),s+=6}let t=n>>>s-8&255;return s-=8,t};let e=function(t){if(65<=t&&t<=90)return t-65;if(97<=t&&t<=122)return t-97+26;if(48<=t&&t<=57)return t-48+52;if(t==43)return 62;if(t==47)return 63;throw"c:"+t};return f},ht=function(a,r){let o=a,n=r,s=new Array(a*r),f={};f.setPixel=function(m,w,g){s[w*o+m]=g},f.write=function(m){m.writeString("GIF87a"),m.writeShort(o),m.writeShort(n),m.writeByte(128),m.writeByte(0),m.writeByte(0),m.writeByte(0),m.writeByte(0),m.writeByte(0),m.writeByte(255),m.writeByte(255),m.writeByte(255),m.writeString(","),m.writeShort(0),m.writeShort(0),m.writeShort(o),m.writeShort(n),m.writeByte(0);let w=2,g=t(w);m.writeByte(w);let p=0;for(;g.length-p>255;)m.writeByte(255),m.writeBytes(g,p,255),p+=255;m.writeByte(g.length-p),m.writeBytes(g,p,g.length-p),m.writeByte(0),m.writeString(";")};let e=function(m){let w=m,g=0,p=0,q={};return q.write=function(N,C){if(N>>>C)throw"length over";for(;g+C>=8;)w.writeByte(255&(N<<g|p)),C-=8-g,N>>>=8-g,p=0,g=0;p=N<<g|p,g=g+C},q.flush=function(){g>0&&w.writeByte(p)},q},t=function(m){let w=1<<m,g=(1<<m)+1,p=m+1,q=u();for(let B=0;B<w;B+=1)q.add(String.fromCharCode(B));q.add(String.fromCharCode(w)),q.add(String.fromCharCode(g));let N=V(),C=e(N);C.write(w,p);let M=0,_=String.fromCharCode(s[M]);for(M+=1;M<s.length;){let B=String.fromCharCode(s[M]);M+=1,q.contains(_+B)?_=_+B:(C.write(q.indexOf(_),p),q.size()<4095&&(q.size()==1<<p&&(p+=1),q.add(_+B)),_=B)}return C.write(q.indexOf(_),p),C.write(g,p),C.flush(),N.toByteArray()},u=function(){let m={},w=0,g={};return g.add=function(p){if(g.contains(p))throw"dup key:"+p;m[p]=w,w+=1},g.size=function(){return w},g.indexOf=function(p){return m[p]},g.contains=function(p){return typeof m[p]<"u"},g};return f},pt=function(a,r,o){let n=ht(a,r);for(let t=0;t<r;t+=1)for(let u=0;u<a;u+=1)n.setPixel(u,t,o(u,t));let s=V();n.write(s);let f=ft(),e=s.toByteArray();for(let t=0;t<e.length;t+=1)f.writeByte(e[t]);return f.flush(),"data:image/gif;base64,"+f},Y=D,At=D.stringToBytes;var gt={0:"L",1:"M",2:"Q",3:"H"};function X(a,r,o={}){let n=o.errorCorrectionLevel||"Q",s=typeof n=="number"?gt[n]||"Q":n,f=Y(o.typeNumber||0,s);f.addData(r),f.make();let e=f.getModuleCount(),t=typeof o.margin=="number"?o.margin:4,u=o.width?Math.floor(o.width/(e+2*t)):4,m=u*e+2*u*t;a.width=m,a.height=m;let w=a.getContext("2d");w.fillStyle=o.colorLight||"#ffffff",w.fillRect(0,0,m,m),w.fillStyle=o.colorDark||"#000000";let g=u*t;for(let p=0;p<e;p++)for(let q=0;q<e;q++)f.isDark(p,q)&&w.fillRect(g+q*u,g+p*u,u,u)}var zt=(a,...r)=>String.raw({raw:a},...r),Z=zt`
:host {
    display: block;
    font-family:
        system-ui,
        -apple-system,
        sans-serif;

    --quiz-primary: #2563eb;
    --quiz-primary-dark: #1d4ed8;
    --quiz-primary-alpha-10: rgba(37, 99, 235, 0.1);
    --quiz-primary-alpha-5: rgba(37, 99, 235, 0.05);

    --quiz-success: #16a34a;
    --quiz-success-dark: #15803d;
    --quiz-success-alpha-10: rgba(22, 163, 74, 0.1);

    --quiz-danger: #dc2626;
    --quiz-danger-dark: #b91c1c;
    --quiz-danger-alpha-5: rgba(220, 38, 38, 0.05);
    --quiz-danger-alpha-20: rgba(220, 38, 38, 0.2);

    --quiz-warning: #ca8a04;

    --quiz-bg: #f8fafc;
    --quiz-surface: #ffffff;
    --quiz-surface-alt: #f8fafc;

    --quiz-text: #1e293b;
    --quiz-text-secondary: #64748b;

    --quiz-border: #e2e8f0;
    --quiz-border-strong: #cbd5e1;

    --quiz-radius: 0.5rem;
    --quiz-radius-sm: 0.25rem;

    --quiz-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --quiz-focus-ring: 0 0 0 3px var(--quiz-primary-alpha-10);

    --quiz-space-xs: 0.5rem;
    --quiz-space-sm: 0.75rem;
    --quiz-space-md: 1rem;
    --quiz-space-lg: 1.5rem;

    color: var(--quiz-text);
}

.quiz-container {
    background: var(--quiz-surface);
    border: 1px solid var(--quiz-border);
    border-radius: var(--quiz-radius);
    padding: var(--quiz-space-lg);
    box-shadow: var(--quiz-shadow);
    max-width: 100%;
    box-sizing: border-box;
}

.quiz-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 var(--quiz-space-md) 0;
    color: var(--quiz-text);
}

.quiz-form {
    display: flex;
    flex-direction: column;
    gap: var(--quiz-space-sm);
}

.quiz-input {
    padding: var(--quiz-space-sm) var(--quiz-space-md);
    border: 1px solid var(--quiz-border);
    border-radius: var(--quiz-radius);
    font-size: 1rem;
    background: var(--quiz-surface-alt);
    color: var(--quiz-text);
    width: 100%;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: var(--quiz-primary);
        box-shadow: var(--quiz-focus-ring);
    }
}

.quiz-btn {
    padding: var(--quiz-space-sm) var(--quiz-space-md);
    border: none;
    border-radius: var(--quiz-radius);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--quiz-space-xs);

    &.quiz-btn-primary {
        background: var(--quiz-primary);
        color: var(--quiz-surface);

        &:hover {
            background: var(--quiz-primary-dark);
        }
    }

    &.quiz-btn-secondary {
        background: var(--quiz-surface-alt);
        color: var(--quiz-text);
        border: 1px solid var(--quiz-border);

        &:hover {
            background: var(--quiz-border);
        }
    }

    &.quiz-btn-success {
        background: var(--quiz-success);
        color: var(--quiz-surface);
    }

    &.quiz-btn-danger {
        background: var(--quiz-danger);
        color: var(--quiz-surface);
    }
}

.quiz-lobby {
    text-align: center;
}

.quiz-qr-container {
    margin: var(--quiz-space-md) auto;
    display: inline-block;
    background: var(--quiz-surface);
    padding: var(--quiz-space-xs);
    border-radius: var(--quiz-radius);
    border: 1px solid var(--quiz-border);

    canvas {
        display: block;
        max-width: 100%;
        height: auto;
        image-rendering: pixelated;
    }
}

.quiz-join-url {
    font-size: 0.875rem;
    color: var(--quiz-text-secondary);
    margin-top: var(--quiz-space-xs);
    word-break: break-all;
}

.quiz-participant-count {
    font-size: 1rem;
    color: var(--quiz-text-secondary);
    margin: var(--quiz-space-md) 0;
}

.quiz-question {
    text-align: center;

    &.quiz-question-text {
        font-size: 1.125rem;
        font-weight: 500;
        margin: var(--quiz-space-md) 0;
        line-height: 1.5;
    }

    &.quiz-question-counter {
        font-size: 0.875rem;
        color: var(--quiz-text-secondary);
        margin-bottom: var(--quiz-space-xs);
    }
}

.quiz-options {
    display: flex;
    flex-direction: column;
    gap: var(--quiz-space-xs);
    margin-top: var(--quiz-space-md);
}

.quiz-option {
    padding: var(--quiz-space-md);
    border: 1px solid var(--quiz-border);
    border-radius: var(--quiz-radius);
    background: var(--quiz-surface-alt);
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
    user-select: none;

    &:hover {
        background: var(--quiz-border);
    }

    &.selected {
        background: var(--quiz-primary-alpha-10);
        border-color: var(--quiz-primary);
        font-weight: 500;
    }

    &.correct {
        background: var(--quiz-success-alpha-10);
        border-color: var(--quiz-success);
    }

    &.incorrect {
        opacity: 0.6;
    }
}

.quiz-timer {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--quiz-primary);
    margin: var(--quiz-space-xs) 0;

    &.urgent {
        color: var(--quiz-danger);
    }
}

.quiz-leaderboard {
    margin-top: var(--quiz-space-md);

    &.quiz-leaderboard-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--quiz-space-sm) var(--quiz-space-md);
        border-bottom: 1px solid var(--quiz-border);

        &:first-child {
            background: var(--quiz-primary-alpha-5);
            font-weight: 600;
        }
    }

    &.quiz-leaderboard-rank {
        width: 2rem;
        text-align: center;
        font-weight: 600;
    }

    &.quiz-leaderboard-name {
        flex: 1;
        margin-left: var(--quiz-space-md);
    }

    &.quiz-leaderboard-score {
        font-weight: 600;
        color: var(--quiz-primary);
    }
}

.quiz-error {
    color: var(--quiz-danger);
    background: var(--quiz-danger-alpha-5);
    padding: var(--quiz-space-sm) var(--quiz-space-md);
    border-radius: var(--quiz-radius);
    border: 1px solid var(--quiz-danger-alpha-20);
    margin: var(--quiz-space-xs) 0;
}

.quiz-info {
    color: var(--quiz-text-secondary);
    font-size: 0.875rem;
    margin: var(--quiz-space-xs) 0;
}

.quiz-controls {
    display: flex;
    gap: var(--quiz-space-xs);
    justify-content: center;
    margin-top: var(--quiz-space-md);
    flex-wrap: wrap;
}

/* Quiz preview */
.quiz-preview {
    text-align: center;
}

.quiz-meta {
    color: var(--quiz-text-secondary);
    font-size: 0.875rem;
    margin: var(--quiz-space-xs) 0 var(--quiz-space-md) 0;
}

/* File upload */
.quiz-upload {
    text-align: center;
}

.quiz-file-label {
    display: inline-block;
    cursor: pointer;
    margin: var(--quiz-space-sm) 0;
}

.quiz-file-input {
    display: none;
}

.quiz-file-btn {
    display: inline-block;
    padding: var(--quiz-space-sm) var(--quiz-space-md);
    border: 1px solid var(--quiz-border);
    border-radius: var(--quiz-radius);
    background: var(--quiz-surface-alt);
    color: var(--quiz-text);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
        background: var(--quiz-border);
    }
}

.quiz-file-name {
    color: var(--quiz-text-secondary);
    font-size: 0.875rem;
    margin-bottom: var(--quiz-space-sm);
    word-break: break-all;
}

.quiz-preview-container {
    margin-top: var(--quiz-space-md);
    padding-top: var(--quiz-space-md);
    border-top: 1px solid var(--quiz-border);
}

@media (max-width: 480px) {
    .quiz-container {
        padding: var(--quiz-space-md);
    }
}
`;var tt="protocol_mismatch";function et(a){return a===1}function rt(a){return`Quiz protocol mismatch: this side speaks version 1, the other side speaks ${a==null?"no version at all":`version ${a}`}. Update whichever of the two is older -- the embedded quiz component or the quiz server.`}var $=new Map;function yt(a){return a.replace(/^http/,"ws")}function nt(a,r){let o=new URL(a);for(let[n,s]of Object.entries(r))o.searchParams.set(n,String(s));return o.href}async function bt(a){let r=new URL("/api/config",a),o;try{o=await fetch(r,{credentials:"omit"})}catch(e){throw new Error(`Cannot reach the quiz server at ${a}.`,{cause:e})}if(!o.ok)throw new Error(`The quiz server at ${a} did not answer ${r.pathname} (HTTP ${o.status}). Is server-url pointing at a quiz server?`);let n=await o.json();if(!n||typeof n!="object")throw new Error(`The quiz server at ${a} returned an unusable configuration.`);let f=["ws","join","control","katexCss"].filter(e=>typeof n[e]!="string"||n[e]==="");if(f.length>0)throw new Error(`The quiz server at ${a} did not publish: ${f.join(", ")}.`);return{protocolVersion:n.protocolVersion,serverVersion:n.serverVersion,wsUrl:yt(new URL(n.ws,a).href),joinUrl:new URL(n.join,a).href,controlUrl:new URL(n.control,a).href,katexCssUrl:new URL(n.katexCss,a).href,maxQuizSize:n.maxQuizSize}}function qt(a){let r=$.get(a);return r||(r=bt(a),r.catch(()=>$.delete(a)),$.set(a,r)),r}function vt(a,r){let o=new CSSStyleSheet;o.replaceSync(r),a.adoptedStyleSheets=[...a.adoptedStyleSheets,o]}function xt(a,r){return new Promise(o=>{let n=document.createElement("link");n.rel="stylesheet",n.href=r,n.addEventListener("load",()=>o(!0),{once:!0}),n.addEventListener("error",()=>{console.warn(`loading the math stylesheet failed: ${r}`),o(!1)},{once:!0}),a.appendChild(n)})}var U=class a extends HTMLElement{static MIN_PRESENTER_NAME_LENGTH=4;constructor(){super(),this.presenterName=null,this.presenterToken=null,this.attachShadow({mode:"open"}),this.quiz=null,this.isEncrypted=void 0,this.ws=null,this.roomId=null,this.reconnectAttempts=0,this.maxReconnectAttempts=5,this.reconnectDelay=1e3,this.currentState="login",this.serverUrl="",this.config=null,this.presenterNameHint=""}async connectedCallback(){this.quiz=this.getAttribute("quiz"),this.isEncrypted=this.hasAttribute("encrypted"),this.serverUrl=this.getAttribute("server-url")||window.location.origin,this.presenterNameHint=(this.getAttribute("presenter-name")||"").trim(),vt(this.shadowRoot,Z);let r=document.createElement("div");if(r.className="quiz-container",this.contentEl=document.createElement("div"),this.contentEl.id="content",r.appendChild(this.contentEl),this.shadowRoot.appendChild(r),!window.isSecureContext){this.showError("Quizzy requires a secure context (https, or localhost / 127.0.0.1 / [::1]).");return}try{this.config=await qt(this.serverUrl)}catch(o){console.error("loading the quiz server configuration failed",o),this.showError(o.message);return}if(!et(this.config.protocolVersion)){this.showError(rt(this.config.protocolVersion));return}if(this.config.katexCssUrl&&xt(this.shadowRoot,this.config.katexCssUrl),this.isEncrypted){if(!this.quiz){this.showError("No encrypted quiz provided.");return}this.renderLogin()}else if(this.quiz)try{this.quiz=JSON.parse(this.quiz),this.renderQuizPreview()}catch(o){this.showError("Invalid quiz JSON"),console.error("processing json failed",this.quiz,o)}else this.renderFileUpload()}disconnectedCallback(){try{this.ws&&this.ws.close()}catch(r){console.error("closing websocket connection failed",r)}}renderLogin(){this.currentState="login",this.contentEl.innerHTML=`
      <h2 class="quiz-title">Quiz Login</h2>
      <form class="quiz-form" id="login-form">
        <input type="text" class="quiz-input" id="presenter-name" placeholder="Your name (at least 4 characters)"
               autocomplete="off" autocapitalize="off" spellcheck="false" minlength="${a.MIN_PRESENTER_NAME_LENGTH}">
        <input type="password" class="quiz-input" id="password" placeholder="Enter your password" autocomplete="off">
        <button type="submit" class="quiz-btn quiz-btn-primary">Start Quiz</button>
      </form>
      <div class="quiz-info">Use the same name again to reattach to a running session.</div>
      <div id="error" class="quiz-error" style="display:none"></div>
    `;let r=this.shadowRoot.getElementById("login-form"),o=this.shadowRoot.getElementById("presenter-name"),n=this.shadowRoot.getElementById("password"),s=this.shadowRoot.getElementById("error");this.prefillPresenterName(o),r.addEventListener("submit",async f=>{f.preventDefault();let e=n.value;if(!e)return;let t=a.normalizePresenterName(o.value);if(t.length<a.MIN_PRESENTER_NAME_LENGTH){s.textContent=`Please enter a name of at least ${a.MIN_PRESENTER_NAME_LENGTH} characters.`,s.style.display="block";return}s.style.display="none",n.disabled=!0,o.disabled=!0,r.querySelector("button").textContent="Decrypting...";try{this.quiz=JSON.parse(await J(this.quiz,e)),this.presenterName=t,a.savePresenterName(o.value),await this.connectWebSocket()}catch(u){console.error("decrypting quiz failed",u),s.textContent="Invalid password or corrupted quiz data",s.style.display="block",n.disabled=!1,o.disabled=!1,r.querySelector("button").textContent="Start Quiz"}})}static normalizePresenterName(r){return String(r||"").normalize("NFKC").trim().replace(/\s+/g," ").toLowerCase()}static savePresenterName(r){try{localStorage.setItem("ld-quiz-presenter-name",r)}catch{}}static loadPresenterName(){try{return localStorage.getItem("ld-quiz-presenter-name")||""}catch{return""}}async hashQuiz(r,o){let n=new TextEncoder,s=a.normalizePresenterName(o),f=n.encode(`${s}\0${JSON.stringify(r)}`),e=await crypto.subtle.digest("SHA-256",f);return Array.from(new Uint8Array(e)).map(u=>u.toString(16).padStart(2,"0")).join("")}renderQuizPreview(){this.currentState="preview",this.contentEl.innerHTML=`
      <div class="quiz-preview">
        <h2 class="quiz-title">${this.escapeHtml(this.quiz.title||"Quiz")}</h2>
        <div class="quiz-meta">${this.quiz.questions.length} questions</div>
        ${a.presenterNameFieldHtml()}
        <button class="quiz-btn quiz-btn-primary" id="btn-start">Start Quiz</button>
        <div id="name-error" class="quiz-error" style="display:none"></div>
      </div>
    `,this.bindPresenterNameField(),this.shadowRoot.getElementById("btn-start").addEventListener("click",()=>this.startWithPresenterName())}static presenterNameFieldHtml(){return`
      <input type="text" class="quiz-input" id="presenter-name"
             placeholder="Your name (at least ${a.MIN_PRESENTER_NAME_LENGTH} characters)"
             autocomplete="off" autocapitalize="off" spellcheck="false">
      <div class="quiz-info">Use the same name again to reattach to a running session.</div>`}bindPresenterNameField(){this.prefillPresenterName(this.shadowRoot.getElementById("presenter-name"))}prefillPresenterName(r){if(!r)return;let o=this.presenterNameHint||a.loadPresenterName();o&&(r.value=o)}async startWithPresenterName(){let r=this.shadowRoot.getElementById("presenter-name"),o=this.shadowRoot.getElementById("name-error"),n=a.normalizePresenterName(r?r.value:"");if(n.length<a.MIN_PRESENTER_NAME_LENGTH){o&&(o.textContent=`Please enter a name of at least ${a.MIN_PRESENTER_NAME_LENGTH} characters.`,o.style.display="block");return}o&&(o.style.display="none"),this.presenterName=n,a.savePresenterName(r.value),await this.connectWebSocket()}renderFileUpload(){this.currentState="upload",this.contentEl.innerHTML=`
      <div class="quiz-upload">
        <h2 class="quiz-title">Upload Quiz</h2>
        <p class="quiz-info">Select a JSON quiz file to upload</p>
        <label class="quiz-file-label">
          <input type="file" class="quiz-file-input" id="quiz-file" accept=".json">
          <span class="quiz-file-btn">Choose File</span>
        </label>
        <div id="quiz-file-name" class="quiz-file-name"></div>
        <div id="quiz-preview" class="quiz-preview-container" style="display:none"></div>
        <div id="error" class="quiz-error" style="display:none"></div>
      </div>
    `;let r=this.shadowRoot.getElementById("quiz-file"),o=this.shadowRoot.getElementById("quiz-file-name"),n=this.shadowRoot.getElementById("quiz-preview"),s=this.shadowRoot.getElementById("error");r.addEventListener("change",async f=>{let e=f.target.files[0];if(e){s.style.display="none",o.textContent=e.name;try{let t=await e.text(),u=JSON.parse(t);this.quiz=u,n.style.display="block",n.innerHTML=`
          <h3 class="quiz-title">${this.escapeHtml(u.title||"Quiz")}</h3>
          <div class="quiz-meta">${u.questions.length} questions</div>
          ${a.presenterNameFieldHtml()}
          <button class="quiz-btn quiz-btn-primary" id="btn-start-upload">Start Quiz</button>
          <div id="name-error" class="quiz-error" style="display:none"></div>
        `,this.bindPresenterNameField(),this.shadowRoot.getElementById("btn-start-upload").addEventListener("click",()=>this.startWithPresenterName())}catch(t){console.error("failed processing JSON file",t),s.textContent="Invalid JSON file",s.style.display="block",n.style.display="none"}}})}async connectWebSocket(){this.presenterToken||(this.presenterToken=await this.hashQuiz(this.quiz,this.presenterName));let r=this.config;this.ws=new WebSocket(r.wsUrl),this.ws.onopen=()=>{this.reconnectAttempts=0;let o=JSON.stringify({type:"create_room",protocolVersion:1,presenterToken:this.presenterToken,quiz:this.quiz});if(new TextEncoder().encode(o).length>r.maxQuizSize){let s=(r.maxQuizSize/1048576).toFixed(1);this.showError(`Quiz data exceeds the server's maximum size of ${s}MB`),this.ws.close();return}this.ws.send(o)},this.ws.onmessage=o=>{let n=JSON.parse(o.data);this.handleMessage(n)},this.ws.onclose=()=>{this.currentState!=="ended"&&this.reconnectAttempts<this.maxReconnectAttempts&&setTimeout(()=>{this.reconnectAttempts++,this.connectWebSocket().catch(o=>console.error("reconnect failed",o))},this.reconnectDelay*this.reconnectAttempts)},this.ws.onerror=o=>{console.error("WebSocket error:",o)}}handleMessage(r){switch(r.type){case"error":r.code===tt&&(this.currentState="ended"),this.showError(r.message||"An error occurred");break;case"room_created":this.roomId=r.roomId,r.resumed&&console.info(`Reattached to running session ${r.roomId} (state: ${r.state}, participants: ${r.participantCount}).`),Array.isArray(r.warnings)&&r.warnings.length>0&&console.warn(`Quizzy removed markup from this quiz (${r.warnings.length} item(s)):
  `+r.warnings.join(`
  `)),this.renderLobby(),this.openControlWindow();break;case"participant_joined":this.updateParticipantCount(r.count);break;case"participant_left":this.updateParticipantCount(r.count);break}}renderLobby(){this.currentState="lobby";let r=nt(this.config.joinUrl,{room:this.roomId});this.contentEl.innerHTML=`
      <div class="quiz-lobby">
        <h2 class="quiz-title">${this.quiz.title||"Quiz"}</h2>
        <div class="quiz-participant-count">Participants: <span id="count">0</span></div>
        <div class="quiz-qr-container">
          <canvas id="qr-canvas"></canvas>
        </div>
        <div class="quiz-join-url">${r}</div>
        <div class="quiz-info">Room: ${this.roomId}</div>
        <div class="quiz-controls">
          <button class="quiz-btn quiz-btn-secondary" id="btn-control">Open Control Window</button>
        </div>
      </div>
    `;let o=this.shadowRoot.getElementById("qr-canvas");X(o,r,{width:256,margin:4,errorCorrectionLevel:"Q",colorDark:"#1e293b",colorLight:"#ffffff"}),this.shadowRoot.getElementById("btn-control").addEventListener("click",()=>this.openControlWindow())}updateParticipantCount(r){let o=this.shadowRoot.getElementById("count");o&&(o.textContent=r)}openControlWindow(){let r=nt(this.config.controlUrl,{token:this.presenterToken,room:this.roomId});console.log("opening control window",r);let o=window.open(r,"quiz-control","width=900,height=700,scrollbars=yes")}showError(r){this.contentEl.innerHTML=`<div class="quiz-error">${this.escapeHtml(r)}</div>`}escapeHtml(r){let o=document.createElement("div");return o.textContent=r,o.innerHTML}};function Et(a="ld-quiz"){let r=customElements.get(a);return r?(r!==U&&console.error(`<${a}> is already registered by a different implementation; this copy of ld-quiz will not replace it. Pass another tag name to defineLdQuiz() if both are needed.`),r):(customElements.define(a,U),U)}Et();var kt=()=>{document.querySelector("body > template").content.querySelectorAll("ld-module[name='ld-quiz']").forEach(r=>{try{let o=JSON.parse(r.textContent),n=typeof o.quiz=="string"?o.quiz.trim():JSON.stringify(o.quiz??"");if(!n||n==='""')throw new Error('the "quiz" key is missing or empty');if(o.encrypted&&typeof o.quiz!="string")throw new Error('"encrypted" is set, but "quiz" is not an encrypted string');let s=document.createElement("ld-quiz");s.setAttribute("quiz",n),o.encrypted&&s.setAttribute("encrypted","");for(let f of["server-url","presenter-name"]){let e=o[f];e&&s.setAttribute(f,e)}r.replaceChildren(s)}catch(o){console.error(`processing ld-quiz failed: ${o} (${r.textContent})`)}})};W.addEventListener("beforeLDDOMManipulations",kt);
/*! Bundled license information:

@lecturedoc2/quizzy/src/qr-canvas.js:
  (*! @license
   * The QR symbol on the lobby screen is generated by `qrcode-generator`
   * (https://github.com/kazuhikoarase/qrcode-generator):
   *
   * QR Code Generator for JavaScript
   * Copyright (c) 2009 Kazuhiko Arase -- http://www.d-project.com/
   * Licensed under the MIT license:
   *  http://www.opensource.org/licenses/mit-license.php
   *
   * The word 'QR Code' is a registered trademark of DENSO WAVE INCORPORATED:
   *  http://www.denso-wave.com/qrcode/faqpatent-e.html
   *
   * This notice is repeated here, in first-party source, on purpose: bundlers
   * keep only comments they recognise as legal ones -- for esbuild, a leading
   * bang or an `@license` tag -- and `qrcode-generator`'s own header is an
   * ordinary line-comment block, which is dropped. Without this block the MIT
   * attribution would vanish from every bundle the build produces.
   *)
*/
//# sourceMappingURL=ld-quizzy.js.map
