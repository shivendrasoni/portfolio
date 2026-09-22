```svg A ring with 3 physical nodes and 10 virtual nodes. The dashed arcs are the keys that move when node B is lost, which is the only thing the ring guarantees. It says nothing about how much traffic those keys carry.
<svg xmlns=@http://www.w3.org/2000/svg@ viewBox=@0 0 660 440@ width=@660@ height=@440@ font-family=@Inter, ui-sans-serif, system-ui, sans-serif@ role=@img@>
<circle cx=@330@ cy=@210@ r=@140@ fill=@none@ stroke=@#3f3f46@ stroke-width=@2@/>
<path d=@M 359.1 73.1 A 140 140 0 0 1 440.3 123.8@ fill=@none@ stroke=@#f4a6a6@ stroke-width=@7@ stroke-dasharray=@6 5@/>
<path d=@M 366.2 345.2 A 140 140 0 0 1 286.7 343.1@ fill=@none@ stroke=@#f4a6a6@ stroke-width=@7@ stroke-dasharray=@6 5@/>
<path d=@M 190.1 205.1 A 140 140 0 0 1 215.3 129.7@ fill=@none@ stroke=@#f4a6a6@ stroke-width=@7@ stroke-dasharray=@6 5@/>
<line x1=@357.2@ y1=@81.9@ x2=@361@ y2=@64.3@ stroke=@#e4e4e7@ stroke-width=@3@/>
<text x=@364.5@ y=@47.6@ fill=@#e4e4e7@ font-size=@13@ text-anchor=@middle@ dominant-baseline=@middle@>A</text>
<line x1=@433.2@ y1=@129.3@ x2=@447.4@ y2=@118.3@ stroke=@#f4a6a6@ stroke-width=@3@/>
<text x=@460.8@ y=@107.8@ fill=@#f4a6a6@ font-size=@13@ text-anchor=@middle@ dominant-baseline=@middle@>B</text>
<line x1=@460.9@ y1=@205.4@ x2=@478.9@ y2=@204.8@ stroke=@#9fc7f0@ stroke-width=@3@/>
<text x=@495.9@ y=@204.2@ fill=@#9fc7f0@ font-size=@13@ text-anchor=@middle@ dominant-baseline=@middle@>C</text>
<line x1=@433.2@ y1=@290.7@ x2=@447.4@ y2=@301.7@ stroke=@#e4e4e7@ stroke-width=@3@/>
<text x=@460.8@ y=@312.2@ fill=@#e4e4e7@ font-size=@13@ text-anchor=@middle@ dominant-baseline=@middle@>A</text>
<line x1=@363.9@ y1=@336.5@ x2=@368.6@ y2=@353.9@ stroke=@#9fc7f0@ stroke-width=@3@/>
<text x=@373@ y=@370.3@ fill=@#9fc7f0@ font-size=@13@ text-anchor=@middle@ dominant-baseline=@middle@>C</text>
<line x1=@289.5@ y1=@334.6@ x2=@284@ y2=@351.7@ stroke=@#f4a6a6@ stroke-width=@3@/>
<text x=@278.7@ y=@367.9@ fill=@#f4a6a6@ font-size=@13@ text-anchor=@middle@ dominant-baseline=@middle@>B</text>
<line x1=@226.8@ y1=@290.7@ x2=@212.6@ y2=@301.7@ stroke=@#e4e4e7@ stroke-width=@3@/>
<text x=@199.2@ y=@312.2@ fill=@#e4e4e7@ font-size=@13@ text-anchor=@middle@ dominant-baseline=@middle@>A</text>
<line x1=@199.1@ y1=@205.4@ x2=@181.1@ y2=@204.8@ stroke=@#9fc7f0@ stroke-width=@3@/>
<text x=@164.1@ y=@204.2@ fill=@#9fc7f0@ font-size=@13@ text-anchor=@middle@ dominant-baseline=@middle@>C</text>
<line x1=@222.7@ y1=@134.9@ x2=@207.9@ y2=@124.5@ stroke=@#f4a6a6@ stroke-width=@3@/>
<text x=@194@ y=@114.8@ fill=@#f4a6a6@ font-size=@13@ text-anchor=@middle@ dominant-baseline=@middle@>B</text>
<line x1=@285.2@ y1=@86.9@ x2=@279@ y2=@70@ stroke=@#e4e4e7@ stroke-width=@3@/>
<text x=@273.2@ y=@54@ fill=@#e4e4e7@ font-size=@13@ text-anchor=@middle@ dominant-baseline=@middle@>A</text>
<circle cx=@387@ cy=@111.3@ r=@3.5@ fill=@#71717a@/>
<text x=@379@ y=@125.1@ fill=@#71717a@ font-size=@11@ text-anchor=@middle@ dominant-baseline=@middle@>k1</text>
<circle cx=@437.1@ cy=@171@ r=@3.5@ fill=@#71717a@/>
<text x=@422.1@ y=@176.5@ fill=@#71717a@ font-size=@11@ text-anchor=@middle@ dominant-baseline=@middle@>k2</text>
<circle cx=@435.7@ cy=@252.7@ r=@3.5@ fill=@#71717a@/>
<text x=@420.9@ y=@246.7@ fill=@#71717a@ font-size=@11@ text-anchor=@middle@ dominant-baseline=@middle@>k3</text>
<circle cx=@387@ cy=@308.7@ r=@3.5@ fill=@#71717a@/>
<text x=@379@ y=@294.9@ fill=@#71717a@ font-size=@11@ text-anchor=@middle@ dominant-baseline=@middle@>k4</text>
<circle cx=@318.1@ cy=@323.4@ r=@3.5@ fill=@#71717a@/>
<text x=@319.8@ y=@307.5@ fill=@#71717a@ font-size=@11@ text-anchor=@middle@ dominant-baseline=@middle@>k5</text>
<circle cx=@264.6@ cy=@303.4@ r=@3.5@ fill=@#71717a@/>
<text x=@273.8@ y=@290.3@ fill=@#71717a@ font-size=@11@ text-anchor=@middle@ dominant-baseline=@middle@>k6</text>
<circle cx=@218.5@ cy=@233.7@ r=@3.5@ fill=@#71717a@/>
<text x=@234.1@ y=@230.4@ fill=@#71717a@ font-size=@11@ text-anchor=@middle@ dominant-baseline=@middle@>k7</text>
<circle cx=@224.3@ cy=@167.3@ r=@3.5@ fill=@#71717a@/>
<text x=@239.1@ y=@173.3@ fill=@#71717a@ font-size=@11@ text-anchor=@middle@ dominant-baseline=@middle@>k8</text>
<circle cx=@259.8@ cy=@120.2@ r=@3.5@ fill=@#71717a@/>
<text x=@269.7@ y=@132.8@ fill=@#71717a@ font-size=@11@ text-anchor=@middle@ dominant-baseline=@middle@>k9</text>
<text x=@330@ y=@192@ fill=@#a1a1aa@ font-size=@13@ text-anchor=@middle@>3 physical nodes</text>
<text x=@330@ y=@212@ fill=@#a1a1aa@ font-size=@13@ text-anchor=@middle@>10 virtual nodes</text>
<text x=@330@ y=@232@ fill=@#f4a6a6@ font-size=@13@ text-anchor=@middle@>dashed arcs move if B dies</text>
<rect x=@24@ y=@372@ width=@10@ height=@10@ fill=@#e4e4e7@/>
<text x=@42@ y=@380@ fill=@#a1a1aa@ font-size=@12@ dominant-baseline=@middle@>Node A: 4 vnodes</text>
<rect x=@24@ y=@390@ width=@10@ height=@10@ fill=@#f4a6a6@/>
<text x=@42@ y=@398@ fill=@#a1a1aa@ font-size=@12@ dominant-baseline=@middle@>Node B: 3 vnodes, owns the dashed arcs</text>
<rect x=@24@ y=@408@ width=@10@ height=@10@ fill=@#9fc7f0@/>
<text x=@42@ y=@416@ fill=@#a1a1aa@ font-size=@12@ dominant-baseline=@middle@>Node C: 3 vnodes</text>
<rect x=@24@ y=@426@ width=@10@ height=@10@ fill=@#71717a@/>
<text x=@42@ y=@434@ fill=@#a1a1aa@ font-size=@12@ dominant-baseline=@middle@>keys, placed clockwise to the next vnode</text>
<text x=@24@ y=@28@ fill=@#a1a1aa@ font-size=@12@>Assumption: uniform hash, no load feedback. Ownership is the arc ending at a vnode, walking clockwise.</text>
</svg>
```

