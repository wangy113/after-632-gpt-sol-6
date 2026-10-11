"""Render the interpretive courtyard with Blender 4.3 / Cycles.
Usage: blender -b -t 5 -P scripts/render-courtyard.py -- preview 632
       blender -b -t 5 -P scripts/render-courtyard.py -- panorama 632
Poly Haven source textures stay local. No landscape or documented site is modeled.
"""
import bpy, math, random, sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'public/assets/polyhaven'
OUT = ROOT / 'work/renders'
OUT.mkdir(parents=True, exist_ok=True)
args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
mode = args[0] if args else 'preview'
date = args[1] if len(args)>1 else '632'
rng = random.Random(632)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)


def material(name, color, rough=.8):
    m = bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Roughness'].default_value=rough
    return m


def photo_material(asset, color=(1,1,1), strength=.65, scale=(1,1,1)):
    m=material(asset,color); n=m.node_tree.nodes; l=m.node_tree.links; p=n.get('Principled BSDF')
    coord=n.new('ShaderNodeTexCoord'); mapping=n.new('ShaderNodeVectorMath'); mapping.operation='MULTIPLY'; mapping.inputs[1].default_value=scale
    l.new(coord.outputs['UV'],mapping.inputs[0])
    for kind,socket in [('diffuse','Base Color'),('rough','Roughness')]:
        path=ASSETS/f'{asset}-{kind}.webp'
        if not path.exists(): continue
        node=n.new('ShaderNodeTexImage'); node.image=bpy.data.images.load(str(path),check_existing=True)
        if kind!='diffuse':node.image.colorspace_settings.name='Non-Color'
        l.new(mapping.outputs[0],node.inputs['Vector'])
        if kind=='diffuse':
            mix=n.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[2].default_value=(*color,1)
            l.new(node.outputs['Color'],mix.inputs[1]);l.new(mix.outputs[0],p.inputs[socket])
        else:l.new(node.outputs['Color'],p.inputs[socket])
    path=ASSETS/f'{asset}-nor_gl.webp'
    if path.exists():
        tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(path),check_existing=True);tex.image.colorspace_settings.name='Non-Color'
        l.new(mapping.outputs[0],tex.inputs['Vector'])
        normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=strength;l.new(tex.outputs['Color'],normal.inputs['Color']);l.new(normal.outputs[0],p.inputs['Normal'])
    return m

wallmat=photo_material('clay_plaster',(1.8,1.6,1.35),.8)
sandmat=photo_material('sand_01',(.83,.79,.72),.8)
woodmat=photo_material('rough_wood',(.47,.35,.22),.8, (1,2,1))
barkmat=photo_material('palm_tree_bark',(.5,.34,.2),.8,(1,3.5,1))
reedmat=photo_material('rough_wood',(.65,.52,.32),.55,(1,3,1))
stone=photo_material('clay_plaster',(.42,.4,.35),1)
rope=material('unbleached palm fibre',(.29,.22,.13),.95)
leafmats=[]
for i in range(6):
    m=material('olive palm leaflet '+str(i),(.12+i*.011,.17+i*.012,.056+i*.005),.5)
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Subsurface Weight'].default_value=.05
    leafmats.append(m)
leafstem=material('palm rachis',(.19,.21,.075),.7)
clay=material('unglazed clay',(.24,.105,.045),.93)
n=clay.node_tree.nodes;l=clay.node_tree.links;p=n.get('Principled BSDF');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=80;bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.32;bump.inputs['Distance'].default_value=.018;l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs[0],p.inputs['Normal'])


def mesh_obj(name, vertices, faces, mat, uv_fn=None):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update();obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    if mat:mesh.materials.append(mat)
    if uv_fn:
        uv=mesh.uv_layers.new(name='UVMap')
        for poly in mesh.polygons:
            for li in poly.loop_indices:uv.data[li].uv=uv_fn(mesh.vertices[mesh.loops[li].vertex_index].co,poly.normal)
    return obj


