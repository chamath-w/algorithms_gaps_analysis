/**
 * Step-through movies for all 21 algorithm patterns (Algorithm Memory Lab).
 * Requires AlgoAnimation from animations.js.
 */
(function () {
  "use strict";

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function paintArray(svg, values, opts) {
    if (!svg) return;
    opts = opts || {};
    const hi = opts.hi || {};
    const note = opts.note || "";
    const pointers = opts.pointers || {};
    const n = values.length;
    const cellW = Math.min(70, n ? Math.floor(500 / n) : 70);
    const startX = 24;
    const y = 40;
    let html = "";
    values.forEach((v, idx) => {
      const x = startX + idx * (cellW + 6);
      let fill = "#21262d";
      if (hi[idx] === "focus") fill = "#3d2f00";
      else if (hi[idx] === "done") fill = "#1f3a5f";
      else if (hi[idx] === "good") fill = "#1a3d2e";
      else if (hi[idx] === "bad") fill = "#3d1219";
      else if (hi[idx] === "win") fill = "#1f3a5f";
      html += `<rect x="${x}" y="${y}" width="${cellW}" height="48" rx="6" fill="${fill}" stroke="#484f58"/>`;
      html += `<text x="${x + cellW / 2}" y="${y + 30}" text-anchor="middle" fill="#e6edf3" font-size="15">${esc(
        String(v)
      )}</text>`;
      html += `<text x="${x + cellW / 2}" y="${y - 8}" text-anchor="middle" fill="#8b949e" font-size="11">${idx}</text>`;
    });
    Object.keys(pointers).forEach((label) => {
      const idx = pointers[label];
      if (idx == null || idx < 0 || idx >= n) return;
      const x = startX + idx * (cellW + 6) + cellW / 2;
      html += `<text x="${x}" y="${y + 68}" text-anchor="middle" fill="#58a6ff" font-size="12">${esc(
        label
      )}</text>`;
    });
    if (note) {
      html += `<text x="${startX}" y="128" fill="#39d2c0" font-size="13">${esc(note)}</text>`;
    }
    svg.setAttribute("viewBox", `0 0 ${Math.max(560, startX * 2 + n * (cellW + 6))} 150`);
    svg.innerHTML = html;
  }

  function paintBoard(svg, lines) {
    if (!svg) return;
    const h = Math.max(150, 40 + lines.length * 22);
    svg.setAttribute("viewBox", `0 0 640 ${h}`);
    let html = `<rect x="8" y="8" width="624" height="${h - 16}" rx="8" fill="#161b22" stroke="#30363d"/>`;
    lines.forEach((line, i) => {
      html += `<text x="24" y="${36 + i * 22}" fill="#e6edf3" font-size="14" font-family="ui-monospace,monospace">${esc(
        line
      )}</text>`;
    });
    svg.innerHTML = html;
  }

  function paintGraph(svg, nodes, edges, opts) {
    opts = opts || {};
    const active = opts.active;
    const visited = opts.visited || new Set();
    const labels = opts.labels || {};
    let html = "";
    edges.forEach(([a, b]) => {
      const A = nodes[a],
        B = nodes[b];
      html += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="#30363d" stroke-width="2"/>`;
    });
    nodes.forEach((n, i) => {
      let fill = "#21262d";
      if (active === i) fill = "#58a6ff";
      else if (visited.has(i)) fill = "#3fb950";
      html += `<circle cx="${n.x}" cy="${n.y}" r="20" fill="${fill}" stroke="#484f58" stroke-width="2"/>`;
      html += `<text x="${n.x}" y="${n.y + 5}" text-anchor="middle" fill="#e6edf3" font-size="13">${
        labels[i] != null ? esc(String(labels[i])) : i
      }</text>`;
    });
    if (opts.note) {
      html += `<text x="20" y="210" fill="#39d2c0" font-size="13">${esc(opts.note)}</text>`;
    }
    svg.setAttribute("viewBox", "0 0 420 220");
    svg.innerHTML = html;
  }

  /** @returns {{ title: string, build: (svg: SVGElement) => { steps, onReset } }} */
  const MOVIES = {
    sliding_window: {
      title: "Longest unique window on [a,b,c,a,b]",
      build(svg) {
        const s = ["a", "b", "c", "a", "b"];
        const frames = [
          { L: 0, R: 0, best: 1, d: "R=0 'a' → window [a], best=1" },
          { L: 0, R: 1, best: 2, d: "R=1 'b' → [a,b], best=2" },
          { L: 0, R: 2, best: 3, d: "R=2 'c' → [a,b,c], best=3" },
          { L: 1, R: 3, best: 3, d: "R=3 'a' duplicate → L past old a" },
          { L: 2, R: 4, best: 3, d: "R=4 'b' duplicate → L past old b; best=3" },
        ];
        const paint = (L, R, best) => {
          const hi = {};
          for (let i = L; i <= R; i++) hi[i] = "win";
          if (R >= 0) hi[R] = "focus";
          paintArray(svg, s, {
            hi,
            note: `L=${L} R=${R} best=${best}`,
            pointers: R >= 0 ? { L, R } : {},
          });
        };
        paint(0, -1, 0);
        return {
          steps: frames.map((f) => ({
            description: f.d,
            apply: () => paint(f.L, f.R, f.best),
          })),
          onReset: () => paint(0, -1, 0),
        };
      },
    },

    two_pointers: {
      title: "Two Sum on sorted [1,2,4,6,8], target=10",
      build(svg) {
        const a = [1, 2, 4, 6, 8];
        const paint = (l, r, note, found) => {
          const hi = {
            [l]: found ? "done" : "focus",
            [r]: found ? "done" : "focus",
          };
          paintArray(svg, a, { hi, note, pointers: { L: l, R: r } });
        };
        const correct = [];
        let L = 0,
          R = a.length - 1;
        while (L < R) {
          const sum = a[L] + a[R];
          if (sum === 10) {
            correct.push({ L, R, sum, msg: "FOUND", found: true });
            break;
          }
          correct.push({
            L,
            R,
            sum,
            msg: sum < 10 ? "too small → L++" : "too big → R--",
            found: false,
          });
          if (sum < 10) L++;
          else R--;
        }
        return {
          steps: correct.map((f) => ({
            description: `L=${f.L} R=${f.R}: ${a[f.L]}+${a[f.R]}=${f.sum} — ${f.msg}`,
            apply: () =>
              paint(f.L, f.R, `sum=${f.sum}${f.found ? " FOUND" : ""}`, f.found),
          })),
          onReset: () => paint(0, a.length - 1, "L at start, R at end", false),
        };
      },
    },

    binary_search: {
      title: "Find 7 in [1,3,5,7,9,11]",
      build(svg) {
        const a = [1, 3, 5, 7, 9, 11];
        const target = 7;
        const frames = [];
        let lo = 0,
          hi = 5;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          const hiMap = {};
          for (let i = lo; i <= hi; i++) hiMap[i] = "good";
          hiMap[mid] = "focus";
          if (a[mid] === target) {
            hiMap[mid] = "done";
            frames.push({
              d: `lo=${lo} hi=${hi} mid=${mid}: ${a[mid]}==${target} → return ${mid}`,
              hiMap,
              note: `FOUND index ${mid}`,
              mid,
              lo,
              hi,
            });
            break;
          }
          frames.push({
            d: `lo=${lo} hi=${hi} mid=${mid}: ${a[mid]} ${a[mid] < target ? "<" : ">"} ${target}`,
            hiMap,
            note: a[mid] < target ? "lo=mid+1" : "hi=mid-1",
            mid,
            lo,
            hi,
          });
          if (a[mid] < target) lo = mid + 1;
          else hi = mid - 1;
        }
        const paint = (hiMap, note, ptr) =>
          paintArray(svg, a, { hi: hiMap, note, pointers: ptr || {} });
        return {
          steps: frames.map((f) => ({
            description: f.d,
            apply: () =>
              paint(f.hiMap, f.note, { lo: f.lo, mid: f.mid, hi: f.hi }),
          })),
          onReset: () => paint({}, "sorted array — discard half each step", {}),
        };
      },
    },

    bfs: {
      title: "BFS rings from node 0",
      build(svg) {
        const nodes = [
          { x: 60, y: 100 },
          { x: 180, y: 45 },
          { x: 180, y: 155 },
          { x: 300, y: 45 },
          { x: 300, y: 155 },
        ];
        const edges = [
          [0, 1],
          [0, 2],
          [1, 3],
          [2, 4],
          [1, 4],
        ];
        const seen = new Set();
        return {
          steps: [
            {
              description: "Enqueue 0",
              apply: () => {
                seen.clear();
                seen.add(0);
                paintGraph(svg, nodes, edges, {
                  active: 0,
                  visited: seen,
                  note: "queue=[0]",
                });
              },
            },
            {
              description: "Pop 0 — discover 1,2 (distance 1)",
              apply: () => {
                seen.add(1);
                seen.add(2);
                paintGraph(svg, nodes, edges, {
                  active: 1,
                  visited: seen,
                  note: "queue=[1,2]",
                });
              },
            },
            {
              description: "Pop 1 — discover 3,4",
              apply: () => {
                seen.add(3);
                seen.add(4);
                paintGraph(svg, nodes, edges, {
                  active: 3,
                  visited: seen,
                  note: "first touch = shortest hops",
                });
              },
            },
            {
              description: "Done — order 0,1,2,3,4",
              apply: () =>
                paintGraph(svg, nodes, edges, {
                  active: -1,
                  visited: seen,
                  note: "wavefront complete",
                }),
            },
          ],
          onReset: () => {
            seen.clear();
            paintGraph(svg, nodes, edges, { active: -1, visited: seen, note: "start" });
          },
        };
      },
    },

    dfs: {
      title: "DFS preorder on a small tree",
      build(svg) {
        const nodes = [
          { x: 200, y: 40 },
          { x: 100, y: 110 },
          { x: 300, y: 110 },
          { x: 60, y: 180 },
          { x: 140, y: 180 },
        ];
        const edges = [
          [0, 1],
          [0, 2],
          [1, 3],
          [1, 4],
        ];
        const order = [];
        const seen = new Set();
        const path = [0, 1, 3, 4, 2];
        return {
          steps: path.map((u, i) => ({
            description: `Visit ${u} (preorder step ${i + 1})`,
            apply: () => {
              seen.add(u);
              order.push(u);
              paintGraph(svg, nodes, edges, {
                active: u,
                visited: seen,
                note: `order=${order.join(",")}`,
              });
            },
          })),
          onReset: () => {
            seen.clear();
            order.length = 0;
            paintGraph(svg, nodes, edges, {
              active: -1,
              visited: seen,
              note: "stack/recursion depth-first",
            });
          },
        };
      },
    },

    topological_sort: {
      title: "Kahn: peel indegree-0 nodes",
      build(svg) {
        // 0→1→3, 0→2→3
        const frames = [
          ["indeg=[0,1,1,2]", "queue=[0]", "order=[]"],
          ["Take 0 → indeg 1,2 become 0", "queue=[1,2]", "order=[0]"],
          ["Take 1 → indeg 3 = 1", "queue=[2]", "order=[0,1]"],
          ["Take 2 → indeg 3 = 0", "queue=[3]", "order=[0,1,2]"],
          ["Take 3 → done", "queue=[]", "order=[0,1,2,3]"],
        ];
        return {
          steps: frames.map((lines, i) => ({
            description: lines[0],
            apply: () => paintBoard(svg, lines),
          })),
          onReset: () =>
            paintBoard(svg, [
              "Edges: 0→1, 0→2, 1→3, 2→3",
              "Start: queue all indegree-0",
            ]),
        };
      },
    },

    dp: {
      title: "Kadane — max subarray on [−2,1,−3,4,−1,2,1]",
      build(svg) {
        const a = [-2, 1, -3, 4, -1, 2, 1];
        let cur = a[0],
          best = a[0];
        const frames = [
          {
            d: "Init cur=best=-2",
            i: 0,
            cur: -2,
            best: -2,
          },
        ];
        for (let i = 1; i < a.length; i++) {
          cur = Math.max(a[i], cur + a[i]);
          best = Math.max(best, cur);
          frames.push({ d: `i=${i}: cur=${cur}, best=${best}`, i, cur, best });
        }
        return {
          steps: frames.map((f) => ({
            description: f.d,
            apply: () =>
              paintArray(svg, a, {
                hi: { [f.i]: "focus" },
                note: `cur=${f.cur} best=${f.best}`,
                pointers: { i: f.i },
              }),
          })),
          onReset: () =>
            paintArray(svg, a, { note: "cur=max(x, cur+x); best=max(best,cur)", hi: {} }),
        };
      },
    },

    greedy: {
      title: "Merge intervals [[1,3],[2,6],[8,10],[15,18]]",
      build(svg) {
        const frames = [
          ["Sort by start", "[[1,3],[2,6],[8,10],[15,18]]", "merged=[]"],
          ["[1,3] → push", "merged=[[1,3]]"],
          ["[2,6] overlaps → extend end to 6", "merged=[[1,6]]"],
          ["[8,10] no overlap → push", "merged=[[1,6],[8,10]]"],
          ["[15,18] push", "merged=[[1,6],[8,10],[15,18]]"],
        ];
        return {
          steps: frames.map((lines) => ({
            description: lines[0],
            apply: () => paintBoard(svg, lines),
          })),
          onReset: () => paintBoard(svg, ["Greedy: sort key, then local safe choice"]),
        };
      },
    },

    backtracking: {
      title: "Subsets of [1,2] — choose / explore / unchoose",
      build(svg) {
        const frames = [
          ["path=[] → emit []", "decide on 1…"],
          ["include 1 → path=[1] emit [1]", "decide on 2…"],
          ["include 2 → path=[1,2] emit [1,2]", "unchoose 2"],
          ["skip 2 (already explored)", "unchoose 1"],
          ["skip 1; include 2 → [2]", "power set done: [],[1],[1,2],[2]"],
        ];
        return {
          steps: frames.map((lines) => ({
            description: lines[0],
            apply: () => paintBoard(svg, lines),
          })),
          onReset: () => paintBoard(svg, ["Decision tree: include or skip each element"]),
        };
      },
    },

    heap: {
      title: "Kth largest — nums=[3,2,1,5,6,4], k=2",
      build(svg) {
        const frames = [
          ["Want 2nd largest", "min-heap of size k (or sort desc)"],
          ["sorted desc = [6,5,4,3,2,1]", "index k-1 → 5"],
          ["Answer = 5", "heapq.nlargest(2, nums)[-1]"],
        ];
        return {
          steps: frames.map((lines) => ({
            description: lines[lines.length - 1],
            apply: () => paintBoard(svg, lines),
          })),
          onReset: () => paintBoard(svg, ["Priority queue: repeated extract"]),
        };
      },
    },

    monotonic_stack: {
      title: "Next greater on [2,1,2,4,3]",
      build(svg) {
        const a = [2, 1, 2, 4, 3];
        const ans = [-1, -1, -1, -1, -1];
        const stack = [];
        const frames = [];
        for (let i = 0; i < a.length; i++) {
          while (stack.length && a[stack[stack.length - 1]] < a[i]) {
            const j = stack.pop();
            ans[j] = a[i];
            frames.push({
              d: `nums[${i}]=${a[i]} > nums[${j}] → ans[${j}]=${a[i]}`,
              hi: { [j]: "done", [i]: "focus" },
              note: `ans=${JSON.stringify(ans)} stack=${JSON.stringify(stack)}`,
            });
          }
          stack.push(i);
          frames.push({
            d: `Push index ${i}`,
            hi: { [i]: "focus" },
            note: `stack=${JSON.stringify(stack)} ans=${JSON.stringify(ans)}`,
          });
        }
        return {
          steps: frames.map((f) => ({
            description: f.d,
            apply: () => paintArray(svg, a, { hi: f.hi, note: f.note, pointers: {} }),
          })),
          onReset: () =>
            paintArray(svg, a, {
              note: "monotonic decreasing stack of indices",
              hi: {},
            }),
        };
      },
    },

    union_find: {
      title: "Union edges → count components (n=5)",
      build(svg) {
        const frames = [
          ["n=5 parent=[0,1,2,3,4]", "comps=5"],
          ["Union 0-1 → comps=4", "parent≈[0,0,2,3,4]"],
          ["Union 1-2 → comps=3", "0,1,2 connected"],
          ["Union 3-4 → comps=2", "two components left"],
          ["Answer comps=2", "path compression keeps finds fast"],
        ];
        return {
          steps: frames.map((lines) => ({
            description: lines[0],
            apply: () => paintBoard(svg, lines),
          })),
          onReset: () => paintBoard(svg, ["DSU: merge sets; count roots"]),
        };
      },
    },

    trie: {
      title: "Insert app, apple, bat — count prefix 'ap'",
      build(svg) {
        const frames = [
          ["Insert 'app' — edges a→p→p (end)", "counts along path +=1"],
          ["Insert 'apple' — share 'app', add l→e", "prefix 'app' count=2"],
          ["Insert 'bat' — new branch b→a→t", "unrelated"],
          ["Query 'ap' — walk a→p → count=2", "shared prefixes = shared nodes"],
        ];
        return {
          steps: frames.map((lines) => ({
            description: lines[0],
            apply: () => paintBoard(svg, lines),
          })),
          onReset: () => paintBoard(svg, ["Trie: one edge per character"]),
        };
      },
    },

    prefix_sum: {
      title: "Prefix then range sum on [2,3,1,5]",
      build(svg) {
        const a = [2, 3, 1, 5];
        const pref = [0, 2, 5, 6, 11];
        return {
          steps: [
            {
              description: "Build pref: [0,2,5,6,11]",
              apply: () =>
                paintArray(svg, a, {
                  note: `pref=${JSON.stringify(pref)}`,
                  hi: {},
                }),
            },
            {
              description: "sum(1..2)=pref[3]-pref[1]=6-2=4",
              apply: () =>
                paintArray(svg, a, {
                  hi: { 1: "win", 2: "win" },
                  note: "sum(1..2)=4",
                  pointers: { L: 1, R: 2 },
                }),
            },
            {
              description: "sum(0..3)=pref[4]-pref[0]=11",
              apply: () =>
                paintArray(svg, a, {
                  hi: { 0: "win", 1: "win", 2: "win", 3: "win" },
                  note: "full sum=11",
                }),
            },
          ],
          onReset: () =>
            paintArray(svg, a, { note: "range = two prefix lookups", hi: {} }),
        };
      },
    },

    hash_map: {
      title: "Two Sum [2,7,11,15], target=9",
      build(svg) {
        const a = [2, 7, 11, 15];
        return {
          steps: [
            {
              description: "i=0 val=2; need 7; store 2→0",
              apply: () =>
                paintArray(svg, a, {
                  hi: { 0: "focus" },
                  note: "seen={2:0}",
                  pointers: { i: 0 },
                }),
            },
            {
              description: "i=1 val=7; need 2; FOUND at 0 → [0,1]",
              apply: () =>
                paintArray(svg, a, {
                  hi: { 0: "done", 1: "done" },
                  note: "seen={2:0} answer=[0,1]",
                  pointers: { i: 1 },
                }),
            },
          ],
          onReset: () =>
            paintArray(svg, a, { note: "store value→index; look up complement", hi: {} }),
        };
      },
    },

    dijkstra: {
      title: "Shortest paths from 0 (non-negative weights)",
      build(svg) {
        const frames = [
          ["dist=[0, ∞, ∞]", "pq=[(0,0)]"],
          ["Settle 0; relax 0→1 (4), 0→2 (1)", "dist=[0,4,1]"],
          ["Settle 2 (cheaper); relax 2→1 (2)", "dist[1]=min(4,1+2)=3"],
          ["Settle 1; done", "dist=[0,3,1]"],
        ];
        return {
          steps: frames.map((lines) => ({
            description: lines[0],
            apply: () => paintBoard(svg, lines),
          })),
          onReset: () =>
            paintBoard(svg, ["Expand cheapest unsettled node", "weights ≥ 0"]),
        };
      },
    },

    binary_search_answer: {
      title: "Minimize k — monotone can(k)",
      build(svg) {
        const frames = [
          { lo: 1, hi: 11, mid: 6, ok: false, ans: "?", d: "mid=6 can=False → lo=7" },
          { lo: 7, hi: 11, mid: 9, ok: true, ans: 9, d: "mid=9 can=True → hi=8 ans=9" },
          { lo: 7, hi: 8, mid: 7, ok: true, ans: 7, d: "mid=7 can=True → ans=7" },
          { lo: 7, hi: 6, mid: 7, ok: true, ans: 7, d: "Converged — min k=7" },
        ];
        const paint = (lo, hi, mid, ok, ans) => {
          const L = 1,
            H = 11,
            w = 480,
            x0 = 40;
          const t = (v) => x0 + ((v - L) / (H - L)) * w;
          let html = `<line x1="${x0}" y1="70" x2="${x0 + w}" y2="70" stroke="#484f58" stroke-width="4"/>`;
          html += `<circle cx="${t(lo)}" cy="70" r="8" fill="#58a6ff"/>`;
          html += `<circle cx="${t(Math.max(lo, hi))}" cy="70" r="8" fill="#f85149"/>`;
          if (mid != null) {
            html += `<circle cx="${t(mid)}" cy="70" r="10" fill="${ok ? "#3fb950" : "#d29922"}"/>`;
          }
          html += `<text x="40" y="30" fill="#e6edf3" font-size="14">lo=${lo} hi=${hi} mid=${mid} can=${ok} ans=${ans}</text>`;
          html += `<text x="40" y="110" fill="#8b949e" font-size="13">Search the answer on a feasibility line</text>`;
          svg.setAttribute("viewBox", "0 0 560 140");
          svg.innerHTML = html;
        };
        return {
          steps: frames.map((f) => ({
            description: f.d,
            apply: () => paint(f.lo, f.hi, f.mid, f.ok, f.ans),
          })),
          onReset: () => paint(1, 11, null, null, "?"),
        };
      },
    },

    sweep_line: {
      title: "Max concurrent [[0,30],[5,10],[15,20]]",
      build(svg) {
        const frames = [
          ["Events: (0,+1)(5,+1)(10,-1)(15,+1)(20,-1)(30,-1)", "sort by time"],
          ["t=0 +1 → active=1 best=1", ""],
          ["t=5 +1 → active=2 best=2", "peak concurrency"],
          ["t=10 -1 → active=1", ""],
          ["t=15 +1 → active=2 best=2", "answer=2"],
        ];
        return {
          steps: frames.map((lines) => ({
            description: lines[0],
            apply: () => paintBoard(svg, lines.filter(Boolean)),
          })),
          onReset: () => paintBoard(svg, ["+1 start, −1 end; scan active count"]),
        };
      },
    },

    linked_list: {
      title: "Reverse 1→2→3→None",
      build(svg) {
        const steps = [
          {
            d: "Start: 1→2→3",
            vals: [1, 2, 3],
            note: "prev=None",
            hi: { 0: "focus" },
          },
          {
            d: "After first rewire: 1← · 2→3",
            vals: [1, 2, 3],
            note: "prev=1 cur=2",
            hi: { 0: "done", 1: "focus" },
          },
          {
            d: "After second: 2→1 · 3",
            vals: [2, 1, 3],
            note: "prev=2 cur=3",
            hi: { 0: "done", 1: "done", 2: "focus" },
          },
          {
            d: "Done: 3→2→1",
            vals: [3, 2, 1],
            note: "return prev",
            hi: { 0: "done", 1: "done", 2: "done" },
          },
        ];
        return {
          steps: steps.map((f) => ({
            description: f.d,
            apply: () =>
              paintArray(svg, f.vals, { hi: f.hi, note: f.note, pointers: {} }),
          })),
          onReset: () =>
            paintArray(svg, [1, 2, 3], {
              note: "prev / cur / nxt — never lose next",
              hi: {},
            }),
        };
      },
    },

    bit_manipulation: {
      title: "XOR unique — [4,1,2,1,2]",
      build(svg) {
        const a = [4, 1, 2, 1, 2];
        let x = 0;
        const frames = [];
        a.forEach((n, i) => {
          const prev = x;
          x ^= n;
          frames.push({
            d: `i=${i}: ${prev} XOR ${n} = ${x}`,
            i,
            x,
          });
        });
        return {
          steps: frames.map((f) => ({
            description: f.d,
            apply: () =>
              paintArray(svg, a, {
                hi: { [f.i]: "focus" },
                note: `running XOR=${f.x}`,
                pointers: { i: f.i },
              }),
          })),
          onReset: () =>
            paintArray(svg, a, { note: "pairs cancel → unique remains", hi: {} }),
        };
      },
    },

    difference_array: {
      title: "Range updates on n=5 zeros",
      build(svg) {
        const frames = [
          ["diff=[0,0,0,0,0,0]", "n=5"],
          ["Update [1,3]+=2 → diff[1]+=2, diff[4]-=2", "diff=[0,2,0,0,-2,0]"],
          ["Update [2,4]+=3 → diff[2]+=3, diff[5]-=3", "diff=[0,2,3,0,-2,-3]"],
          ["Prefix reconstruct", "out=[0,2,5,5,3]"],
        ];
        return {
          steps: frames.map((lines) => ({
            description: lines[0],
            apply: () => paintBoard(svg, lines),
          })),
          onReset: () =>
            paintBoard(svg, ["+val at L, −val at R+1; then integrate"]),
        };
      },
    },
  };

  function mountMovie(host, patternId) {
    if (!host) return;
    const movie = MOVIES[patternId];
    if (!movie || typeof AlgoAnimation !== "function") {
      host.innerHTML = `<p class="text-muted">No movie for ${esc(patternId)}.</p>`;
      return;
    }
    const uid = "anim-mem-" + patternId + "-" + Math.random().toString(36).slice(2, 7);
    host.innerHTML = `
      <h4>Movie — burn the loop</h4>
      <div class="diagram-container diagram-layout-stack" id="${uid}">
        <div class="diagram-title">${esc(movie.title)}</div>
        <div class="arena-worked-svg-wrap">
          <svg id="${uid}-svg" width="100%" height="160" viewBox="0 0 560 150" role="img" aria-label="Pattern animation"></svg>
        </div>
        <div class="anim-controls"></div>
        <div class="anim-description">Press Play or Next.</div>
      </div>
    `;
    const svg = host.querySelector(`#${uid}-svg`);
    const built = movie.build(svg);
    built.onReset();
    new AlgoAnimation(uid, built.steps, { onReset: built.onReset });
  }

  function hasMovie(id) {
    return !!MOVIES[id];
  }

  window.AlgoMemoryMovies = {
    MOVIES,
    mountMovie,
    hasMovie,
    allIds: () => Object.keys(MOVIES),
  };
})();
