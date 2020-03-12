## Set-up guide for Intermine Data Browser Tool on Windows ##

----------
This tutorial is for anyone out there interested in contributing to this Project (Intermine Data Browser Tool) but finding it difficult to set up their development environment on windows. There is a link to a demo video at the end, if you are not clear about any of the processes written below, you can just watch how I did it in the video. Now, Let’s begin!

Step 1 – Install Node Js
------------------------

 - Download the latest version of node js [here](https://nodejs.org/).
 - Run the `file` as administrator and follow prompt to install *(use all
   default options, no need to change anything)*  See screenshots below:
   ![Click Install](https://komecreates.files.wordpress.com/2020/03/1.png?w=200&h=)![Run](https://komecreates.files.wordpress.com/2020/03/2.png?w=200&h=)![Click next and follow prompt](https://komecreates.files.wordpress.com/2020/03/3.png?w=200&h=)![Accept terms and conditions](https://komecreates.files.wordpress.com/2020/03/4.png?w=200&h=)![Click next](https://komecreates.files.wordpress.com/2020/03/5.png?w=200&h=)![finish](https://komecreates.files.wordpress.com/2020/03/7.png?w=200&h=)

## Step two – Clone Repository ##
This is usually the almighty step. You could end up spending long hours here if you have never used git before (Luckily for me, I already knew how to before now). I have added [a link here to a tutorial that could help you get started on using git terminal on your computer](https://www.youtube.com/results?search_query=github%20tutorial%20for%20beginners%20windows). Please proceed below if you already have git installed on your computer.

**Cloning the git repository: **

 - Navigate to the directory where you want to save the repository on your computer *(Desktop in my case.. See screenshot)*. you can also open the git terminal and type `cd (directoryname)` e.g. `cd desktop` to navigate to the folder where you want to save this project
 - Open the git terminal in this directory.. Check screen shot for how to.
 - Type `git clone https://github.com/intermine/InterMine-Data-Browser-Tool.git`and press enter.. *This will transfer all the files and folders in the cloud repository (github) to your computer and have them ready for you to modify as you please.*
 - Once cloning is completed, **close git terminal**
 
 ![Right click on the directory and click git bash here](https://komecreates.files.wordpress.com/2020/03/11.png?w=200&h=)![Type git clone command](https://komecreates.files.wordpress.com/2020/03/9.png?w=200)![Click enter and wait for cloning to be complete](https://komecreates.files.wordpress.com/2020/03/10.png?w=200)

Step 3- Install dependencies
----------------------------
Don’t be intimidated by this big word, all you need to do is install it. Follow the steps below to install it:

 - Open Command Prompt *if you are on windows like me, Click Start menu Icon and type in command prompt in the search bar.*
 - Navigate to the Intermine Data Browser Tool folder you cloned earlier in Step 2.  **Note -** *To get to a specific directory anytime in the command prompt, type CD, press space bar, followed by folder path (in my case *`CD Desktop/Intermine-Data-Browser-Tool`*, please see screenshots below)*

**Install the dependencies:**

 - Type `npm install` in the command prompt terminal and press enter.. Wait for it to finish building. *(Ensure you are in the root directory of the Intermine Data Browser Tool project) Also, you must have nodejs installed*.
 - Type `npm start` to load a functional prototype of the project. Your browser *(google chrome in my case*) will automatically load the Intermine Data Browser Tool website server. 
 - You can now inspect site and find bugs and/or to get a better understanding of the project you are about to work. 

![Open command prompt](https://komecreates.files.wordpress.com/2020/03/11-1.png?w=200)![navigate to project folder](https://komecreates.files.wordpress.com/2020/03/12.png?w=200)![Type npm install](https://komecreates.files.wordpress.com/2020/03/14.png?w=200)![npm installed completely](https://komecreates.files.wordpress.com/2020/03/15.png?w=200)![Type npm start](https://res.cloudinary.com/kome/image/upload/c_scale,q_auto:best,w_200/v1584019079/npmstart_s8wgue.png)![npm successfully start](https://res.cloudinary.com/kome/image/upload/c_scale,q_auto:best,w_200/v1584019079/browser_started_bhjffh.png)![project loaded on browser](https://res.cloudinary.com/kome/image/upload/c_scale,q_auto:best,w_200/v1584019078/browserworking_copw4m.png)

And Hooray! We are done! Now you can open the project folder on your favorite editor and start working!

**Video demo:**

[![Demo](https://res.cloudinary.com/marcomontalbano/image/upload/v1584016111/video_to_markdown/images/video--25121be504686f7af0cf758d90f13edc-c05b58ac6eb4c4700831b2b3070cd403.jpg)](https://res.cloudinary.com/kome/video/upload/v1583632790/Getting-Started-IntermineDataBrowserTool_bmd9hu.mp4 "Demo")
