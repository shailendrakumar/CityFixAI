import re
from typing import TypedDict, List, Optional
from langgraph.graph import StateGraph, END

CATEGORIES = ['pothole','streetlight','water_leak','trash','sidewalk','graffiti','traffic_signal','other']
KEYWORDS = {'pothole':['pothole','hole','crater'],'streetlight':['streetlight','lamp','light'],'water_leak':['water','leak','pipe','hydrant'],'trash':['trash','garbage','dump','debris'],'sidewalk':['sidewalk','pavement'],'graffiti':['graffiti','vandal'],'traffic_signal':['signal','traffic light']}
BASE = {'pothole':60,'streetlight':40,'water_leak':70,'trash':30,'sidewalk':45,'graffiti':15,'traffic_signal':80,'other':30}

def classify_text(text):
    t=text.lower(); scores={c:0 for c in CATEGORIES}
    for cat,kws in KEYWORDS.items():
        for kw in kws:
            if kw in t: scores[cat]+=1
    best=max(scores,key=lambda c:scores[c])
    if scores[best]==0: return 'other',0.4
    return best,min(0.95,0.5+0.1*scores[best])

def severity_from(text,category):
    t=text.lower(); base=BASE.get(category,30); boost=0
    if any(w in t for w in ['injury','accident','danger','urgent','school']): boost+=20
    if any(w in t for w in ['large','deep','major','flooding']): boost+=10
    score=min(100,base+boost)
    label='critical' if score>=80 else 'high' if score>=60 else 'medium' if score>=35 else 'low'
    return score,label,f'base {base}+{boost}={score}'

def detect_duplicates(candidate,existing):
    def tok(s): return set(re.findall(r'\w+',(s or '').lower()))
    ct=tok(candidate.get('title','')+' '+candidate.get('description',''))
    out=[]
    for e in existing:
        if e.get('category')!=candidate.get('category'): continue
        try:
            if abs(e['lat']-candidate['lat'])>0.0005 or abs(e['lng']-candidate['lng'])>0.0005: continue
        except Exception: continue
        et=tok(e.get('title','')+' '+e.get('description',''))
        u=ct|et; sim=len(ct&et)/len(u) if u else 0
        if sim>=0.3: out.append({'id':e['id'],'similarity':round(sim,2),'reason':'same category/location/text'})
    return sorted(out,key=lambda m:-m['similarity'])[:5]

class AgentState(TypedDict):
    text:str; lat:float; lng:float; category:Optional[str]; confidence:float
    severity_score:int; severity_label:str; rationale:str; duplicates:List[dict]; existing:List[dict]

def n_classify(s):
    c,conf=classify_text(s['text']); s['category']=c; s['confidence']=conf; return s
def n_severity(s):
    sc,lab,rat=severity_from(s['text'],s['category']); s['severity_score']=sc; s['severity_label']=lab; s['rationale']=rat; return s
def n_dup(s):
    cand={'title':s['text'][:80],'description':s['text'],'category':s['category'],'lat':s['lat'],'lng':s['lng']}
    s['duplicates']=detect_duplicates(cand,s.get('existing',[])); return s

def build_graph():
    g=StateGraph(AgentState)
    g.add_node('classify',n_classify); g.add_node('severity',n_severity); g.add_node('duplicates',n_dup)
    g.set_entry_point('classify'); g.add_edge('classify','severity'); g.add_edge('severity','duplicates'); g.add_edge('duplicates',END)
    return g.compile()

GRAPH=build_graph()

def run_agent(text,lat,lng,existing=None):
    state={'text':text,'lat':lat,'lng':lng,'category':None,'confidence':0.0,'severity_score':0,'severity_label':'low','rationale':'','duplicates':[],'existing':existing or []}
    out=GRAPH.invoke(state)
    return {'category':out['category'],'confidence':out['confidence'],'severity_score':out['severity_score'],'severity_label':out['severity_label'],'rationale':out['rationale'],'duplicates':out['duplicates'],'model_version':'heuristic-v1'}
