import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

export const compileSource = (relative, dependencies, globals = {}) => {
  const source = readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8').replaceAll('import.meta', '({ env: {} })');
  const exports = {};
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } });
  runInNewContext(outputText, { exports, AbortController, crypto: globalThis.crypto, console: { warn() {} }, ...globals,
    require(name) { assert.ok(dependencies[name], `Reviewed dependency required: ${name}`); return dependencies[name]; } });
  return exports;
};

// Existing-project hook/element contract approach. Not React DOM or browser layout.
export const componentHarness = () => {
  const frames = new Map(), effects = [];
  let frame, dirty = false, tree, root, props, nextId = 0, mounted = true;
  const same = (a,b) => a && b && a.length === b.length && a.every((v,i)=>Object.is(v,b[i]));
  const react = {
    useState(initial) {
      const owner=frame, index=owner.cursor++;
      owner.slots[index] ??= {value:typeof initial==='function'?initial():initial};
      return [owner.slots[index].value,next=>{
        if (!mounted) return;
        const value=typeof next==='function'?next(owner.slots[index].value):next;
        if(!Object.is(value,owner.slots[index].value)) dirty=true;
        owner.slots[index].value=value;
      }];
    },
    useRef(initial) { return react.useState(()=>({current:initial}))[0]; },
    useId() { return react.useState(()=>`test-control-${++nextId}`)[0]; },
    useCallback(callback,deps) {
      const index=frame.cursor++;
      if(!same(frame.slots[index]?.deps,deps))frame.slots[index]={value:callback,deps};
      return frame.slots[index].value;
    },
    useEffect(callback,deps) {
      const owner=frame,index=owner.cursor++;
      if(!same(owner.slots[index]?.deps,deps)) effects.push(()=>{
        owner.slots[index]?.cleanup?.(); owner.slots[index]={deps,cleanup:callback()};
      });
    },
  };
  const jsx=(type,props,key)=>({type,props:props??{},key});
  const renderNode=(node,path='root')=>{
    if(Array.isArray(node)) return node.map((value,i)=>renderNode(value,`${path}.${value?.key??i}`));
    if(!node||typeof node!=='object') return node;
    if(typeof node.type==='function') {
      let owner=frames.get(path);
      if(!owner||owner.type!==node.type) {owner?.slots.forEach(slot=>slot.cleanup?.()); owner={type:node.type,cursor:0,slots:[]};frames.set(path,owner);}
      owner.seen=true; owner.cursor=0;frame=owner;
      return renderNode(node.type(node.props),`${path}.render`);
    }
    return {...node,children:renderNode(node.props.children,`${path}.children`)};
  };
  const render=()=>{
    dirty=false;frames.forEach(owner=>{owner.seen=false;});tree=renderNode(jsx(root,props));
    for(const [key,owner] of frames) if(!owner.seen){owner.slots.forEach(slot=>slot.cleanup?.());frames.delete(key);}
    while(effects.length) effects.shift()();
  };
  const settle=async()=>{for(let i=0;i<40;i++){await new Promise(resolve=>setImmediate(resolve));if(!dirty)return;render();}assert.fail('Render did not settle');};
  const nodes=(predicate)=>{const found=[];const visit=node=>{if(Array.isArray(node))return node.forEach(visit);if(!node||typeof node!=='object')return;if(predicate(node))found.push(node);visit(node.children);};visit(tree);return found;};
  const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.children):node==null||typeof node==='boolean'?'':String(node);
  return {
    react, jsx, modules:{react,'react/jsx-runtime':{jsx,jsxs:jsx},'lucide-react':new Proxy({}, {get:(_target,key)=>String(key)})},
    async mount(component,initial){root=component;props=initial;render();await settle();},
    async update(next){props={...props,...next};render();await settle();},
    nodes,text,settle,
    button(label){const items=nodes(n=>n.type==='button'&&(text(n)===label||n.props['aria-label']===label));assert.equal(items.length,1);return items[0];},
    async click(label){const button=this.button(label);assert.ok(!button.props.disabled);button.props.onClick?.();await settle();},
    unmount(){mounted=false;frames.forEach(owner=>owner.slots.forEach(slot=>slot.cleanup?.()));frames.clear();},
  };
};
