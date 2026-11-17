const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/hooks/useApplicationDetail.js'),'utf8')
  .replace(/^import .*;\r?\n/gm,'').replace('export default function','function');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const active={id:7,revision_number:3,status_lamaran:'accepted',can_withdraw:true,can_view_evidence:true,
  vacancy:{title:'Mobile Intern',nama_industri:'Demo'},history:[{id:1}],shared_portfolios:[{id:2}]};
const withdrawn={...active,revision_number:4,status_lamaran:'withdrawn',can_withdraw:false};

function setup() {
  const slots=[],gets=[],posts=[];
  let cursor=0,focus,get=async()=>({data:active}),post=async()=>({data:{id:7,status_lamaran:'withdrawn',revision_number:4}});
  const context={
    useState(initial){const index=cursor++;if(!(index in slots))slots[index]=initial;return [slots[index],value=>{slots[index]=typeof value==='function'?value(slots[index]):value;}];},
    useRef(initial){const index=cursor++;return slots[index]||(slots[index]={current:initial});},
    useCallback:callback=>callback,useFocusEffect:callback=>{focus=callback;},
    api:{get(...args){gets.push(args);return get(...args);},post(...args){posts.push(args);return post(...args);}},
  };
  vm.runInNewContext(source+'\nthis.renderHook=useApplicationDetail;',context);
  const render=()=>{cursor=0;return context.renderHook(7);};
  render();
  return {render,focus:()=>focus(),gets,posts,setGet:callback=>{get=callback;},setPost:callback=>{post=callback;}};
}

test('withdrawal locks repeat taps and uses the inspected version, then loads authoritative permissions',async()=>{
  const hook=setup();hook.focus();await flush();
  const pending=deferred();hook.setPost(()=>pending.promise);hook.setGet(async()=>({data:withdrawn}));
  const screen=hook.render();
  const first=screen.mutate('withdraw',{version:screen.data.revision_number},'Lamaran ditarik.');
  await screen.mutate('withdraw',{version:3},'Duplikat');
  assert.equal(hook.posts.length,1);assert.equal(hook.posts[0][0],'/applications/7/withdraw');
  assert.equal(hook.posts[0][1].version,3);assert.equal(hook.render().busy,true);
  pending.resolve({data:{id:7,status_lamaran:'withdrawn',revision_number:4}});await first;
  const updated=hook.render();
  assert.equal(updated.data.can_withdraw,false);assert.equal(updated.data.status_lamaran,'withdrawn');
  assert.equal(updated.busy,false);assert.equal(updated.error,'');assert.equal(updated.receipt,null);
});

test('a committed withdrawal survives a failed detail reload without leaving old controls or evidence visible',async()=>{
  const hook=setup();hook.focus();await flush();
  hook.setGet(async()=>{throw new Error('Jaringan terputus.');});
  await hook.render().mutate('withdraw',{version:3},'Lamaran ditarik.');
  const failed=hook.render();
  assert.equal(failed.data,null);assert.equal(failed.receipt.status_lamaran,'withdrawn');
  assert.equal(failed.receipt.vacancy.title,'Mobile Intern');assert.match(failed.error,/Perubahan sudah tersimpan/);
  assert.equal(failed.message,'Lamaran ditarik.');assert.equal(failed.busy,false);
  hook.setGet(async()=>({data:withdrawn}));await failed.refresh();
  assert.equal(hook.render().data,withdrawn);assert.equal(hook.render().receipt,null);
  assert.equal(hook.posts.length,1,'Retry only reloads; it must not submit withdrawal again.');
});

test('a version conflict is not reported as success and can be resolved by explicitly reloading',async()=>{
  const hook=setup();hook.focus();await flush();
  hook.setPost(async()=>{throw new Error('Lamaran sudah berubah atau sudah berakhir. Muat ulang.');});
  await hook.render().mutate('withdraw',{version:3},'Lamaran ditarik.');
  const failed=hook.render();assert.equal(failed.data,active);assert.equal(failed.receipt,null);
  assert.equal(failed.message,'');assert.match(failed.error,/Muat ulang/);
  hook.setGet(async()=>({data:withdrawn}));await failed.refresh();
  assert.equal(hook.render().data.can_withdraw,false);assert.equal(hook.render().error,'');
});

