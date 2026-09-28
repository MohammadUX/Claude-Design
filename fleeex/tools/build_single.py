"""Build one self-contained Fleeex prototype from the Dashboard, the Planner page and the driver drawer.

The Planner is a compiled React build with its own global styles, so it runs isolated in an
iframe (srcdoc) inside the same file. The tabs switch views; #planner deep-links to the Planner.

Outputs:
  fleeex/prototype/Fleeex-prototype.html   standalone file to share (full HTML document)
  fleeex/prototype/artifact.html           same content without the document wrapper (for publishing)
"""
import base64
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "prototype"
OUT.mkdir(exist_ok=True)

drawer = (ROOT / "driver-drawer.js").read_text()
inline_drawer = "<script>\n" + drawer + "\n</script>"
TAG = '<script src="driver-drawer.js"></script>'

# ---- Planner document (runs inside the iframe)
planner = (ROOT / "planner.html").read_text()
assert TAG in planner
planner = planner.replace(TAG, inline_drawer, 1)
old_nav = "location.href=location.protocol==='file:'?'home-dashboard.html':'./';"
assert old_nav in planner
planner = planner.replace(old_nav, "parent.postMessage('fx:dashboard','*');")
planner_b64 = base64.b64encode(planner.encode("utf-8")).decode("ascii")

# ---- Dashboard with the Planner view wired in
dash = (ROOT / "home-dashboard.html").read_text()
assert TAG in dash
dash = dash.replace(TAG, inline_drawer, 1)
for a, b in [
    ('<a href="planner.html">Planner</a>', '<a href="#planner">Planner</a>'),
    ('<a class="link" href="planner.html">Open planner', '<a class="link" href="#planner">Open planner'),
]:
    assert a in dash, a
    dash = dash.replace(a, b)

view_css = """<style>
.planner-view{position:fixed;inset:0;width:100%;height:100%;border:0;z-index:200;background:#0C0B0A}
</style>
"""
view_js = """<script>
/* Planner view: the Planner page runs isolated in an iframe inside this single file. */
const PLANNER_B64='""" + planner_b64 + """';
let plannerFrame=null;
function showView(v){
  const onPlanner=v==='planner';
  if(onPlanner&&!plannerFrame){
    plannerFrame=document.createElement('iframe');
    plannerFrame.className='planner-view';plannerFrame.title='Planner';
    plannerFrame.srcdoc=new TextDecoder().decode(Uint8Array.from(atob(PLANNER_B64),c=>c.charCodeAt(0)));
    document.body.appendChild(plannerFrame);
  }
  if(plannerFrame)plannerFrame.hidden=!onPlanner;
  document.documentElement.style.overflow=onPlanner?'hidden':'';
  if(onPlanner&&plannerFrame)plannerFrame.focus();
}
document.addEventListener('click',e=>{const a=e.target.closest('a[href="#planner"]');if(!a)return;e.preventDefault();if(location.hash!=='#planner')location.hash='planner';else showView('planner')});
addEventListener('hashchange',()=>showView(location.hash==='#planner'?'planner':'dashboard'));
addEventListener('message',e=>{if(e.data==='fx:dashboard'){if(location.hash==='#planner')location.hash='';showView('dashboard')}});
if(location.hash==='#planner')showView('planner');
</script>
"""
dash = dash.replace("<title>Fleeex Home Dashboard</title>", "<title>Fleeex Prototype</title>", 1)
dash = dash + "\n" + view_css + view_js

(OUT / "artifact.html").write_text(dash)

cut = dash.index('<header class="hero">')
standalone = (
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    + dash[:cut] + "</head>\n<body>\n" + dash[cut:] + "\n</body>\n</html>\n"
)
(OUT / "Fleeex-prototype.html").write_text(standalone)
print("built", OUT / "Fleeex-prototype.html", len(standalone) // 1024, "KB")
