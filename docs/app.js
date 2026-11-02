function uid(){return crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('')}
const $=s=>document.querySelector(s),key='sai-archive-v1';const seed={items:['퍼즐','윤숲','피슈마라홍탕','막걸리 만들기','쭈꾸미 잡으러 가기','온천 가기','낙엽 등산','뮤지컬펍','연극 보기','영화 보기','여행 가기','뜨개질? 하기','커플 아이템 맞추기','눈사람 만들기'].map((title,i)=>({id:uid(),title,category:['함께 만들기','문화와 쉼','먹고 마시기','함께 만들기','밖으로 떠나기','문화와 쉼','밖으로 떠나기','문화와 쉼','문화와 쉼','문화와 쉼','밖으로 떠나기','함께 만들기','함께 만들기','함께 만들기'][i],date:'',note:'',done:false})),tastes:[...['삼겹살','찜질방','대방어에 청하스파클링 (12월)','엄외사빠딸슈팅스타'].map(title=>({id:uid(),title,like:true})),{id:uid(),title:'조개류',like:false}]};// Keep the original storage key so existing memories stay on the same browser.
let data,storageBroken=false;
try{const raw=localStorage.getItem(key);data=raw?normalize(JSON.parse(raw)):structuredClone(seed)}catch{data=structuredClone(seed);storageBroken=true}
function normalize(d){
 if(!d||!Array.isArray(d.items)||!Array.isArray(d.tastes)||!d.items.every(x=>x&&typeof x.title==='string'&&typeof x.id==='string')||!d.tastes.every(x=>x&&typeof x.title==='string'&&typeof x.id==='string'))throw Error('invalid archive');
 return {...d,items:d.items.map(x=>({...x,id:x.id,title:x.title.slice(0,100),done:x.done===true,date:/^\d{4}-\d{2}-\d{2}$/.test(x.date)?x.date:'',note:typeof x.note==='string'?x.note.slice(0,2000):'',category:['함께 만들기','문화와 쉼','먹고 마시기','밖으로 떠나기'].includes(x.category)?x.category:'문화와 쉼'})),tastes:d.tastes.map(x=>({...x,title:x.title.slice(0,100),like:x.like!==false,person:x.person==='권쇼쇼'?'권쇼쇼':'민탱탱'})),visited:Array.isArray(d.visited)?d.visited.filter(x=>typeof x==='string'):[],legacyVisited:Array.isArray(d.legacyVisited)?d.legacyVisited.filter(x=>typeof x==='string'):[]};
}
data.tastes.forEach(t=>{if(!t.person)t.person='민탱탱'});
let view='wish',filter='전체',editing=null,tastePerson='민탱탱',search='',sort='original',layout='grid',toastTimer,undoAction=null;
const palettes={'함께 만들기':['🧩','#e6e9df'],'문화와 쉼':['☁️','#e8e6ed'],'먹고 마시기':['🍵','#eee4d5'],'밖으로 떠나기':['🌿','#dfe8dc']};
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
let persisted=structuredClone(data);
function save(){if(storageBroken){toast('기존 저장 내용을 읽지 못했어요. 백업 후 복원해 주세요.');return false}try{localStorage.setItem(key,JSON.stringify(data));persisted=structuredClone(data);render();return true}catch{data=structuredClone(persisted);toast('저장하지 못했어요. 백업을 저장해 주세요.');render();return false}}
function toast(message,undo=null){clearTimeout(toastTimer);undoAction=undo;$('#toastMessage').textContent=message;$('#undo').classList.toggle('hidden',!undo);$('#toast').classList.remove('hidden');toastTimer=setTimeout(()=>{$('#toast').classList.add('hidden');undoAction=null},undo?9000:3500)}
$('#undo').onclick=()=>{if(undoAction){const action=undoAction;undoAction=null;action();toast('기록을 되돌렸어요')}};
function updateChrome(){
 document.body.dataset.view=view;

 $('#wishCount').textContent=data.items.filter(x=>!x.done).length;$('#doneCount').textContent=data.items.filter(x=>x.done).length;$('#tasteCount').textContent=data.tastes.length;
 document.querySelectorAll('nav button').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-current',b.dataset.view===view?'page':'false')});
 $('#workspaceToolbar').hidden=view==='map';$('#sort').hidden=view==='taste';$('.viewSwitch').hidden=view==='taste';$('#add').style.visibility=view==='map'?'hidden':'';$('#resultCount').hidden=view==='map';
}
function render(){
 updateChrome();$('#breadcrumb').textContent={wish:'WISHLIST',done:'MEMORIES',taste:'LITTLE THINGS'}[view];
 $('#heading').innerHTML={wish:'다음 페이지의 우리<small>언젠가를, 하나씩 함께로.</small>',done:'함께한 날들<small>좋았던 순간을 오래 간직해요.</small>',taste:'너를 알아가는 중<small>작은 취향 하나도, 소중하게.</small>'}[view];
 $('#add').textContent=view==='taste'?'＋ 취향 담기':view==='done'?'＋ 추억 담기':'＋ 새로 담기';
 const matches=x=>(x.title+' '+(x.note||'')).toLocaleLowerCase().includes(search.toLocaleLowerCase());
 $('#filters').innerHTML=view==='taste'?'':['전체',...Object.keys(palettes)].map(c=>`<button class="${c===filter?'active':''}" data-filter="${c}" aria-pressed="${c===filter}">${c}</button>`).join('');
 if(view==='taste'){
 const tastes=data.tastes.filter(t=>t.person===tastePerson&&matches(t));$('#resultCount').textContent=`${tastePerson}의 취향 ${tastes.length}개`;
 $('#content').innerHTML=`<div class="filters" aria-label="누구의 취향"><button data-person="민탱탱" aria-pressed="${tastePerson==='민탱탱'}" class="${tastePerson==='민탱탱'?'active':''}">♡ 민탱탱</button><button data-person="권쇼쇼" aria-pressed="${tastePerson==='권쇼쇼'}" class="${tastePerson==='권쇼쇼'?'active':''}">♡ 권쇼쇼</button></div>`+[true,false].map(l=>`<section class="taste"><h2>${l?'♡ 좋아해요':'◌ 조금 어려워요'}</h2><div class="chips">${tastes.filter(t=>t.like===l).map(t=>`<span class="chip ${l?'':'dislike'}"><button class="editTaste" data-edit-taste="${esc(t.id)}" aria-label="${esc(t.title)} 수정">${esc(t.title)}</button><button data-del-taste="${esc(t.id)}" aria-label="${esc(t.title)} 삭제">×</button></span>`).join('')||'<p>아직 담긴 취향이 없어요. 작은 것부터 알려주세요.</p>'}</div></section>`).join('');return;
 }
 let rows=data.items.filter(x=>x.done===(view==='done')&&(filter==='전체'||x.category===filter)&&matches(x));
 if(sort==='recent')rows.reverse();if(sort==='name')rows.sort((a,b)=>a.title.localeCompare(b.title,'ko'));if(sort==='date')rows.sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
 $('#resultCount').textContent=`${search?'검색 결과':'우리의 작은 약속'} ${rows.length}개`;
 $('#content').innerHTML=`<div class="grid ${layout==='list'?'list':''}">${rows.map(x=>{const [emoji,bg]=palettes[x.category]||palettes['문화와 쉼'];return `<article class="card"><div class="art" style="--bg:${bg}"><div class="tag">${esc(x.category)}</div><span aria-hidden="true">${emoji}</span></div><div class="body"><h3>${esc(x.title)}</h3><p>◷ ${esc(x.date?x.date.replaceAll('-','. '):'날짜는 천천히 정해요')}</p>${x.note?`<p class="note">${esc(x.note)}</p>`:''}<div class="actions"><button class="complete" data-toggle="${esc(x.id)}" aria-label="${esc(x.title)} ${x.done?'다시 하고 싶은 일로 이동':'함께한 기록으로 이동'}">${x.done?'↩ 다시 하고 싶어요':'♡ 함께했어요'}</button><span><button data-edit="${esc(x.id)}" aria-label="${esc(x.title)} 수정">수정</button><button data-delete="${esc(x.id)}" aria-label="${esc(x.title)} 삭제">×</button></span></div></div></article>`}).join('')||`<div class="empty"><h2>${search||filter!=='전체'?'찾는 순간이 아직 없어요.':view==='done'?'우리의 추억이 시작될 자리.':'다음 설렘을 담아볼까요?'}</h2><p>${search||filter!=='전체'?'검색어나 종류를 바꿔서 다시 찾아보세요.':'함께한 날도, 앞으로의 약속도 하나씩 채워가요.'}</p><button class="primary" data-empty="${search||filter!=='전체'?'reset':'add'}">${search||filter!=='전체'?'전체 기록 보기':'첫 기록 담기'}</button></div>`}</div>`;
}
function navigate(next){view=next;filter='전체';search='';$('#search').value='';render();$('#heading').focus({preventScroll:true});$('.sectionHead').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
document.querySelector('nav').onclick=e=>{const b=e.target.closest('[data-view]');if(b)navigate(b.dataset.view)};
document.querySelector('.stats').onclick=e=>{const el=e.target.closest('[data-stat]');if(el)navigate(el.dataset.stat)};
document.querySelector('.stats').onkeydown=e=>{if(['Enter',' '].includes(e.key)&&e.target.dataset.stat){e.preventDefault();navigate(e.target.dataset.stat)}};
$('#filters').onclick=e=>{const b=e.target.closest('[data-filter]');if(b){filter=b.dataset.filter;render()}};
$('#search').oninput=e=>{search=e.target.value.trim();render()};$('#sort').onchange=e=>{sort=e.target.value;render()};
function setLayout(value){layout=value;for(const [id,l] of [['gridView','grid'],['listView','list']]){$('#'+id).classList.toggle('active',l===layout);$('#'+id).setAttribute('aria-pressed',l===layout)}render()}
$('#gridView').onclick=()=>setLayout('grid');$('#listView').onclick=()=>setLayout('list');
function open(item){
 editing=item?.id||null;$('#form').reset();$('#title').value=item?.title||'';$('#title').setCustomValidity('');$('#person').parentElement.hidden=view!=='taste';$('#person').value=item?.person||tastePerson;
 $('#category').innerHTML=(view==='taste'?['좋아해요','어려워요']:Object.keys(palettes)).map(c=>`<option>${c}</option>`).join('');$('#category').value=view==='taste'?(item?.like===false?'어려워요':'좋아해요'):(item?.category||'함께 만들기');
 $('#date').value=item?.date||'';$('#note').value=item?.note||'';$('#date').parentElement.hidden=view==='taste';$('#note').parentElement.hidden=view==='taste';$('#modalTitle').textContent=item?'우리의 기록 수정하기':view==='taste'?'너의 취향 기억하기':view==='done'?'함께한 순간 담기':'새로운 설렘 담기';$('#modal').showModal();$('#title').focus();
}
$('#add').onclick=()=>open();$('#cancel').onclick=()=>$('#modal').close();$('#modal').onclick=e=>{if(e.target===$('#modal')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}};
$('#form').onsubmit=e=>{
 e.preventDefault();const title=$('#title').value.trim();if(!title){$('#title').setCustomValidity('이름을 입력해 주세요.');$('#title').reportValidity();return}const collection=view==='taste'?'tastes':'items',old=structuredClone(data[collection]);
 const existing=data[collection].find(x=>x.id===editing);const item=view==='taste'?{...existing,id:editing||uid(),title,person:$('#person').value,like:$('#category').value==='좋아해요'}:{...existing,id:editing||uid(),title,category:$('#category').value,date:$('#date').value,note:$('#note').value.trim(),done:existing?existing.done:view==='done'};
 if(editing){const index=data[collection].findIndex(x=>x.id===editing);if(index<0)return;data[collection][index]=item}else data[collection].push(item);
 if(save()){$('#modal').close();toast('우리의 공간에 담았어요')}else data[collection]=old;
};$('#title').oninput=()=>$('#title').setCustomValidity('');
$('#content').onclick=e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.person){tastePerson=b.dataset.person;render();return}
 if(b.dataset.empty){if(b.dataset.empty==='reset'){filter='전체';search='';$('#search').value='';render()}else open();return}
 if(b.dataset.toggle){const item=data.items.find(x=>x.id===b.dataset.toggle);if(!item)return;const previous=item.done;item.done=!previous;if(save())toast(item.done?'함께한 날들에 기록했어요':'하고 싶은 일에 다시 담았어요',()=>{const current=data.items.find(x=>x.id===item.id);if(current){current.done=previous;save()}});return}
 if(b.dataset.edit){open(data.items.find(x=>x.id===b.dataset.edit));return}if(b.dataset.editTaste){open(data.tastes.find(x=>x.id===b.dataset.editTaste));return}
 const collection=b.dataset.delete?'items':'tastes',id=b.dataset.delete||b.dataset.delTaste;if(!id)return;const index=data[collection].findIndex(x=>x.id===id);if(index<0)return;const removed=data[collection].splice(index,1)[0];if(save())toast('기록을 삭제했어요',()=>{if(!data[collection].some(x=>x.id===removed.id))data[collection].splice(index,0,removed);save()});
};
$('#surprise').onclick=()=>{const wishes=data.items.filter(x=>!x.done);if(!wishes.length){navigate('wish');open();return}navigate('wish');open(wishes[Math.floor(Math.random()*wishes.length)]);$('#modalTitle').textContent='오늘, 이건 어때요?'};
$('#export').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download=`탱쇼-우리의기록-${new Date().toLocaleDateString('sv-SE')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('백업 파일을 저장했어요')};
$('#import').onclick=()=>$('#file').click();$('#file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>10*1024*1024)throw Error();const next=normalize(JSON.parse(await file.text()));if(confirm(`백업의 기록 ${next.items.length}개와 취향 ${next.tastes.length}개로 현재 기록을 바꿀까요? 먼저 현재 기록을 백업해 두세요.`)){const previous=data,wasBroken=storageBroken;data=next;storageBroken=false;if(save())toast('백업을 불러왔어요',()=>{data=previous;storageBroken=wasBroken;save()});else{data=previous;storageBroken=wasBroken;render()}}}catch{toast('올바른 탱쇼 JSON 백업 파일을 선택해 주세요.')}finally{e.target.value=''}};
render();if(storageBroken)toast('저장된 기록을 읽지 못했어요. 백업 파일로 복원해 주세요.');
