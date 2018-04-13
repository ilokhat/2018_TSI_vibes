# Functional Test

**Todo**

* things to check

## initial view

The view look like that :

![initialView](VIBES/initialView.png)

##Tests for '.obj'

The test is done for one object and two objects '.obj'.

**Drag&Drop '.obj' then an other.**

* see the object(s) on scene
* check buton(s) added on the *Layers* menu folder
* the camera focus on the object location

**Select on the menu one object and drag and drop a '.gibes' then Drag&Drop an other '.gibes', then Drag&Drop the first '.gibes'.**

* 1: location object change (edges and faces)


* 2: location object change for an other place

- 3: location object change for the previous location with the same position
- each: the camera focus on the object location

**Select two object and Drag&Drop a '.gibes'.**

- objects on the same location
- the camera focus on the objects location

**Click on the object.**

* object selected on the menu if not selected before
* object not selected on the menu if selected before

**Select one object and use key bord then do the same for tow object.**

* use keybord and show the good move
  * keys a or 4: West 
  * keys z or  6: East 
  * keys q or 8: North
  * keys s or 2: South 
  * keys w or 7: Top
  * keys x or 3: Down
  * other keys: nothing (arrow move the camera)

**Select one object ...** 

*  clickable button 'stylize object..', 'stylize parts...' & 'Delete layer' are add on the the *Layers* menu folder

**... Select tow object ...**

* only one set of button

**... Unselect all**.

* the clickable button are remove

**Select one object ans click on 'Delete layer' then do the same with two objects.**

* object(s) is(are) removed to the scene
* check buton(s) associated are removed

**Select one object ans click on 'stylize object...' ...**

* new folder added on the menu ('folder n')
* the folder contain:
  *  clickable button: 'Save style', 'Save position', 'Load style', 'Close Symb. n'
  * checkable button: 'Display shaders'
  * sub-folder: 'Position', 'Edges', 'Faces', 'Light'

**... check/uncheck 'Display shaders' ...**

* show/hide shadow

**... on the 'position' folder change value of each parameter ...**

* rotation x: revolve around the x axis
* rotation y: revolve around the y axis
* rotation z: revolve around the z axis
* scale: change the object size
* translation x: move along the x axis
* translation y: move along the y axis
* translation z: move along the z axis
* position x, position y, position z: change the location of the object with the given coordinates (Geocentric coordinate system *WGS84* *EPSG:4978*)
* reset position: place the object a its first position

**... on the 'edges' folder change value of each parameter ...**

* edge color: change the edges color
* edge opacity: change the edges opacity
* edge width: change the edges width
* edge style:
  * continous: continous line
  * dached: dached line
    * add parameter 'Dash Size': change the length of the dash
    * add parameter 'Gap Size': change the length between two dash line
    * the tow parameter are removed when the edge style change
  * Sketchy: complexe style line
    * add parameter 'threshold': change the limit between small and big edges style.
    * add parameter 'Stroke': change the image applaied

**... on the 'faces' folder change value of each parameter ...**

* opacity: change the face opacity
* color, emissive, specular, shininess: change the color and the color effect of the faces. 
* texture: change the texture aplay
  * ' ': no texture
  * other : texture added
  * add parameter 'Texture': change the texture repetition

**... on the 'light' folder change value of each parameter ...**

* color: change the light color associated to the object
* translationx, y & z: change the light position

**... click on 'Close Symb n' ...**

* the symbolizer n is remove
* the object style no change
* the check button of the layer is added on the 'Layer' menu folder

**... open an other 'stylize object...' ... **

* the object style no change
* the parameter value coresponding at the reality

**... click on 'Save style'...**

* a file is saving on the computer (.vibes)

**... change the style and click on 'Load style' and give the saving style or on other style for a global object then do the same with different style (edges line style, texture faces ...) ...**

* the style is apply ant the symbolizer update

**... click on 'Load style' and give a parts style file ...**

* do nothing

**...  Click on 'Save position' ...**

- a file is saving on the computer (.gibes)

**... Do the same with two objects.**

**Select one object ans click on 'stylize part...' ...**

* it do the same that 'stylize object...' but:
  * in the folder 'faces' it have one sub-folber by part of  the object.
  * 'Display shaders' no exist

**... do the same with two objects**

* same nomber of part: part symbolizer open and word for the two object
* different number of part: object symbolizer open. 

**Select one object on the layer and drag and drop a '.vibes'** ...

- the style is apply
- part style: part symbolizer open
- object style: object symbolizer open

**... do the same with two objects**

##Tests for Bati3D

**Click on the 'Load Bati3D' ...**

* the BATI3D is added on ths scene
* a check button is added on the 'Layer' menu folder
* the 'Load Bati3D' button is remove

**... do the same that for the '.obj' with the 'Bati3D and with 'Bati3D' and '.obj' ...**

differences:

* bati3D don't move (the position folder id emty for the 'bati3D' alone)
* for the 'delete layer' :
  * the bati3D is remove to the scene
  * check button is remove the 'Layer' menu folder
  * the 'Load Bati3D' button is added to the menu

##Tests for BDTopo

**Click on the 'Load BDTopo' ...**

- the BATI3D is added on ths scene
- a check button is added on the 'Layer' menu folder
- the 'Load Bati3D' button is remove

**... do the same that for the '.obj' with the 'BDTopo and with 'BDTopo' and '.obj' ...**

*differences:*

- BDTopo don't move (the position folder id emty for the 'BDTopo' alone)
- the sketchy style line can't be apply
- for the 'delete layer' :
  - the BDTopo is remove to the scene
  - check button is remove the 'Layer' menu folder
  - the 'Load BDTopo' button is added to the menu

*particularity:* move the camera for ckeck the style of the other tiles no loaded.

## Test for Camera

**Change all the parameter value**

* reset camera: put the camera at its first place
* vue: load a define camera position and/or orientation 
* longitude, latitude: change camera position ()
* zoom: change camera zoom (Geodetic coordinate system *WSG84* *EPSG:4326*)

