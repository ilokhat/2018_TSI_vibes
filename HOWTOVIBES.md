<p align="center"><img src="Vibes.png" style="width: 400px;"/></p>

# Visualization in iTowns of Buildings Elegantly Stylized

[![Build Status](https://travis-ci.org/arnaudgregoire/vibes.svg?branch=master)](https://travis-ci.org/arnaudgregoire/vibes)


## Summary

1. [Introduction](#introduction)
2. [How to install VIBES ?](#how-to-install-vibes)
3. [How to use VIBES ?](#how-to-use-vibes)
3. [How to develop with VIBES ?](#how-to-develop-with-vibes)


## Introduction

The VIBES (Visualization in iTowns of Buildings Elegantly Stylized) project consists in implementing geovisualisation techniques to stylize buildings on the platform iTowns. This project aims to provide a visual support for city planning, among other purposes.  
  
The user should be able to :
* Load one or several 3D file (of various formats).
* Transform its/their visual aspect(s) using a GUI.
* Save the current style in a JSON-like format (to be defined).
* Load an existing style to re-apply it, including predefined styles (transparent, typical, sketchy).  
  
This project was carried out by a team of seven students from the master TSI of ENSG (Ecole Nationale des Sciences Géographiques).  
It was proposed by Sidonie Christophe, from the COGIT laboratory (IGN), with Alexandre Devaux and Mathieu Bredif as technical support on iTowns.

## How to install VIBES
  
### Locally
  
...

### Online
  
...
  
  
## How to use VIBES
  
### Load an objet
  
#### OBJ
  
Drag and drop
  
#### BATI3D
  
(Locally only) - put files in the folder 
  
#### BD Topo
  
WFS
  

### Geolocalize an objet

(OBJ only)
Select my object (click or check), then :  
* Enter coordinates in the GUI
* Translations / Rotations / Scaling on the GUI
* OR using check keys

Save / load location (drag and drop)
  
### Stylize an object
    
#### Apply my own style

* distinction Stylize Objects / Parts
* describe all functionalities (with images) : opacity, face colors, shininess, texture, edge style...
* save my style
  
#### Load an existing style
  
Drag and drop .vibes
Existing styles : discrete, sketchy, typical
  
  
## How to develop with VIBES
  
Use Vibes in your own iTowns application : 
  
### Load an object
   
Instantiate ModelLoader
parameters :
  
#### OBJ
  
loader.loadOBJ() 
parameters :
  
#### BATI3D
  
loader.loadBati3D() 
parameters :
  
#### BD Topo
  
loader.loadBDTopo() 
parameters :
  
  
### Stylize an object
  
Instantiate Symbolizer
parameters :
public methods :
- initGui() and initGuiAll()
- applyStyle()
- 'change' functions ?
  
## Authors
  
* **Houssem Adouni**
* **El-Hadi Bouchaour**
* **Arnaud Grégoire**
* **Rose Mathelier**
* **Laurie Nino**
* **Adel Ouhabi**
* **Ludivine Schlegel**
