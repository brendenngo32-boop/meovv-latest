const $=id=>document.getElementById(id), canvas=$('preview');
let photos=[],logos=[],selected=0,logoIndex=0,mode='text',layout='single',pos={x:.85,y:.88},busy=false;
const fields=['watermark','font','color','size','opacity','rotation'];
function message(text){$('status').textContent=text}
function save(){try{if($('remember').checked)localStorage.setItem('meovv-marker',JSON.stringify({mode,values:Object.fromEntries(fields.map(k=>[k,$(k).value])),logos:logos.map(l=>l.src),logoIndex}));else localStorage.removeItem('meovv-marker')}catch{message('Your browser could not remember this watermark. It still works for this session.')}}
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('This image could not be opened.'));img.src=src})}
function readFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)})}
function setMode(value){mode=value;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));$('text-options').hidden=mode!=='text';$('logo-options').hidden=mode!=='logo';render()}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{setMode(b.dataset.mode);save()});
document.querySelectorAll('[data-layout]').forEach(b=>b.onclick=()=>{layout=b.dataset.layout;document.querySelectorAll('[data-layout]').forEach(v=>v.classList.toggle('active',v===b));render()});
const names=['Top left','Top center','Top right','Middle left','Center','Middle right','Bottom left','Bottom center','Bottom right'];
names.forEach((name,i)=>{const b=document.createElement('button');b.textContent='·';b.title=name;b.setAttribute('aria-label',name);b.onclick=()=>{pos={x:[.15,.5,.85][i%3],y:[.12,.5,.88][Math.floor(i/3)]};document.querySelectorAll('#positions button').forEach(v=>v.classList.toggle('active',v===b));render()};if(i===8)b.classList.add('active');$('positions').append(b)});
fields.forEach(id=>$(id).oninput=()=>{render();save()});$('remember').onchange=save;
function draw(target,photo){const w=photo.img.videoWidth||photo.img.naturalWidth,h=photo.img.videoHeight||photo.img.naturalHeight;target.width=w;target.height=h;const c=target.getContext('2d');c.drawImage(photo.img,0,0);const scale=Number($('size').value)/100;let mw=w*scale,mh=mw*.22;const logo=logos[logoIndex];if(mode==='logo'&&!logo)return;if(mode==='text'&&!$('watermark').value.trim())return;let fontSize=mw/4;if(mode==='text'){c.font=`600 ${fontSize}px ${$('font').value}`;fontSize*=mw/Math.max(1,c.measureText($('watermark').value).width);mh=fontSize*1.2}else mh=mw*logo.img.naturalHeight/logo.img.naturalWidth;if(mh>h*.8){mw*=h*.8/mh;mh=h*.8}const angle=Number($('rotation').value)*Math.PI/180;c.globalAlpha=Number($('opacity').value)/100;function mark(x,y){c.save();c.translate(x,y);c.rotate(angle);if(mode==='text'){c.font=`600 ${fontSize}px ${$('font').value}`;c.fillStyle=$('color').value;c.textAlign='center';c.textBaseline='middle';c.fillText($('watermark').value,0,0)}else c.drawImage(logo.img,-mw/2,-mh/2,mw,mh);c.restore()}if(layout==='single'){const bx=Math.min(w/2,(Math.abs(mw*Math.cos(angle))+Math.abs(mh*Math.sin(angle)))/2+w*.015),by=Math.min(h/2,(Math.abs(mw*Math.sin(angle))+Math.abs(mh*Math.cos(angle)))/2+h*.015);mark(Math.max(bx,Math.min(w-bx,pos.x*w)),Math.max(by,Math.min(h-by,pos.y*h)))}else{const stepX=Math.max(mw*1.8,w*.18),stepY=Math.max(mh*2.8,h*.15);for(let row=0,y=stepY/2;y<h+mh;y+=stepY,row++)for(let x=stepX/2-(row%2)*stepX/2;x<w+mw;x+=stepX)mark(x,y)}}
function render(){['size','opacity','rotation'].forEach(k=>$(k+'-out').value=$(k).value+(k==='rotation'?'°':'%'));const photo=photos[selected];$('count').textContent=photos.length+' / 20';$('empty').hidden=!!photo;canvas.hidden=!photo;syncZoom(!!photo);$('remove').hidden=!photo;updateVideoControls(photo);const valid=photo&&(mode==='text'?$('watermark').value.trim():logos.length);$('download').disabled=!valid||busy;$('download-all').disabled=!valid||busy;if(photo){draw(canvas,photo);$('filename').textContent=photo.name;$('dimensions').textContent=(photo.img.videoWidth||photo.img.naturalWidth)+' × '+(photo.img.videoHeight||photo.img.naturalHeight)+' PX'}else{$('filename').textContent='NO FILE SELECTED';$('dimensions').textContent=''}}
function thumbs(){const box=$('thumbnails');box.replaceChildren();photos.forEach((p,i)=>{const b=document.createElement('button');b.classList.toggle('active',i===selected);b.title=p.name;b.setAttribute('aria-label','Preview '+p.name);const image=document.createElement('img');image.src=p.poster||p.src;image.alt=p.name;b.append(image);b.onclick=()=>{photos[selected]?.img.pause?.();selected=i;thumbs();render()};box.append(b)})}
function logoThumbs(){
 const box=$('logo-list');box.replaceChildren();
 logos.forEach((l,i)=>{
  const item=document.createElement('div');item.className='logo-item';
  const b=document.createElement('button');b.classList.toggle('active',i===logoIndex);b.setAttribute('aria-label','Use logo '+(i+1));
  const image=document.createElement('img');image.src=l.src;image.alt='Logo '+(i+1);b.append(image);
  b.onclick=()=>{logoIndex=i;logoThumbs();save();render()};
  const remove=document.createElement('button');remove.className='remove-logo';remove.textContent='Remove';remove.setAttribute('aria-label','Remove logo '+(i+1));
  remove.onclick=()=>{
   logos.splice(i,1);
   if(i<logoIndex)logoIndex--;else if(i===logoIndex)logoIndex=Math.min(i,logos.length-1);
   logoIndex=Math.max(0,logoIndex);logoThumbs();save();render();
   message(logos.length?'Logo removed.':'Logo removed. Add a logo or switch to Text.');
  };
  item.append(b,remove);box.append(item);
 });
}
async function addPhotos(files){if(busy)return;let rejected=0;for(const f of files){if(photos.length>=20){message('The batch is limited to 20 files.');break}if(f.type.startsWith('video/')){try{photos.push(await loadVideo(f))}catch(e){message(e.message);rejected++}continue}if(!/^image\/(jpeg|png|webp)$/.test(f.type)){rejected++;continue}try{const src=await readFile(f),img=await loadImage(src);photos.push({src,img,name:f.name,type:f.type})}catch{rejected++}}thumbs();render();if(rejected)message(rejected+' file(s) could not be opened. Use images or a video format your browser can play.');$('photos').value=''}
$('photos').onchange=e=>addPhotos(e.target.files);
$('logos').onchange=async e=>{for(const file of e.target.files){try{const src=await readFile(file),img=await loadImage(src);logos.push({src,img});logoIndex=logos.length-1}catch{message('A logo could not be opened. Try a PNG.')}}logoThumbs();render();save();e.target.value=''};
const drop=$('photo-drop');['dragenter','dragover'].forEach(name=>drop.addEventListener(name,e=>{e.preventDefault();drop.classList.add('over')}));drop.ondragleave=()=>drop.classList.remove('over');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('over');addPhotos(e.dataTransfer.files)};
$('remove').onclick=()=>{const removed=photos.splice(selected,1)[0];if(removed?.video){removed.img.pause();removed.audio?.context.close();removed.img.removeAttribute('src');removed.img.load();removed.img.remove();URL.revokeObjectURL(removed.src)}selected=Math.max(0,Math.min(selected,photos.length-1));thumbs();render()};
let dragging=false;function position(e){const r=canvas.getBoundingClientRect();pos={x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};document.querySelectorAll('#positions button').forEach(b=>b.classList.remove('active'));render()}canvas.onpointerdown=e=>{if(layout!=='single')return;dragging=true;canvas.setPointerCapture(e.pointerId);position(e)};canvas.onpointermove=e=>{if(dragging)position(e)};canvas.onpointerup=canvas.onpointercancel=()=>dragging=false;
async function exported(photo){if(photo.video)return exportVideo(photo);const c=document.createElement('canvas');draw(c,photo);const format=$('format').value,type=format==='original'?photo.type:'image/'+format,quality=Math.max(1,Math.min(100,Number($('quality').value)||92))/100;const blob=await new Promise(resolve=>c.toBlob(resolve,type,quality));if(!blob)throw Error('Your browser could not export this image.');return{blob,name:photo.name.replace(/\.[^.]+$/,'')+'-meovv.'+(blob.type==='image/jpeg'?'jpg':blob.type.split('/')[1])}}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}
// Store-only ZIP keeps export fully offline, with no third-party libraries.
function crc32(bytes){let crc=-1;for(const v of bytes){crc^=v;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return(crc^-1)>>>0}
function zip(files){let offset=0;const body=[],central=[];for(const f of files){const name=new TextEncoder().encode(f.name),data=f.data,crc=crc32(data);const header=new Uint8Array(30+name.length),v=new DataView(header.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);header.set(name,30);body.push(header,data);const entry=new Uint8Array(46+name.length),d=new DataView(entry.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint32(16,crc,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);entry.set(name,46);central.push(entry);offset+=header.length+data.length}const end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,files.length,true);v.setUint16(10,files.length,true);v.setUint32(12,central.reduce((s,a)=>s+a.length,0),true);v.setUint32(16,offset,true);return new Blob([...body,...central,end],{type:'application/zip'})}
async function runExport(all){photos.forEach(p=>p.img.pause?.());busy=true;lockEditor(true);render();try{if(all){const files=[];for(let i=0;i<photos.length;i++){message(`Preparing ${i+1} of ${photos.length}…`);const result=await exported(photos[i]);files.push({name:String(i+1).padStart(2,'0')+'-'+result.name,data:new Uint8Array(await result.blob.arrayBuffer())})}download(zip(files),'meovv-watermarked.zip')}else{const result=await exported(photos[selected]);download(result.blob,result.name)}message('Your download is ready. Original files are unchanged.')}catch(e){message(e.message||'Export failed. Try a smaller batch.')}finally{busy=false;lockEditor(false);render()}}
$('download').onclick=()=>runExport(false);$('download-all').onclick=()=>runExport(true);
(async()=>{try{const saved=JSON.parse(localStorage.getItem('meovv-marker'));if(saved){fields.forEach(k=>{if(saved.values?.[k]!==undefined)$(k).value=saved.values[k]});for(const src of saved.logos||[])logos.push({src,img:await loadImage(src)});logoIndex=Math.min(saved.logoIndex||0,Math.max(0,logos.length-1));logoThumbs();setMode(saved.mode==='logo'?'logo':'text')}}catch{}render()})();



function syncZoom(hasPhoto){
 const slider=$('zoom');slider.disabled=!hasPhoto;
 $('zoom-in').disabled=!hasPhoto||Number(slider.value)>=300;
 $('zoom-out').disabled=!hasPhoto||Number(slider.value)<=100;
 canvas.style.transform='scale('+(hasPhoto?Number(slider.value)/100:1)+')';
 $('zoom-value').value=slider.value+'%';
}
$('zoom').oninput=()=>syncZoom(!!photos[selected]);
$('zoom-in').onclick=()=>{$('zoom').value=Math.min(300,Number($('zoom').value)+10);syncZoom(!!photos[selected])};
$('zoom-out').onclick=()=>{$('zoom').value=Math.max(100,Number($('zoom').value)-10);syncZoom(!!photos[selected])};
syncZoom(!!photos[selected]);

function updateVideoControls(p){
 const isVideo=!!p?.video;$('video-controls').hidden=!isVideo;$('video-note').hidden=!isVideo;
 $('format').disabled=isVideo||busy;$('quality').disabled=isVideo||busy;
 $('download').textContent=isVideo?'Download video ↗':'Download image ↗';
 if(isVideo){$('video-play').textContent=p.img.paused?'Play':'Pause';$('video-seek').value=p.img.currentTime/p.img.duration*100||0;$('video-time').value=clockTime(p.img.currentTime)+' / '+clockTime(p.img.duration)}
}
function clockTime(t){return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0')}
function lockEditor(lock){document.querySelectorAll('aside input,aside select,aside button,#thumbnails button,#remove,#video-controls button,#video-controls input').forEach(el=>el.disabled=lock);canvas.style.pointerEvents=lock?'none':'';$('cancel-export').hidden=!lock}
async function loadVideo(file){
 const src=URL.createObjectURL(file),v=document.createElement('video');v.playsInline=true;v.preload='auto';v.src=src;v.className='video-source';document.body.append(v);
 try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Video loading timed out.')),20000);v.onloadeddata=()=>{clearTimeout(timer);resolve()};v.onerror=()=>{clearTimeout(timer);reject(Error('This video format cannot be played in this browser.'))}});
 if(!Number.isFinite(v.duration)||!v.videoWidth)throw Error('This video has no playable video track.');
 const thumb=document.createElement('canvas');thumb.width=120;thumb.height=90;thumb.getContext('2d').drawImage(v,0,0,120,90);
 const p={src,img:v,video:true,name:file.name,type:file.type,poster:thumb.toDataURL()};
 v.addEventListener('seeked',()=>{if(photos[selected]===p&&!busy){draw(canvas,p);updateVideoControls(p)}});
 v.addEventListener('ended',()=>updateVideoControls(photos[selected]));
 v.addEventListener('play',()=>{function frame(){if(photos[selected]!==p||v.paused||v.ended)return;if(!busy){draw(canvas,p);updateVideoControls(p)}requestAnimationFrame(frame)}frame()});return p;
 }catch(e){v.remove();URL.revokeObjectURL(src);throw e}
}
$('video-play').onclick=async()=>{const p=photos[selected];if(!p?.video||busy)return;try{if(p.img.paused)await p.img.play();else p.img.pause();updateVideoControls(p)}catch{message('Playback could not start. Try another video.')}};
$('video-seek').oninput=()=>{const p=photos[selected];if(p?.video&&!busy)p.img.currentTime=Number($('video-seek').value)/100*p.img.duration};
function seekStart(v){return new Promise((resolve,reject)=>{if(v.currentTime===0){resolve();return}const timer=setTimeout(()=>{v.removeEventListener('seeked',done);reject(Error('Could not rewind video.'))},5000);function done(){clearTimeout(timer);resolve()}v.addEventListener('seeked',done,{once:true});v.currentTime=0})}
async function exportVideo(p){
 if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)throw Error('Video export is not supported by this browser. Try a recent Chrome or Safari.');
 const mime=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/mp4','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!mime)throw Error('No supported video export format is available.');
 const v=p.img,out=document.createElement('canvas');let stream,recorder,timer,timeout,cancelled=false;
 try{
 if(!p.audio){const context=new (window.AudioContext||window.webkitAudioContext)();const source=context.createMediaElementSource(v),destination=context.createMediaStreamDestination();source.connect(destination);source.connect(context.destination);p.audio={context,destination}}
 await p.audio.context.resume();v.pause();await seekStart(v);draw(out,p);
 stream=out.captureStream(30);for(const track of p.audio.destination.stream.getAudioTracks())stream.addTrack(track.clone());
 recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8000000});const chunks=[];
 const finished=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onerror=()=>reject(Error('Video recording failed.'));recorder.onstop=()=>cancelled?reject(Error('Video export cancelled.')):resolve(new Blob(chunks,{type:recorder.mimeType}));});
 const stop=()=>{if(recorder.state!=='inactive')recorder.stop()};v.addEventListener('ended',stop,{once:true});
 $('cancel-export').onclick=()=>{cancelled=true;v.pause();stop()};
 recorder.start(1000);
 timer=setInterval(()=>{draw(out,p);draw(canvas,p);message('Exporting video… '+Math.min(100,Math.round(v.currentTime/v.duration*100))+'%');},1000/30);
 timeout=setTimeout(()=>{cancelled=true;stop()},(v.duration+60)*1000);
 try{await v.play()}catch{cancelled=true;stop()}
 const blob=await finished;v.removeEventListener('ended',stop);if(!blob.size)throw Error('Video export was empty.');
 return{blob,name:p.name.replace(/\.[^.]+$/,'')+'-meovv.'+(blob.type.includes('mp4')?'mp4':'webm')};
 }finally{clearInterval(timer);clearTimeout(timeout);v.pause();if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop());$('cancel-export').onclick=null}
}