def wall(name,center,length,angle=0,height=2.65):
    verts=[];faces=[];nx=72;nz=10;d=.52
    for side in [-1,1]:
        for j in range(nz+1):
            for i in range(nx+1):
                x=-length/2+length*i/nx; top=height+.027*math.sin(x*2.7)+.014*math.cos(x*7.1)
                z=top*j/nz;y=side*d/2 +.009*math.sin(i*.7+j*1.9)
                verts.append((x,y,z))
    count=(nx+1)*(nz+1)
    for side in range(2):
        off=side*count
        for j in range(nz):
            for i in range(nx):
                a=off+j*(nx+1)+i;q=(a,a+1,a+nx+2,a+nx+1);faces.append(q if side else q[::-1])
    for i in range(nx):
        a=nz*(nx+1)+i;faces.append((a,a+1,a+1+count,a+count));faces.append((i+count,i+1+count,i+1,i))
    for j in range(nz):
        for i in [0,nx]:
            a=j*(nx+1)+i;faces.append((a,a+nx+1,a+nx+1+count,a+count))
    o=mesh_obj(name,verts,faces,wallmat,lambda co,no:(co.x/2,co.z/2));o.location=center;o.rotation_euler.z=angle
    bevel=o.modifiers.new('soft hand worn edges','BEVEL');bevel.width=.038;bevel.segments=3;bevel.limit_method='ANGLE'
    return o

wall('rear earthen wall',(0,-5.6,0),15)
wall('west earthen wall',(-7.5,.35,0),12,math.pi/2)
wall('east earthen wall',(7.5,.35,0),12,math.pi/2)
wall('entrance left',(-4.6,6.35,0),5.8)
wall('entrance right',(4.6,6.35,0),5.8)

verts=[];faces=[];nx=160;ny=140
for j in range(ny+1):
    for i in range(nx+1):
        x=-12+24*i/nx;y=-10+20*j/ny
        z=.009*math.sin(x*2.3+y*3.6)*math.cos(y*2.1)+.012*math.sin(x*.7+y*.9)
        verts.append((x,y,z))
for j in range(ny):
    for i in range(nx):
        a=j*(nx+1)+i;faces.append((a,a+1,a+nx+2,a+nx+1))
ground=mesh_obj('compacted uneven earth',verts,faces,sandmat,lambda co,no:(co.x/2.4,co.y/2.4))
for p in ground.data.polygons:p.use_smooth=True


