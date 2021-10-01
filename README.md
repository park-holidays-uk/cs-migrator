# cs-migrator
Tool to migrate data into contentstack

This tool assumes you have a database available containing all the latest data.


## Setup a database

To create a database in a docker container run:

```
docker run --name parksData -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root_password -e MYSQL_DATABASE=ph_db -d mysql:5.7
```

This will create a container with a mysql database in it called `ph_db`

You can then populate this database from a dump file by running this command:

```
cat ph_db_with_data.sql | docker exec -i parksData /usr/bin/mysql -u root --password=root_password ph_db

```

Please not this needs to be run from the directory containing your database dump named: `ph_db_with_data.sql`


## Running the migration

This migration assumes you have no entries within Contentstack and already have the required structure setup as Content-types.

First create some usable code: `npm install` followed by `npm run build`

Create a valid `.env` file. The structure and contents can be taken from LastPass.

Followed by using `npm start`.


### cache.json

This migration process keeps track of the newly created entries and its associated ContentStack uid in the cache.json file.

The keys to this object are taken from the entries original id within the parkholidays db.

This will allow us to decipher which records in the old db point to which uid within ContentStack.