test('initial loading and read failures show a retry state without sending mutations',async()=>{
  const hook=setup(),pending=deferred();hook.setGet(()=>pending.promise);hook.focus();
  await hook.render().mutate('withdraw',{version:3},'Lamaran ditarik.');
  assert.equal(hook.posts.length,0);assert.equal(hook.render().busy,true);
  pending.reject(new Error('Tidak terhubung.'));await flush();
  assert.equal(hook.render().data,null);assert.equal(hook.render().busy,false);
  assert.match(hook.render().error,/Tidak terhubung/);
  hook.setGet(async()=>({data:active}));await hook.render().refresh();
  assert.equal(hook.render().data,active);
});

test('responses from a blurred visit cannot replace a newer visit or unlock its pending request',async()=>{
  const hook=setup(),old=deferred(),newer=deferred();hook.setGet(()=>old.promise);
  const blur=hook.focus();blur();hook.setGet(()=>newer.promise);hook.focus();
  old.resolve({data:active});await flush();
  assert.equal(hook.render().data,null);assert.equal(hook.render().busy,true);
  newer.resolve({data:withdrawn});await flush();assert.equal(hook.render().data,withdrawn);
});

test('an in-flight decision from a previous visit cannot overwrite refreshed industry permissions',async()=>{
  const hook=setup();const blur=hook.focus();await flush();
  const pending=deferred();hook.setPost(()=>pending.promise);
  const decision=hook.render().mutate('review',{status:'accepted',version:3,note:'Disetujui.'},'Tercatat.');
  blur();hook.setGet(async()=>({data:withdrawn}));hook.focus();await flush();
  pending.resolve({data:{id:7,status_lamaran:'accepted',revision_number:4}});await decision;
  assert.equal(hook.render().data,withdrawn);assert.equal(hook.render().receipt,null);assert.equal(hook.render().message,'');
  assert.equal(hook.gets.length,2,'A stale mutation must not launch another detail read.');
});

function renderScreen({role='siswa',changes={}}={}) {
  const babel=require('@babel/core');
  const screenSource=fs.readFileSync(path.join(__dirname,'../src/screens/recruitment/ApplicationDetailScreen.js'),'utf8')
    .replace(/^import .*;\r?\n/gm,'').replace('export default function','function');
  const theme=fs.readFileSync(path.join(__dirname,'../src/utils/theme.js'),'utf8').replace(/^export /gm,'');
  const alerts=[],mutations=[];
  const data={...active,applied_at:'2026-11-04T06:00:00Z',match_rate:100,selection_note:'Catatan yang sangat panjang. '.repeat(100),
    profile:{nama_lengkap:'Siswa Demo',sekolah:'SMK Demo',kelas:'XII',jurusan:'RPL'},
    matching:{requirements:[]},shared_portfolios:[],...changes};
  const context={
    React:{createElement:(type,props,...children)=>({type,props:{...props,children}}),Fragment:'Fragment'},
    useState:initial=>[initial,()=>{}],useAuthStore:selector=>selector({role}),
    useApplicationDetail:()=>({data,busy:false,error:'',message:'',receipt:null,run:()=>{},refresh:()=>{},mutate:(...args)=>{mutations.push(args);}}),
    Alert:{alert:(...args)=>alerts.push(args)},StyleSheet:{create:value=>value,hairlineWidth:1},
    Text:'Text',View:'View',Pressable:'Pressable',FormScreen:'FormScreen',CustomInput:'CustomInput',PrimaryButton:'PrimaryButton',AppIcon:'AppIcon',
    applicationStatuses:{pending:'Menunggu seleksi',reviewed:'Dalam proses',accepted:'Diterima',rejected:'Ditolak',withdrawn:'Ditarik'},
    selectionPayload:(status,note,version)=>({status,note,version}),
  };
  const transformed=babel.transformSync(screenSource,{configFile:false,babelrc:false,plugins:[require.resolve('@babel/plugin-transform-react-jsx')]}).code;
  vm.runInNewContext(theme+'\n'+transformed+'\nthis.Screen=ApplicationDetailScreen;this.Section=DetailSection;',context);
  const tree=context.Screen({route:{params:{id:7}},navigation:{goBack(){}}});
  function flatten(node) {
    if(Array.isArray(node))return node.flatMap(flatten);
    return node&&typeof node==='object'?[node,...flatten(node.props?.children)]:[];
  }
  return {nodes:flatten(tree),alerts,mutations,context,flatten};
}

