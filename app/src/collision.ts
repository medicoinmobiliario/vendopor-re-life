export type Point = { x: number; z: number };
export type Obstacle = { name: string; x0: number; x1: number; z0: number; z1: number };
export type Bounds = Omit<Obstacle, 'name'>;
export const RADIUS = 0.34;
export function free(p: Point, obstacles: Obstacle[], bounds: Bounds): boolean {
  if (p.x < bounds.x0 || p.x > bounds.x1 || p.z < bounds.z0 || p.z > bounds.z1) return false;
  return !obstacles.some(b => {
    const dx = p.x - Math.max(b.x0, Math.min(b.x1, p.x));
    const dz = p.z - Math.max(b.z0, Math.min(b.z1, p.z));
    return dx * dx + dz * dz < RADIUS * RADIUS;
  });
}
export function move(p: Point, dx: number, dz: number, obstacles: Obstacle[], bounds: Bounds): Point {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.06));
  let q = { x: p.x, z: p.z };
  for (let i = 0; i < steps; i++) {
    const full = { x: q.x + dx / steps, z: q.z + dz / steps };
    if (free(full, obstacles, bounds)) q = full;
    else {
      const a = { x: q.x + dx / steps, z: q.z };
      if (free(a, obstacles, bounds)) q = a;
      const b = { x: q.x, z: q.z + dz / steps };
      if (free(b, obstacles, bounds)) q = b;
    }
  }
  return q;
}
export function clearLine(a: Point, b: Point, obstacles: Obstacle[], bounds: Bounds): boolean {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x-a.x, b.z-a.z) / 0.06));
  for (let i=1; i<=n; i++) if (!free({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n},obstacles,bounds)) return false;
  return true;
}
// Tap movement finds a short walkable route instead of walking through furniture.
export function route(start: Point, target: Point, obstacles: Obstacle[], bounds: Bounds): Point[] {
  const step = 0.22;
  const nx = Math.floor((bounds.x1-bounds.x0)/step)+1;
  const nz = Math.floor((bounds.z1-bounds.z0)/step)+1;
  const at = (i: number): Point => ({x:bounds.x0+(i%nx)*step,z:bounds.z0+Math.floor(i/nx)*step});
  const valid: number[] = [];
  for (let i=0; i<nx*nz; i++) if(free(at(i),obstacles,bounds)) valid.push(i);
  const near = (p: Point, visible = false) => {
    let best=-1, dist=Infinity;
    for(const i of valid){ const q=at(i),d=(q.x-p.x)**2+(q.z-p.z)**2;
      if(d<dist && (!visible || clearLine(p,q,obstacles,bounds))){best=i;dist=d;}}
    return best;
  };
  const s=near(start,true), goal=near(target);
  if(s<0||goal<0)return [];
  const end = free(target,obstacles,bounds) ? target : at(goal);
  if(clearLine(start,end,obstacles,bounds))return [end];
  const open = new Set([s]); const closed = new Set<number>();
  const costs=new Map([[s,0]]), prev=new Map<number,number>();
  const heuristic=(i:number)=>Math.hypot(at(i).x-at(goal).x,at(i).z-at(goal).z);
  while(open.size){
    let cur=-1,best=Infinity;
    for(const i of open){const score=costs.get(i)!+heuristic(i);if(score<best){best=score;cur=i;}}
    if(cur===goal){
      const raw:Point[]=[end];let c=cur;
      while(c!==s){raw.unshift(at(c));c=prev.get(c)!;}
      raw.unshift(at(s));
      const smooth:Point[]=[]; let anchor=start,k=0;
      while(k<raw.length){let far=k;while(far+1<raw.length&&clearLine(anchor,raw[far+1],obstacles,bounds))far++;smooth.push(raw[far]);anchor=raw[far];k=far+1;}
      return smooth;
    }
    open.delete(cur);closed.add(cur);
    const x=cur%nx,z=Math.floor(cur/nx);
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
      const xx=x+dx,zz=z+dz;if(xx<0||xx>=nx||zz<0||zz>=nz)continue;
      const next=zz*nx+xx;if(closed.has(next)||!clearLine(at(cur),at(next),obstacles,bounds))continue;
      const cost=costs.get(cur)!+Math.hypot(dx,dz)*step;
      if(cost<(costs.get(next)??Infinity)){costs.set(next,cost);prev.set(next,cur);open.add(next);}
    }
  }
  return [];
}
