# LAZRewardsPage
Summer internship project with Learning A-Z to redesign their rewards page for Kids A-Z

**IMPORTANT INFORMATION**

The following code is not meant to be used. The rewards page is the page students reach after completing an activity in Kids A-Z, the student interface for Learning A-Z products. In order to showcase the work I have done during the summer, the files I specifically worked on were pulled from the codebase.

In a PHP file, my code is surrounded by: 

```/* -- Feature code -- */``` 

In a JS or HTML file, all the files I created are in the "FrontEndAfter" folder.

The following link contains video demonstrations of the rewards page enhancements as well as a "before" clip to show what the rewards page looked like without my changes:
https://drive.google.com/drive/folders/1Vyo0FnDhWqRNsll77f81kyiPsFhHuwHW?usp=sharing

NEW FEATURES:
- When a student reads a "level up" book, their progress is displayed on the rewards page rather than having to go to the Level Up! bookroom
- The "star splash" animation appears when the student opens the rewards page and has earned stars, rather than after the student has exited the rewards page
- Activity totals shown per activity per module (i.e., if a student does a listening activity in the reading module, they will see the listening activity total for the reading module only; however, if they do a listening activity in the science module, only the listening activity total from the science module will be shown)
- Deliveries (buttons with a read, listen, or quiz icon) are now dynically implemented using AngularJS rather than PHP embedded in HTML
- The "favorite" button has been converted from jQuery to AngularJS
- Upon completion of a quiz, a student is recommended the first incomplete activity they have not yet done (this recommendation system is still very much in its preliminary phases)

All design assets were created by a designer. 
