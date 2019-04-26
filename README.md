## Weather Buddy

Weather Buddy is a Freshdesk App that helps the Agent in finding current weather in his/her city and weather of other cities on a future date (within 5 days from present day) upon selection and store five recently accessed cities. 

### Folder structure explained
     
          Weather-Buddy
          ├── README.md
          ├── app
          │   ├── app.js                        Js file in which the app logic is written
          │   ├── city-list.js
          │   ├── icon.svg
          │   ├── logger.js                     Custom logger file to aviod logging on console
          │   ├── style.css                     Custom styles
          │   └── template.html                 Markup of the app 
          ├── config
          │   ├── iparam_test_data.json
          │   └── iparams.json                  
          ├── coverage
          │   ├── app
          │   │   ├── app-config.js.html
          │   │   ├── app.js.html
          │   │   ├── city-list.js.html
          │   │   └── index.html
          │   ├── base.css
          │   ├── index.html
          │   ├── prettify.css
          │   ├── prettify.js
          │   ├── sort-arrow-sprite.png
          │   └── sorter.js
          └── manifest.json
