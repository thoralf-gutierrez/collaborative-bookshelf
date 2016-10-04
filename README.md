# How to dev

### Install dependencies
```
bower install
npm install
```
You'll also need to have a mongoDB installed.

### Setup mongodb
Create a folder for your db, wherever you like

```
mkdir data
cd data
mkdir db
```

Launch MongoDB with db in the folder just created

```
mongod --dbpath path/to/data/db
```

Create db and user for the app in mongo shell

```
use collaborativebookshelf
db.createUser({user:"collaborativebookshelf",pwd:"collaborativebookshelf",roles:["dbAdmin"]})
```

### Launch app

```
gulp watch-dev
```