test('withdrawal is visible before even a long selection note, and opening or cancelling confirmation sends nothing',()=>{
  const {nodes,alerts,mutations}=renderScreen();
  const index=nodes.findIndex(node=>node.type==='PrimaryButton'&&node.props.title==='Tarik lamaran');
  assert.ok(index>=0);assert.ok(index<nodes.findIndex(node=>node.props.children?.[0]==='CATATAN SELEKSI'));
  nodes[index].props.onPress();assert.equal(mutations.length,0);
  const [title,body,buttons]=alerts[0];assert.equal(title,'Tarik lamaran?');
  assert.match(body,/tidak dapat melamar ulang/);assert.match(body,/kuotanya dilepas/);assert.match(body,/Akses industri/);
  buttons.find(button=>button.text==='Batal').onPress?.();assert.equal(mutations.length,0);
  buttons.find(button=>button.text==='Tarik lamaran').onPress();
  assert.equal(mutations.length,1);assert.equal(mutations[0][0],'withdraw');assert.equal(mutations[0][1].version,3);
});

test('withdrawal visibility follows the server flag and student role, including accepted applications',()=>{
  for(const status_lamaran of ['pending','accepted','rejected','withdrawn']){
    const {nodes}=renderScreen({changes:{status_lamaran,can_withdraw:false}});
    assert.equal(nodes.some(node=>node.type==='PrimaryButton'&&node.props.title==='Tarik lamaran'),false);
  }
  const industry=renderScreen({role:'industri',changes:{can_review:true,can_view_evidence:true}});
  assert.equal(industry.nodes.some(node=>node.type==='PrimaryButton'&&node.props.title==='Tarik lamaran'),false);
  assert.equal(industry.nodes.some(node=>node.type==='PrimaryButton'&&node.props.title==='Terima pelamar'),true);
  assert.equal(industry.nodes.some(node=>node.type==='PrimaryButton'&&node.props.title==='Tolak lamaran'),true);
});

test('supporting detail sections expose their expanded state and keep content hidden until opened',()=>{
  const {context,flatten}=renderScreen();let open=false;
  context.useState=()=>[open,value=>{open=typeof value==='function'?value(open):value;}];
  const props={title:'Profil dan bukti lamaran',summary:'2 bukti karya tersedia',children:'Bukti lengkap'};
  let section=context.Section(props);
  let toggle=flatten(section).find(node=>node.type==='Pressable');
  assert.equal(toggle.props.accessibilityState.expanded,false);assert.equal(section.props.children[1],null);
  toggle.props.onPress();section=context.Section(props);
  toggle=flatten(section).find(node=>node.type==='Pressable');
  assert.equal(toggle.props.accessibilityState.expanded,true);
  assert.equal(section.props.children[1].props.children[0],'Bukti lengkap');
});

test('withdrawn applications retain the withdrawal note in history without repeating it above the detail sections',()=>{
  for(const history of [[],[{id:1,action:'withdrawn',created_at:'2026-11-04',note:'Lamaran ditarik oleh siswa.'}]]){
    const {nodes}=renderScreen({changes:{status_lamaran:'withdrawn',can_withdraw:false,selection_note:'Lamaran ditarik oleh siswa.',history}});
    assert.equal(nodes.some(node=>node.type==='Text'&&node.props.children?.[0]==='CATATAN SELEKSI'),false);
    const notes=nodes.filter(node=>node.type==='Text'&&node.props.children?.[0]==='Lamaran ditarik oleh siswa.');
    assert.equal(notes.length,1,'The note remains available once, including records missing their event.');
  }
});
