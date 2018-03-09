
<img src="Vibes.png"/>

# VIBES - Visualization in iTowns of Buildings Elegantly Stylized

[![Build Status](https://travis-ci.org/arnaudgregoire/itowns-style.svg?branch=master)](https://travis-ci.org/arnaudgregoire/itowns-style)

## Summary

1. [Presentation of the project](#presentation-of-the-project)
2. [Project management](#project-management)
3. [Analysis of the existing situation](#analysis-of-the-existing-situation)
4. [Conception](#conception)
5. [First version of the tool](#first-version-of-the-tool)
6. [Next work](#next-work) 
  

## Presentation of the project

The VIBES (Visualization in iTowns of Buildings Elegantly Stylized) project consists in implementing geovisualisation techniques to stylize buildings on the platform iTowns. This project aims to provide a visual support for city planning, among other purposes.  

The user should be able to : 
* Load one or several 3D file (of various formats).
* Transform its/their visual aspect(s) using a GUI.
* Save the current style in a JSON-like format (to be defined).
* Load an existing style to re-apply it, including predefined styles (transparent, typical, sketchy).
  
**[Back to the top](#summary)** 
  

## Project management

This project will be carried out in March and April 2018 by a group of seven students in ENSG TSI, using SCRUM methodology. It will be divided into seven sprints, each one during a week. 
  

### Previsional backlog 
  
The previsional planning is the following :
* **Sprint 1** : analysis, conception, first version of the tool.
* **Sprint 2** : architecture set-up, definition of the 3D style, saving and loading.
* **Sprint 3** : implementation of new parameters including textures on faces and edges.
* **Sprint 4** : diversification of input formats, geolocation.
* **Sprint 5** : advanced parameters including light, shadows, cameras.
* **Sprint 6** : experimentation of existing and new render techniques (default styles, typical, sketchy...)
* **Sprint 7** : finalization, reports, presentation.  
  
### Management tools

* **GitHub** - for code hosting.
* **Travis** - for continuous integration.
* **Easybacklog** - for backlog and planning.
* **Trello** - for task assignment and file sharing.
  
**[Back to the top](#summary)** 
  
  
## Analysis of the existing situation

### The iTowns environment

The main challenge of this project is that it has to be included into the architecture of the existing [iTowns](http://www.itowns-project.org/) project. Therefore, a necessary step is to get to know this architecture and to analyze it in order to know where our new functionalities could be located.

![archi_itowns](itowns_archi.png)


### PLU++

The PLU++ project, developed in 2016 using ThreeJS, will be used as proof of concept to help start our project. To that end, we analyzed the code from the latest version available on github : [IGN/PLU2PLUS](https://github.com/IGNF/PLU2PLUS)

![archi_itowns](plu2plus.png)

The goal of this analysis is to find out how the following things can be done :

* Loading an OBJ file.
* Applying a style to a mesh.
* Changing this style dynamically using a user interface (dat.gui).
  

#### Description of the project

The project consists in a webpage which display a 3D scene that contains a plane geometry with building on it, and a user menu made with dat.gui to change the visual aspect of the buildings (color, opacity, style...) and do some other actions, such as recenter the camera, save the current style, etc.  
  
There are two sorts of buildings :
* **Focus** : the main buildings the user wants to work on, loaded from an OBJ model.
* **Context** : the surrounding buildings, loaded from BDTOPO or BATI3D (also OBJ models).  

[Presentation of PLU2PLUS](http://ignf.github.io/PLU2PLUS/)

#### Structure of the code

The main code is divided into 4 files, as follow :

* **rendu.html** : contains the main work.
* **fonctions_load.js** : contains the utils functions to load 3D files.
* **fonctions_sliders.js** : contains the utils functions to handle the sliders.
* **fonctions.js** : contains other utils functions

#### How does it work ?

1. The user chooses a JSON file as an input, to define the initial style.
2. The GUI is created with those initial parameters.  
(the style - discret, typique, sketchy - determines which parameters of the GUI are visible).
3. ThreeJS materials are initialized with the initial parameters.
4. Event listeners are created on the GUI : each change will be repercuted directly on the materials previously created (for the context) or on each vertice created (for the focus).
5. OBJ models are loaded with the current material.

#### Problems met with this code

Although the PLU++ project successes in creating an easy-to-use interface to dynamically change the stylization of 3D objects through various parameters, its implementation has some limitations : 
* The tool seems to works only with the one set of buildings used as an example. It is not clear whether other datasets can be used as input. However, it would be more interesting to create a more generic stylization tool, to be applied on any 3D objects.
* The tool does not define a clear structure for a stylesheet (only a JSON file to initialize the GUI parameters).
* Finally, the code is not documented, hardly commented, and not well indented. This makes it difficult to read and to re-use.

However, it provides a helpful set of functions that can be re-use in our project, particularly for edges extraction and texture application.


**[Back to the top](#summary)** 

## Conception

### Architecture

The architecture of our project must be included in iTowns. The following schema shows the different functionalities of iTowns, with the ones that interest us in red :  
  
![archi_itowns](itowns_archi2.png)
  
The goal is to make this tool as general as possible, which means it must not depend on just one example (the main flaw with PLU++). On the contrary, it should be usable on any example containing a 3D object on an instance of the globe, as a full-fledged functionality of iTowns. Therefore, we will create a new class Symbolizer, which will manage the menu and the 3D render. We will also extend the loading functionalities of iTowns in order to handle .obj files and other formats.
  

### 3D stylization process

The 3D stylization will be done according to the following activity diagram :
  
![ActivityDiagram](3DStylizationProcess.png)
  

### Style format

Mesh style:

```json
{
    "style": {
        "Opacity": 1,
        "Color": "#ffffff",
        "Emissive": "#ffffff",
        "Specular": "#ffffff",
        "Shininess": 30
    }
}
```
Group style:

```json
{
    "styles": [ 
        {
            "nom": "nom_elemen1",
            "Opacity": 1,
            "Color": "#ffffff",
            "Emissive": "#ffffff",
            "Specular": "#ffffff",
            "Shininess": 30
        },{
            "nom": "nom_elemen2",
            "Opacity": 1,
            "Color": "#ffffff",
            "Emissive": "#ffffff",
            "Specular": "#ffffff",
            "Shininess": 30
        },{
            "nom": "nom_elemen3",
            "Opacity": 1,
            "Color": "#ffffff",
            "Emissive": "#ffffff",
            "Specular": "#ffffff",
            "Shininess": 30
        }]
}
```


**[Back to the top](#summary)** 

## First version of the tool

The first version of our tool, based on the iTowns example "collada", is located on a new example  called "VibesObj". To try it, simply run this example on our fork of iTowns, available at [this adress](https://github.com/arnaudgregoire/itowns-style).
  
This first version provides the following functionalities :
* Loading an OBJ model, create a mesh, display it on the globe and display its edges.
* Modifying the style of the mesh thanks to a user interface (made with dat.gui).

Currently, the implemented parameters are : color, opacity, emissive color, specular color, and shininess. 

We implemented a drag and drop functionality to easily load the 3D object (on .obj format), with a fixed geolocation for now. The example model are located in examples/model. We have been using croutitower.obj, test.obj and destroyer.obj for our tests.

A tool for saving the current style is currently being implemented, and should be functional when the json architecture for the style is definitively defined.

**[Back to the top](#summary)** 

## Next work

The next step of the work will consist in generalizing our tool by setting up the architecture described above (right now, our tests are only located into one example). We also plan on implementing more parameters, similar to those in PLU++, and finalize the saving and loading functionalities.  
  
Another issue concerns the geolocation of .obj files and how that would work : this will be discussed next week.

**[Back to the top](#summary)** 

## Authors

* **Houssem Adouni**
* **El-Hadi Bouchaour**
* **Arnaud Grégoire**
* **Rose Mathelier**
* **Laurie Nino**
* **Adel Ouhabi**
* **Ludivine Schlegel**


**[Back to the top](#summary)** 