def log(name,a,b,radius,mat=woodmat,sides=12):
    a=Vector(a);b=Vector(b);axis=b-a;length=axis.length
    verts=[];faces=[];steps=max(3,int(length*7))
    for j in range(steps+1):
        t=j/steps;r=radius*(1-.14*t)*(1+.04*math.sin(j*2.9));dx=.013*math.sin(j*.7);dy=.009*math.cos(j*.8)
        for k in range(sides):
            angle=2*math.pi*k/sides;verts.append((dx+r*math.cos(angle),dy+r*math.sin(angle),t*length))
    for j in range(steps):
        for k in range(sides):
            a0=j*sides+k;b0=j*sides+(k+1)%sides;faces.append((a0,b0,b0+sides,a0+sides))
    faces.append(tuple(range(sides-1,-1,-1)));faces.append(tuple(steps*sides+k for k in range(sides)))
    o=mesh_obj(name,verts,faces,mat)
    uv=o.data.uv_layers.new()
    for poly in o.data.polygons:
        for li in poly.loop_indices:
            vi=o.data.loops[li].vertex_index;uv.data[li].uv=((vi%sides)/sides,(vi//sides)/steps)
    for p in o.data.polygons:p.use_smooth=True
    o.location=a;o.rotation_euler=axis.to_track_quat('Z','Y').to_euler();return o

# A palm-branch canopy, with individually imperfect poles and fibre ties.
for x in [-6.2,-1.5]:
    for y in [-4.65,-1.1]:
        log('weathered shelter post',(x,y,0),(x+.035,y-.015,2.45),.105)
        for z in [2.32,2.36,2.4]:
            bpy.ops.mesh.primitive_torus_add(major_radius=.118,minor_radius=.012,major_segments=16,minor_segments=5,location=(x,y,z));bpy.context.object.data.materials.append(rope)
for y in [-4.65,-1.1]:log('main shelter beam',(-6.48,y,2.47),(-1.22,y,2.46),.11)
for i in range(65):
    x=-6.4+i*.079+rng.uniform(-.014,.014)
    log('dry roof stalk',(x,-4.95+rng.uniform(-.07,.07),2.57),(x+.04,-.82+rng.uniform(-.09,.09),2.54),rng.uniform(.013,.026),reedmat,6)
for y in [-4.7,-3.7,-2.6,-1.2]:log('cross woven branch',(-6.45,y,2.61),(-1.2,y+.07,2.61),.032,reedmat,7)

# A closed lathed vessel, with an open mouth and thick unglazed rim.
def jar(pos,scale=1):
    profile=[(.0,.035),(.14,.035),(.23,.11),(.29,.29),(.27,.47),(.17,.60),(.145,.67),(.158,.70),(.155,.73),(.12,.73),(.12,.67),(.15,.60),(.23,.45),(.25,.28),(.18,.12),(.0,.095)]
    verts=[];faces=[];sides=64
    for r,z in profile:
        for i in range(sides):
            a=i*2*math.pi/sides;verts.append((r*math.cos(a)*(1+.008*math.sin(i*2.4)),r*math.sin(a),z))
    for j in range(len(profile)-1):
        for i in range(sides):faces.append((j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i))
    o=mesh_obj('plain unglazed vessel',verts,faces,clay);o.location=pos;o.scale=(scale,)*3
    for p in o.data.polygons:p.use_smooth=True
jar((-5.8,-4.55,0),1.12);jar((-5.22,-4.62,0),.72)

# Curved trunks and many tapered, ridged leaflets replace the simple palm fans.
def palm(pos,height,seed):
    r=random.Random(seed);x,y=pos
    log('palm trunk',(x,y,0),(x+.17,y-.08,height),.205,barkmat,20)
    crown=Vector((x+.17,y-.08,height))
    # Subtle remnants of leaf bases around the crown.
    for j in range(13):
        z=height-.62+j*.048
        bpy.ops.mesh.primitive_torus_add(major_radius=.174,minor_radius=.018,major_segments=16,minor_segments=5,location=(x+.15,y-.07,z))
        o=bpy.context.object;o.data.materials.append(barkmat);o.rotation_euler=(.07*math.sin(j),.05*math.cos(j),j)
    verts=[];faces=[];indices=[]
    for f in range(31):
        a=f*2.39996+r.uniform(-.07,.07);direction=Vector((math.cos(a),math.sin(a),0));side=Vector((-math.sin(a),math.cos(a),0))
        tier=f/30;elevation=math.radians(-6+tier*82);length=r.uniform(2.45,3.0)*(1-.29*tier);sag=1.0-.45*tier
        def p(t):return crown+direction*(length*math.cos(elevation)*t)+Vector((0,0,length*math.sin(elevation)*t-sag*t*t))
        # Each rachis is slender and tapers towards its tip.
        for j in range(7):log('leaf rachis',p(j/7),p((j+1)/7),.016*(1-j/8),leafstem,5)
        for j in range(3,37):
            t=j/39;root=p(t);blade_length=(.16+.52*math.sin(math.pi*t))*(1-.28*tier)*r.uniform(.88,1.1)
            for sign in [-1,1]:
                first=len(verts)
                for k in range(7):
                    u=k/6
                    center=root+side*(sign*blade_length*u)+direction*(blade_length*.32*u)+Vector((0,0,-.13*u*u-.06*u))
                    halfwidth=.018*math.sin(math.pi*u)**.7*(1-.25*u)
                    verts.extend([tuple(center-direction*halfwidth),tuple(center+Vector((0,0,.007*math.sin(math.pi*u)))),tuple(center+direction*halfwidth)])
                for k in range(6):
                    a0=first+k*3
                    faces.extend([(a0,a0+3,a0+4,a0+1),(a0+1,a0+4,a0+5,a0+2)]);indices.extend([r.randrange(6)]*2)
    leaves=mesh_obj('dense natural palm leaflets',verts,faces,None)
    for m in leafmats:leaves.data.materials.append(m)
    for i,p in enumerate(leaves.data.polygons):p.material_index=indices[i];p.use_smooth=True
palm((4.7,-3.6),3.65,19)
palm((-5.5,-6.4),4.0,30)
palm((-7.9,3.1),4.1,50)

# A few small stones collect naturally at the wall footings.
for i in range(100):
    if i<65:x=rng.uniform(-7.1,7.1);y=-5.25+rng.uniform(-.02,.3)
    else:x=rng.uniform(-7.1,7.1);y=rng.uniform(-4.9,5.6)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=(x,y,.025))
    o=bpy.context.object;o.name='small weathered stone';s=rng.uniform(.02,.075);o.scale=(s*1.2,s,.025+rng.random()*.02);o.rotation_euler=(rng.random(),rng.random(),rng.random()*6.28);o.data.materials.append(stone)

scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.use_denoising=False
scene.cycles.samples=24 if mode=='preview' else (64 if mode=='hero' else 48)
scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.025
scene.cycles.max_bounces=6;scene.cycles.diffuse_bounces=4;scene.cycles.glossy_bounces=3
scene.render.threads_mode='FIXED';scene.render.threads=5
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB'
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.8
world=bpy.data.worlds.new('Poly Haven pure sky');world.use_nodes=True;scene.world=world
n=world.node_tree.nodes;l=world.node_tree.links;bg=n.get('Background');bg.inputs['Strength'].default_value=1.1
env=n.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(str(ASSETS/'syferfontein_18d_clear_puresky-hdri.hdr'));l.new(env.outputs['Color'],bg.inputs['Color'])
camera_bg=n.new('ShaderNodeBackground');camera_bg.inputs['Strength'].default_value=.55;l.new(env.outputs['Color'],camera_bg.inputs['Color'])
light_path=n.new('ShaderNodeLightPath');mix=n.new('ShaderNodeMixShader');l.new(light_path.outputs['Is Camera Ray'],mix.inputs[0]);l.new(bg.outputs[0],mix.inputs[1]);l.new(camera_bg.outputs[0],mix.inputs[2]);l.new(mix.outputs[0],n.get('World Output').inputs['Surface'])

sun_data=bpy.data.lights.new('daylight','SUN');sun=bpy.data.objects.new('daylight',sun_data);bpy.context.collection.objects.link(sun)
settings={'632':((-.7,-.5,-1),2.5,(1,.9,.75)), '661':((.6,-.35,-1),2.7,(1,.96,.86)), '680':((-.8,.25,-.58),2.1,(1,.81,.58))}
direction,energy,color=settings[date];sun.rotation_euler=Vector(direction).to_track_quat('-Z','Y').to_euler();sun_data.energy=energy;sun_data.color=color;sun_data.angle=math.radians(1.1)

bpy.ops.object.camera_add(location=(0,4.8,1.7));camera=bpy.context.object;scene.camera=camera
if mode=='panorama':
    camera.data.type='PANO';camera.data.panorama_type='EQUIRECTANGULAR'
    camera.rotation_euler=(math.pi/2,0,math.pi)
    scene.render.resolution_x=3072;scene.render.resolution_y=1536
else:
    target=Vector((0,-2.1,1.65));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=24
    scene.render.resolution_x=1000 if mode=='preview' else 1920;scene.render.resolution_y=650 if mode=='preview' else 1200
scene.render.resolution_percentage=100
scene.render.filepath=str(OUT/f'{mode}-{date}.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'courtyard-{date}.blend'))
bpy.ops.render.render(write_still=True)
